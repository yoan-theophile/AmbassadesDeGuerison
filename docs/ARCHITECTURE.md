# Architecture — Ambassades de Guérison

> Vue d'ensemble technique du projet. Le *pourquoi* des choix est dans
> [`decisions.md`](./decisions.md). Le *comment* des composants est dans
> [`../CLAUDE.md`](../CLAUDE.md).

---

## Couches du système

```
┌─────────────────────────────────────────────────────────────┐
│  Navigateur                                                 │
│  Client Components (React) — anon key Supabase              │
│  Leaflet, formulaires, DevOverlay                           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP / fetch
┌────────────────────▼────────────────────────────────────────┐
│  Vercel — Next.js 15 App Router                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Server Components (RSC)  — service_role Supabase   │    │
│  │  app/page.tsx, app/admin/*, app/temoignages/*       │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  API Routes (Edge-compatible Node.js)               │    │
│  │  app/api/**                                         │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  Cron Jobs (Vercel Cron)                            │    │
│  │  /api/cron/dispatch-campaigns (quotidien)           │    │
│  │  /api/cron/auto-decline (quotidien)                 │    │
│  │  /api/cron/send-feedback-emails                     │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │ PostgreSQL (port 6543 — pooler PgBouncer)
┌────────────────────▼────────────────────────────────────────┐
│  Supabase                                                   │
│  PostgreSQL + Auth + RLS + Triggers + Storage               │
└─────────────────────────────────────────────────────────────┘
                     │ API HTTP
┌────────────────────▼────────────────────────────────────────┐
│  Resend                                                     │
│  19 templates TSX (React Email v6) — emails transactionnels │
└─────────────────────────────────────────────────────────────┘
```

---

## Les deux clients Supabase

Règle absolue : deux clients, deux contextes, jamais interchangeables.

| Client | Fichier | Clé utilisée | Respecte RLS | Où |
|--------|---------|-------------|--------------|-----|
| `createServiceClient()` | `lib/supabase/server.ts` | `SUPABASE_SERVICE_ROLE_KEY` | **Non** — bypass RLS | Server Components, API routes |
| `createBrowserClient()` | `lib/supabase/browser.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Oui** | Client Components uniquement |

`service_role` bypass la Row Level Security. Si elle fuit côté client, n'importe qui
peut lire l'intégralité de la base. Le linter de CLAUDE.md interdit l'import de
`lib/supabase/server.ts` depuis un Client Component.

**Port 6543 obligatoire** côté serveur. Les Server Components peuvent créer une connexion
Postgres par requête HTTP. Sans le pooler PgBouncer (port 6543), on dépasse rapidement
la limite de 60 connexions simultanées du plan Supabase gratuit.

---

## Flux de données — Homepage (`/`)

C'est le chemin le plus chargé. Tout tient dans `getHomepageData()`.

```
Visiteur → GET /
  │
  ▼
app/page.tsx (Server Component, revalidate=60s)
  │
  ▼
lib/homepage-data.ts:getHomepageData()
  │  5 requêtes Supabase en parallèle (Promise.all)
  │  ├── nextEvent : prochain event dans le futur
  │  ├── lastEvent : dernier event passé (+ live_link)
  │  ├── totalAmbassadors : COUNT host_profiles WHERE status='validated'
  │  ├── totalCountries : SELECT country GROUP → Set
  │  └── topTestimonials : 20 derniers visibles, triés par longueur, top 5
  │
  ▼
MapWrapper (Client Component, SSR:false pour Leaflet)
  │
  ├── EventBanner  — 4 états selon liveInProgress / nextEvent / lastEvent
  │
  └── MapPublique (dynamic import, ssr:false)
        │
        ▼
      GET /api/host-activations
        │  Requête Supabase service_role
        │  Sélection de l'event de référence :
        │  1. Live en cours (dans la fenêtre WINDOW_H)
        │  2. Prochain event futur
        │  3. Dernier event passé
        │  Retourne les hôtes actifs (is_active=true) pour cet event
        │
        ├── si hosts.length > 0 → pins Leaflet + popup "Contacter"
        └── si hosts.length === 0 → EmptyMapContent (overlay contextuel)
              ├── liveInProgress → "Live en cours / Regarder le live →"
              ├── nextEvent ≤ 2j → "PROCHAIN LIVE / Les ambassades confirment..."
              ├── nextEvent > 2j → "PROCHAIN LIVE / S'afficheront dès confirmation"
              ├── lastEvent only → "Dernier live [date] / Prochain prochainement"
              └── aucun event  → "Pas encore de live prévu / Devenir ambassadeur"
```

**`liveInProgress`** est calculé côté server :
`lastEvent.event_date ≥ now - NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS`
(défaut 4h). Pas de requête DB supplémentaire.

---

## Cycle de vie d'un ambassadeur

```
/inscription
  │  POST /api/inscriptions
  │  → status = 'pending_review'
  │  → email sendRegistrationConfirmation
  ▼
Dashboard admin /admin/ambassadeurs
  │  PATCH /api/admin/ambassadeurs/[id]/status { action: 'pre_approve' }
  │  → status = 'pre_approved'
  │  → email sendPreValidationAccordee (lien questionnaire + vidéo)
  ▼
/dashboard/questionnaire (ambassadeur)
  │  POST /api/ambassadeur/enrichissement
  │  → status = 'enrichment_pending'
  ▼
Dashboard admin (revue du questionnaire)
  │  PATCH /api/admin/ambassadeurs/[id]/status { action: 'validate' }
  │  → status = 'validated'
  │  → email sendBienvenueAmbassadeur + sendNouvelleActivationAdmin
  │  → trigger DB crée host_activations (is_active=false) pour tous les events futurs
  ▼
Hôte visible sur la carte au prochain live
  (après réception de la campagne email et clic sur le lien d'activation)
```

Transitions inverses : `validated ↔ suspended` via
`PATCH /api/admin/ambassadeurs/[id]/status`.

---

## Cycle de vie d'un live (de l'annonce aux pins)

```
David crée le live dans /admin/planning
  │  → INSERT INTO events (title, event_date, live_link, ...)
  │
  ▼
David programme une campagne dans /admin/calendrier
  │  → INSERT INTO scheduled_campaigns
  │  → INSERT INTO campaign_recipients (snapshot des hôtes validés à l'instant t)
  │
  ▼
Cron /api/cron/dispatch-campaigns (quotidien, ou immédiat si scheduled_at ≤ now)
  │  → email sendCampagneAmbassadeurs à chaque recipient
  │     (lien personnalisé avec token d'activation)
  │
  ▼
Hôte clique le lien dans l'email
  │  POST /api/campaign-activations
  │  → host_activations.is_active = TRUE pour cet event
  │
  ▼
Carte publique — le pin apparaît
  │  GET /api/host-activations
  │  → hôte retourné dans la liste, pin Leaflet affiché
  │
  ▼
Pendant le live — visiteur contacte un hôte
  │  POST /api/contact-requests (ou /api/visit-requests)
  │  → email sendContactReceivedHost (notifie l'hôte)
  │  → email sendContactAccepted/Declined selon réponse
  │
  ▼
Après le live
  │  Hôte soumet un signal → POST /api/live-signals
  │  Visiteur soumet un témoignage → POST /api/temoignages
  │  Admin modère → /admin/temoignages
```

---

## Routes API — carte des domaines

| Préfixe | Domaine | Auth requise |
|---------|---------|-------------|
| `/api/host-activations` | Pins carte publique | Non (lecture publique) |
| `/api/contact-requests` | Visiteur → hôte | Non (token dans l'URL) |
| `/api/visit-requests` | Visiteur → hôte (v2) | Non |
| `/api/temoignages` | Soumission témoignage public | Non |
| `/api/testimonials` | Lecture/modération témoignages | Admin |
| `/api/live-signals` | Signaux live depuis dashboard hôte | Session hôte |
| `/api/inscriptions` | Création profil ambassadeur | Non |
| `/api/onboarding/*` | Questionnaire + config onboarding | Session hôte / Admin |
| `/api/ambassadeur/*` | Enrichissement profil | Session hôte |
| `/api/admin/*` | Toutes les actions admin | Admin uniquement |
| `/api/campaign-activations` | Activation hôte via lien email | Token signé |
| `/api/cron/*` | Jobs planifiés Vercel Cron | `CRON_SECRET` header |
| `/api/auth/magic-link` | Génération lien de connexion | Admin |
| `/api/geocode` | Proxy Nominatim (autocomplétion ville) | Non |
| `/api/unsubscribe/[token]` | Désabonnement email campagne | Token |
| `/api/dev/*` | Simulation états DB | Dev uniquement (`NODE_ENV=development`) |

---

## Sécurité — points critiques

**RLS (Row Level Security)** — PostgreSQL garantit qu'un hôte ne peut pas lire les
données d'un autre hôte, sans une ligne de code côté applicatif.
Les policies RLS sont définies directement dans Supabase.

**`service_role` côté serveur uniquement.** Toute route API qui contourne RLS
(admin, cron, inscriptions) utilise `createServiceClient()`.
Toute action initiée par un utilisateur connecté (dashboard, formulaires) utilise
`createBrowserClient()` avec la clé anon — la RLS fait le filtrage.

**Routes admin protégées** via `lib/auth/require-admin.ts` : vérifie
`user_metadata.role === 'admin'` dans la session Supabase.

**Routes cron protégées** via le header `Authorization: Bearer CRON_SECRET`.

**DevOverlay — `NODE_ENV=development` uniquement.** `components/DevOverlay.tsx` et
`app/api/dev/*` vérifient `process.env.NODE_ENV`. Ces routes mutent la DB (dates,
`is_active`) et ne doivent jamais être accessibles en production.

**`/dev/emails` — `EMAIL_PREVIEW=true` uniquement.** La route retourne 404 si la
variable d'environnement n'est pas exactement `"true"` (la chaîne `"false"` est truthy
en JS — le guard utilise `=== 'true'`).

---

## Rendu — Server vs Client

| Composant | Type | Pourquoi |
|-----------|------|---------|
| `app/page.tsx` | Server Component | Fetch Supabase direct, pas d'état client |
| `MapWrapper` | Client Component | Leaflet nécessite `window` |
| `MapPublique` | Client Component (`dynamic`, `ssr:false`) | Leaflet + fetch `/api/host-activations` |
| `EventBanner` | Client Component | Countdown en temps réel (`setInterval`) |
| `DevOverlay` | Client Component | État local + mutations via `fetch` |
| `app/admin/*` | Server Components + Client Components mixtes | Données init en SSR, interactions en client |
| `TemoignageCard` | Client Component | "Lire la suite" (expand/collapse état local) |

**Polling** : `MapPublique` et `AdminFeed` refetchent toutes les 5 secondes.
Pas de WebSocket — Supabase Realtime ajouterait de la complexité pour un usage
qui ne dépasse pas quelques dizaines de connexions simultanées.

---

## Variables d'environnement clés

| Variable | Côté | Rôle |
|----------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Clé publique (RLS active) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server uniquement | Clé admin (bypass RLS) — jamais exposée |
| `RESEND_API_KEY` | Server uniquement | Envoi d'emails |
| `RESEND_FROM_EMAIL` | Server uniquement | Expéditeur (`onboarding@resend.dev` en sandbox) |
| `NEXT_PUBLIC_APP_URL` | Client + Server | URL de base pour les liens dans les emails |
| `NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS` | Client + Server | Fenêtre "live en cours" (défaut : 4h) |
| `NEXT_PUBLIC_ADMIN_TZ_OFFSET` | Client | Offset UTC pour l'admin planning (La Réunion = +4) |
| `CRON_SECRET` | Server uniquement | Authentification des jobs Vercel Cron |
| `EMAIL_PREVIEW` | Server uniquement | Active `/dev/emails` (doit valoir exactement `"true"`) |
| `NODE_ENV` | Server + Build | `development` active le DevOverlay et `/api/dev/*` |
