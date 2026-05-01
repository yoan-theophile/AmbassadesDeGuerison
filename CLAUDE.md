@AGENTS.md

## Projet

DavidTheryApp — Ambassades de Guérison. Next.js 15 + Supabase + Tailwind.

## Testing

```bash
npm run test            # vitest (tests unitaires)
npm run test:e2e        # playwright (E2E, nécessite npm run dev)
```

Tests DB (triggers, RLS) : nécessite `supabase start` (Docker).

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- Supabase : PostgreSQL + Auth magic links + RLS
- Resend : emails (notifications, magic links)
- Leaflet + OpenStreetMap : carte publique
- PWA : manifest + service worker (cache Leaflet tiles)

## Développement local

### Connexion admin sans e-mail (Resend sandbox)

`RESEND_FROM_EMAIL=onboarding@resend.dev` ne livre qu'à l'e-mail du propriétaire du compte Resend. Les adresses de démo (`david.thery@demo.fr`) ne reçoivent rien.

Générer un lien de connexion directement via le terminal :

```bash
node scripts/magic-link.js david.thery@demo.fr
node scripts/magic-link.js theo.nelson.ia@gmail.com
```

Ouvrir l'URL affichée dans le navigateur. Valable 1 heure.

### Reset base de données

```bash
supabase db query --linked --file scripts/reset-db.sql   # recrée le schéma
node scripts/seed.js                                      # insère les données de démo
```

### Comptes de démo créés par le seed

| E-mail | Rôle | Statut |
|--------|------|--------|
| `david.thery@demo.fr` | admin | — |
| `theo.nelson.ia@gmail.com` | admin | — |
| `marie.dubois@demo.fr` | ambassadeur | `validated` |
| `jp.martin@demo.fr` | ambassadeur | `validated` (complet) |
| `sophie.leroux@demo.fr` | ambassadeur | `pending_review` (utile pour tester le dashboard candidature) |

## Pipeline d'activation ambassadeur

Flux admin-driven (self-service supprimé) :

```
/inscription → pending_review → (admin) → pre_approved → enrichment_pending → validated
                                                                              ↕
                                                                          suspended
```

- L'inscription crée le profil avec `status = 'pending_review'`. L'admin valide via `/admin/ambassadeurs`.
- `PATCH /api/admin/ambassadeurs/[id]` : transitions `validated ↔ suspended`.
- `PATCH /api/onboarding/complete` : transition `pending_review → validated` via la page `/onboarding`. Utilisable si on veut réactiver un flux self-service partiel — déclenche `sendNouvelleActivationAdmin` + `sendBienvenueAmbassadeur`.
- Le dashboard (`app/dashboard/page.tsx`) gère : pas de session → `/auth` ; session sans `host_profile` → `/inscription`. Après ces guards, `if (!profile) return null` évite les erreurs TS.
- **Video gate sur `/onboarding`** : la case d'engagement et le bouton de validation restent désactivés jusqu'au premier clic dans la vidéo YouTube. Détection via `window.addEventListener('blur', ...)` + `document.activeElement instanceof HTMLIFrameElement` (plus fiable que l'API postMessage YouTube cross-origin).
- Statuts valides (contrainte CHECK DB) : `pending_review`, `pre_approved`, `enrichment_pending`, `validated`, `suspended`, `rejected`.

## Formulaire d'inscription (`/inscription`)

- **`CityInput`** (`components/ui/CityInput.tsx`) : autocomplétion Nominatim via `/api/geocode`. Le `onChange` expose `(city, lat?, lng?, country?)`. `country` est transmis uniquement lors d'une sélection dans le dropdown (pas lors d'une saisie libre).
- **Validation géocodage** : le bouton "Continuer" (étape 1) est désactivé tant que `form.lat` est absent. Un hint ambre s'affiche si du texte est tapé sans sélection dans la liste — évite les ambassadeurs sans coordonnées invisibles sur la carte (`host-activations/route.ts` filtre `hp.lat && hp.lng`).
- **Auto-remplissage pays** : quand une ville est sélectionnée dans le dropdown, `country` bascule automatiquement sur le pays retourné par le geocoding (ex : sélectionner "Yaoundé" → pays passe à "Cameroun"). Si la sélection ne retourne pas de pays, le champ reste inchangé.
- **`CountrySelect`** (`components/ui/CountrySelect.tsx`) : expose le nom du pays (`"Cameroun"`), pas le code ISO. Pays épinglés : FR, BE, CH, CA, LU, MA, SN, CI, CM.

## Pages admin

| Route | Description |
|-------|-------------|
| `/admin/stats` | Vue générale — KPIs ambassadeurs |
| `/admin/ambassadeurs` | Datatable ambassadeurs — pagination, recherche full text (nom, e-mail, ville), filtres statut, Suspendre/Réactiver |
| `/admin/live` | Feed en direct — signaux live + témoignages du dernier event |
| `/admin/planning` | Gestion des événements (création, modification) |
| `/admin/temoignages` | Modération témoignages — bandeau live actif (titre + badge "N en attente"), stats bar (total/publiés/villes), bouton "Copier le lien", onglets scopés au live, combobox event, recherche multi-mots, pagination, Tout publier |
| `/admin/settings` | Paramètres onboarding — URL vidéo YouTube + chemin PDF |

`/admin/moderation` redirige vers `/admin/live`.

### Config onboarding (`onboarding_config`)

Table singleton (`id = 1`). Accès exclusivement via `createServiceClient()` (bypass RLS).

- `GET /api/onboarding/config` — lecture publique, fallback sur `config/onboarding.ts`
- `PATCH /api/admin/settings/onboarding` — écriture, requiert `role = admin`

Si la table est vide ou `video_url = ''`, le GET retourne les constantes de `config/onboarding.ts`.

## Page d'accueil publique (`/`)

Carte Leaflet plein écran avec :
- **Header** (`AppHeader`) : sous-titre "Groupes de prière — lives de guérison" visible desktop (`hidden sm:block`), sous le nom.
- **EventBanner** : bandeau flottant sur la carte — 4 états selon `liveInProgress` + `nextEvent` + `lastEvent` :
  1. `liveInProgress = true` (event_date ≤ now ≤ event_date + `NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS`) → *"Live en cours — rejoignez-nous"* (indigo, Radio pulsing)
  2. `nextEvent` dans < 7 jours → *"Prochain live dans Xj Xh Xmin"* (countdown, indigo)
  3. `nextEvent` dans ≥ 7 jours → *"Prochain live le {weekday} {day} {month} à {HH}h{mm}"* (blanc, heure en timezone navigateur)
  4. Aucun `nextEvent`, `lastEvent` présent → *"Dernier live il y a X jours — prochainement"* (blanc)
- **Footer** : "Ambassades de Guérison — rejoignez un groupe de prière lors des lives de David Théry" (`text-slate-500`).
- **Popup des pins** : contient une ligne "Lieu de prière — lives de guérison" pour contextualiser l'action Contacter.
- **Recherche par ville** (`MapPublique`) : barre de recherche flottante `absolute top-3 left-3 z-[1000]`, debounce 400ms → Nominatim OSM (`/search?format=json&limit=5&accept-language=fr`). Sur sélection : `map.flyTo([lat, lon], zoom 10)`. Résultats : `display_name` splité sur `", "` pour afficher ville + pays.
  - **Limite Nominatim** : 1 req/s par IP (politique OSM). Le debounce 400ms est suffisant au lancement. **TODO** : évaluer migration vers [Photon (Komoot)](https://photon.komoot.io) (self-hostable, gratuit) ou Mapbox Geocoding (clé API) si trafic simultané > ~50 users ou si Nominatim commence à rate-limiter.
- **État vide** (`MapPublique`) — deux comportements distincts :
  - `hosts.length === 0` (aucun ambassadeur dans le monde) → overlay full-screen centré avec CTA "Devenir ambassadeur" (conditionné à `loaded`).
  - `hosts.length > 0` mais viewport vide au zoom ≥ 5 → hint discret bas-centré "Pas d'ambassade dans ta ville ? / Sois le premier ambassadeur ici →". Seuil 5 = niveau pays (Côte d'Ivoire, France entière). Mécanisme : `hostsRef` + listener `moveend/zoomend` Leaflet + `visibleCount` React state.

## Page témoignages publique (`/temoignages`)

- En-tête : icône `Sparkles` + titre **"Ce que Dieu a fait"** + sous-titre + stats (N témoignages • M villes).
- Filtre par live : `TemoignageLiveFilter` (client component) — `<select>` qui navigue vers `?live=<uuid>`. Filtrage server-side dans la query Supabase.
- Grille 2 colonnes (`sm:grid-cols-2 items-start`) — hauteurs libres par colonne.
- **`TemoignageCard`** (client component) : icône `Quote` indigo en haut, texte sans guillemets, `line-clamp-4` par défaut. Si `scrollHeight > clientHeight`, bouton **"Lire la suite"** apparaît ; **"Réduire"** pour replier.
- Métadonnées : `{first_name}, {city}` (depuis `host_profiles`) OU `{visitor_name}, {submitter_city}` pour les témoignages anonymes + titre du live en indigo.
- Jointure Supabase many-to-one → retourne un objet, pas un tableau. Normaliser avec `Array.isArray ? [0] : direct`.
- CTA "Partage ton témoignage" → `/temoignages/nouveau` (public, sans auth).
- Bouton WhatsApp + copier le lien (`TemoignageShareButtons` client component).

## Page formulaire témoignage (`/temoignages/nouveau`)

- Accès public, aucune authentification requise.
- Formulaire : sélection du live (dropdown), contenu (min 20 / max 2000 chars), prénom + ville (optionnels).
- Submit → `POST /api/temoignages` → `is_visible = false`, va en moderation queue (`/admin/temoignages`).
- Pré-sélection du live via `?live=<uuid>` (passé depuis le filtre de la page principale).
- Schéma DB : `visitor_name` (nom soumissionnaire), `submitter_city` (ville soumissionnaire), `host_profile_id = NULL`, `contact_request_id = NULL`.
- **Migration requise** avant premier usage : `supabase db query --linked --file scripts/migration-testimonials-anon.sql`
  - Supprime `CONSTRAINT chk_testimonial_author` (imposait un auteur identifié)
  - Ajoute colonne `submitter_city TEXT`
  - Ajoute policy RLS `testimonials_anon_insert` (INSERT public sans FK).

## Page planning admin (`/admin/planning`)

- **`PlanningClient`** : date-heure affichée avec `toLocaleString` + `hour: '2-digit', minute: '2-digit', timeZone: 'Indian/Reunion'` dans `EventRow`.
- Labels des formulaires : "Date et heure (heure La Réunion)" pour les champs création et édition.
- Conversion UTC ↔ local via `localInputToUTC` / `utcToLocalInput` avec `NEXT_PUBLIC_ADMIN_TZ_OFFSET`.

## Règles importantes

- `lib/supabase/server.ts` (service_role) : JAMAIS importé depuis un Client Component
- `lib/supabase/browser.ts` (anon key) : uniquement dans les Client Components
- Port 6543 obligatoire pour les connexions Supabase server-side (pooler)
- Feature flags dans `config/features.ts`
- `AdminLayout` contient un bouton "Se déconnecter" en bas de la sidebar (`supabase.auth.signOut()` + `router.replace('/auth')`)

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation

## Design System
Lire DESIGN.md avant toute décision visuelle ou UI.
Couleurs, fonts, spacing, règles responsive — tout est défini là.
Ne pas dévier sans accord explicite.
En mode QA, signaler tout code qui ne suit pas DESIGN.md.
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
