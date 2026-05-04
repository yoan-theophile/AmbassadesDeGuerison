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
│  │  /api/cron/dispatch-campaigns (08:00 UTC)           │    │
│  │  /api/cron/send-feedback-emails (10:00 UTC)         │    │
│  │  /api/cron/check-activations (09:00 UTC)            │    │
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

Pipeline self-service jusqu'au questionnaire — l'admin n'intervient qu'à la fin, sur un dossier complet.

```
/inscription
  │  POST /api/inscriptions
  │  → status = 'pending_review'
  │  → email sendRegistrationConfirmation
  ▼
/dashboard (encart pending_review : vidéo + PDF + checkbox CGU + bouton)
  │  candidat regarde la vidéo, télécharge le guide, accepte les conditions
  │  PATCH /api/onboarding/complete  (auth, plus aucune action admin)
  │  → status = 'pre_approved' (idempotent : 200 noop si déjà ≥ pre_approved)
  │  → log structuré, aucun email envoyé
  ▼
/dashboard/questionnaire (ambassadeur, accessible dès pre_approved)
  │  PATCH /api/ambassadeur/enrichissement
  │  → status = 'enrichment_pending'
  │  → photos requises : profile_photo_url (chemin bucket privé) doit être non NULL
  │  → email sendEnrichissementRecu (notification admin)
  ▼
/admin/ambassadeurs (revue du dossier complet)
  │  PATCH /api/admin/ambassadeurs/[id]/status { action: 'validated' }
  │  → status = 'validated'
  │  → email sendValidationFinale (bienvenue ambassadeur)
  │  → trigger DB crée host_activations (is_active=false) pour tous les events futurs
  ▼
Hôte visible sur la carte au prochain live
  (après réception de la campagne email et clic sur le lien d'activation)
```

Transitions admin valides (`PATCH /api/admin/ambassadeurs/[id]/status`) :
- `validated` (depuis enrichment_pending uniquement)
- `validated_bypass` (escape hatch, depuis n'importe quel statut)
- `rejected` (depuis n'importe quel statut)
- `suspended` (depuis validated)
- `reactiver` (depuis suspended ou rejected, → validated)

L'action `pre_approve` n'existe **plus** côté admin — la transition `pending_review → pre_approved` est exclusivement self-service.

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
  │  → email contact-received-host (hôte notifié + lien /accueillir/[token] + lien /refuser/[token])
  │  → hôte accepte via /accueillir/[token] → email acceptation-visite (adresse + email + WhatsApp de l'hôte)
  │     ou hôte refuse via /refuser/[token] → email refus-visite (visiteur redirigé vers la carte)
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
| `/api/onboarding/complete` | Self-service : pending_review → pre_approved (CGU acceptées) | Session candidat |
| `/api/onboarding/config` | Config vidéo + PDF onboarding | Public (lecture) / Admin (écriture) |
| `/api/ambassadeur/enrichissement` | Enrichissement profil (questionnaire) | Session hôte |
| `/api/ambassadeur/profile` | Édition profil (ville, adresse, consignes, téléphone) | Session hôte |
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

**Photos hôtes — bucket privé.** Le bucket Supabase `ambassador-photos` est `public: false`. Les colonnes `profile_photo_url` et `room_photo_urls` dans `host_profiles` stockent un *chemin* Supabase Storage, pas une URL publique. Lire via `lib/storage/photo-url.ts` : `getOwnerPhotoUrl(path)` pour l'ambassadeur lui-même (signed URL courte), `getAdminPhotoUrl(path)` pour la fiche admin. Jamais exposées sur la carte publique ni les pages `/ambassade/[id]`.

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
| `MissionDuMoment` | Client Component | Carte contextuelle prioritaire — 5 états selon live/demandes/agenda ; `null` si calme |
| `StatusTimeline` | Client Component | Stepper 4-étapes — **uniquement pour non-validés** (`pending_review`, `pre_approved`, `enrichment_pending`) |
| `MesInfosSection` | Client Component | Formulaire édition profil (ville + adresse + consignes + tel) |

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

---

## Inventaire des features — statut opérationnel

Ce tableau est la source de vérité sur ce qui fonctionne réellement en production.
Mis à jour manuellement à chaque PR significative.

> **Légende :**
> ✅ Opérationnel — code + schéma + intégration complets
> ⚠️ Partiel — code existe, lacune bloquante connue
> ❌ Absent — fonctionnalité décidée, pas encore codée
> 💀 Mort — code existe, jamais appelé (aucun déclencheur)

### Features produit

| Feature | Statut | Routes principales | Gap / Note |
|---------|--------|-------------------|------------|
| Carte publique (pins) | ✅ | `GET /api/host-activations` | Cluster auto pour pins co-localisés (groupement par clé `lat,lng`). |
| Géolocalisation auto au premier chargement | ✅ | `MapPublique` → `map.locate()` | Zoom métropole si permission acceptée, vue monde sinon (silencieux). |
| EventBanner (5 états) | ✅ | `lib/homepage-data.ts` → `app/page.tsx` | |
| Overlay carte vide contextuel (7 états) | ✅ | `components/MapPublique.tsx` → `EmptyMapContent` | |
| Inscription ambassadeur | ✅ | `POST /api/inscriptions` | Double validation lat/lng : frontend (`form.lat == null`) + API 400. `host-activations` filtre silencieusement `hp.lat && hp.lng`. |
| Onboarding self-service | ✅ | `PATCH /api/onboarding/complete` | Gate inline dans `/dashboard` pour `pending_review` : vidéo + PDF + CGU + bouton. Idempotent. Aucune action admin requise. |
| Validation finale ambassadeur (admin) | ✅ | `PATCH /api/admin/ambassadeurs/[id]/status` | Actions : `validated` (depuis enrichment_pending), `validated_bypass` (escape hatch), `rejected`, `suspended`, `reactiver`. L'action `pre_approved` a été retirée — transition self-service. |
| Activation via lien email campagne | ✅ | `POST /api/campaign-activations` | |
| Self-activation toggle (dashboard hôte) | ✅ | `PATCH /api/host-activations/[id]` | CTA "Je participe à ce live" / badge "Vous participez" dans `/dashboard` |
| Édition profil ambassadeur | ✅ | `PATCH /api/ambassadeur/profile` | Ville (+ re-géocodage), adresse, consignes, téléphone. Email admin si ville change. |
| Demandes de visite (visiteur → hôte) | ✅ | `POST /api/visit-requests` | Insère dans `contact_requests` (table correcte) |
| Témoignages — soumission publique | ✅ | `POST /api/temoignages` | |
| Témoignages — modération admin | ✅ | `/admin/temoignages` | |
| Campagnes email (programmées) | ⚠️ | `POST /api/cron/dispatch-campaigns` | Code opérationnel — **cron désactivé dans `vercel.json` (hors production)** |
| Feedback post-live visiteurs | ⚠️ | `POST /api/cron/send-feedback-emails` | 3 gaps : `feedback_sent` absent du schéma, bug SQL join — cron désactivé (hors production) |
| Feed live — signaux mains levées | ✅ | `GET /api/live-signals`, `/admin/live` | |
| Clôture live | ❌ | — | Pas de bouton admin. DevOverlay uniquement (dev). **Décision D1 : créer bouton dans `/admin/live`** |
| Multi-admin (gestion équipe) | ✅ | `POST/DELETE /api/admin/team` | Requiert `super_admin`. UI dans `/admin/team` |
| Onboarding questionnaire | ✅ | `/dashboard/questionnaire` + `POST /api/ambassadeur/enrichissement` | |
| Formulaire feedback visiteur | ✅ | `/feedback/[token]` | Route existante, jamais déclenchée automatiquement (cron non actif) |
| Désabonnement email | ✅ | `GET /api/unsubscribe/[token]` | |
| Upload photo ambassadeur | ✅ | `POST /api/upload/ambassador-photo` | Bucket `ambassador-photos` **privé** — stocke un chemin, signed URL via `lib/storage/photo-url.ts` |
| Blacklist | ✅ | `/admin/feedback` + filtre dans routes visiteur | |
| Configuration timing | ✅ | `GET /api/onboarding/config`, `/admin/settings/timing` | |
| Configuration onboarding (vidéo, PDF) | ✅ | `GET/PATCH /api/admin/settings/onboarding` | |
| Geocoding (autocomplétion ville) | ✅ | `GET /api/geocode` | Proxy Nominatim, limite 1 req/s |
| Preview emails (dev) | ✅ | `/dev/emails` | Requiert `EMAIL_PREVIEW=true` |

---

### Gaps schéma confirmés

| Table | Colonne manquante | Impact | Fix |
|-------|------------------|--------|-----|
| `events` | `feedback_sent BOOLEAN DEFAULT FALSE` | Cron `send-feedback-emails` plante au premier run | Ajouter dans `reset-db.sql` + migration |
| `event_timing_config` | `soon_threshold_days INTEGER DEFAULT 2` | Seuil "soon" hardcodé dans `MapPublique.tsx` (ligne 101) | Ajouter colonne + lire depuis DB **Décision D3** |

---

### Crons — état en production

| Cron | Route | Schedule | Statut prod |
|------|-------|----------|-------------|
| Dispatch campagnes | `/api/cron/dispatch-campaigns` | `0 8 * * *` | ⏸ Désactivé (hors production) |
| Feedback post-live | `/api/cron/send-feedback-emails` | `0 10 * * *` | ⏸ Désactivé — **bug SQL join** à corriger avant activation |
| Alerte 0 hôtes actifs | `/api/cron/check-activations` | `0 9 * * *` | ⏸ Désactivé (hors production) |
| Auto-decline visiteurs | `/api/cron/auto-decline` | — | 💀 **Supprimé** (David ne l'a pas demandé) |

---

### Timing config — champs sans cron correspondant (💀 Mort)

| Champ `event_timing_config` | Cron correspondant | État |
|-----------------------------|-------------------|------|
| `campaign_ambassadors_days_before` | `/api/cron/dispatch-campaigns` | ✅ Actif (mais non schedulé) |
| `campaign_visitors_days_before` | `/api/cron/dispatch-campaigns` | ✅ Actif (mais non schedulé) |
| `feedback_days_after` | `/api/cron/send-feedback-emails` | ⚠️ Bug + non schedulé |
| `host_reminder_days_before` | — | 💀 Aucun cron correspondant |
| `visitor_auto_decline_days_before` | `/api/cron/auto-decline` | 💀 Cron supprimé |
| `queue_aging_days` | — | 💀 Aucun cron correspondant |

---

### Variables live window — deux familles (incohérence documentée)

Le calcul "est-ce qu'un live est en cours ?" n'utilise pas la même variable selon le contexte :

| Variable | Défaut | Utilisée dans | Rôle |
|----------|--------|--------------|------|
| `NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS` | 4h | `lib/homepage-data.ts`, `api/host-activations`, `dashboard/page.tsx`, `lib/dev/state.ts` | Fenêtre affichage pins sur carte publique |
| `LIVE_WINDOW_PAST_HOURS` | **6h** | `app/admin/live/page.tsx` uniquement | Fenêtre rétroactive pour le feed admin |
| `LIVE_WINDOW_FUTURE_HOURS` | 4h | `app/admin/live/page.tsx` uniquement | Fenêtre anticipée pour le feed admin |

**Conséquence intentionnelle :** le feed admin (`/admin/live`) voit un live "en cours" pendant 6h après son heure de début, tandis que la carte publique arrête d'afficher les pins après 4h. David peut continuer à surveiller les signaux même après la fermeture de la carte.

**Point d'attention :** si David configure `NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS` à 6h (Q7 de `SCENARIOS_DEMO.md`), les deux familles seront alignées. Si la durée dépasse 6h, il faudra aussi ajuster `LIVE_WINDOW_PAST_HOURS` manuellement dans Vercel.

---

### Bug connu — send-feedback-emails (ligne 38)

```typescript
// BUG : .eq('host_activations.event_id', event.id) sans join Supabase
// → filtre ignoré, retourne TOUS les contact_requests acceptés toutes events confondues
const { data: contacts } = await supabase
  .from('contact_requests')
  .select('id, visitor_email, visitor_first_name, action_token')
  .eq('status', 'accepted')
  .eq('host_activations.event_id', event.id); // ← ne fait rien sans .select('...host_activations(*)')
```

Fix requis avant activation du cron : utiliser un join explicite ou filtrer via `host_activation_id IN (SELECT id FROM host_activations WHERE event_id = ...)`.

---

### Routes API — carte complète

| Préfixe | Domaine | Auth | Statut |
|---------|---------|------|--------|
| `GET /api/host-activations` | Pins carte publique | Non | ✅ |
| `PATCH /api/host-activations/[id]` | Toggle self-activation hôte | Session hôte (RLS) | ✅ |
| `POST /api/visit-requests` | Visiteur → demande contact hôte | Non | ✅ |
| `POST /api/contact-requests` | (alias legacy) | Non | ✅ |
| `POST /api/campaign-activations` | Activation hôte via lien email | Token signé | ✅ |
| `POST /api/temoignages` | Soumission témoignage public | Non | ✅ |
| `GET /api/testimonials` | Lecture témoignages (admin) | Admin | ✅ |
| `POST /api/live-signals` | Signal live depuis dashboard hôte | Session hôte | ✅ |
| `GET /api/live-signals` | Feed signaux (admin/live) | Admin | ✅ |
| `POST /api/inscriptions` | Création profil ambassadeur | Non | ✅ |
| `PATCH /api/onboarding/complete` | Self-service : pending_review → pre_approved | Session candidat | ✅ |
| `GET /api/onboarding/config` | Config vidéo + PDF onboarding (lecture publique) | Public | ✅ |
| `PATCH /api/ambassadeur/enrichissement` | Enrichissement profil (questionnaire, photos) | Session hôte | ✅ |
| `PATCH /api/ambassadeur/profile` | Édition profil (ville, adresse, consignes, tél.) | Session hôte | ✅ |
| `PATCH /api/admin/ambassadeurs/[id]/status` | Validation finale + suspension/réintégration | Admin | ✅ |
| `POST/DELETE /api/admin/team` | Gestion équipe admin | Super admin | ✅ |
| `POST /api/admin/campaigns` | Créer campagne planifiée | Admin | ✅ |
| `GET/PATCH /api/admin/settings/onboarding` | Config vidéo/PDF onboarding | Admin | ✅ |
| `GET /api/admin/settings/timing` | Config timing (lecture) | Admin | ✅ |
| `POST /api/cron/dispatch-campaigns` | Envoi campagnes dues | `CRON_SECRET` | ⏸ Désactivé (hors prod) |
| `POST /api/cron/send-feedback-emails` | Feedback post-live | `CRON_SECRET` | ⏸ Désactivé — bug SQL join |
| `POST /api/cron/check-activations` | Alerte 0 hôtes actifs | `CRON_SECRET` | ⏸ Désactivé (hors prod) |
| `POST /api/cron/auto-decline` | Auto-déclin visiteurs | `CRON_SECRET` | 💀 Supprimé |
| `POST /api/admin/live/close` | Clôturer le live | Admin | ❌ À créer |
| `GET /api/geocode` | Proxy Nominatim | Non | ✅ |
| `GET /api/unsubscribe/[token]` | Désabonnement email | Token | ✅ |
| `POST /api/upload/ambassador-photo` | Upload photo | Session hôte | ✅ |
| `POST /api/visitor-help-request` | Email aide visiteur | Non | ✅ |
| `GET /dev/emails` | Preview emails (dev) | `EMAIL_PREVIEW=true` | ✅ |
| `POST /api/dev/state` | Simulation états DB | `NODE_ENV=development` | ✅ |
| `POST /api/auth/magic-link` | Génération magic link | Admin | ✅ |
