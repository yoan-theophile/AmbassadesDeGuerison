@AGENTS.md
@docs/ARCHITECTURE.md
@docs/knowledge-transfer.md

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
- Resend : emails (notifications, magic links) — templates dans `emails/*.tsx` (React Email v6)
- Leaflet + OpenStreetMap : carte publique
- PWA : manifest + service worker (cache Leaflet tiles)
- Vercel : hébergement production (Fluid Compute, région IAD1 Washington)

## Déploiement Vercel

Projet : **`davidthery-app`** — compte `yoan-theophiles-projects`
- **Production** : https://davidthery-app.vercel.app
- **Dashboard** : https://vercel.com/yoan-theophiles-projects/davidthery-app
- **Lien local** : `.vercel/project.json` (ajouté au `.gitignore`)

### Déployer depuis un SHA git précis (sans les fichiers locaux non committés)

```bash
git archive --format=tgz <SHA> | vercel deploy --archive=tgz --yes --scope yoan-theophiles-projects --prod
# Omettre --prod pour un déploiement preview
```

Préférer cette approche à `vercel deploy` classique quand des modifications non committées sont en cours.

### Variables d'environnement — portées

Toutes les variables sont configurées sur les deux scopes. Seule différence :

| Variable | Production | Preview |
|----------|-----------|---------|
| `EMAIL_PREVIEW` | `false` — `/dev/emails` retourne 404 | **`true`** — route active |

`NEXT_PUBLIC_APP_URL` est `https://davidthery-app.vercel.app` dans les deux scopes (mettre à jour si domaine personnalisé).

Ajouter/modifier les variables : `vercel env add NAME production` ou via l'API REST (token dans `%APPDATA%\com.vercel.cli\Data\auth.json`).

## Développement local

### Preview emails (React Email)

19 templates dans `emails/*.tsx`, composants React Email v6 (import depuis `react-email`).
`lib/email/templates.ts` contient les fonctions `sendXxx` qui utilisent `react:` au lieu de `html:`.

Templates **supprimés** (orphelins — jamais appelés depuis une route) :
- `magic-link-bienvenue.tsx` — variante bienvenue du magic link, redondante avec `registration-confirmation`
- `contact-accepted.tsx` — étape intermédiaire du flux contact, supprimée quand le flux a été simplifié
- `contact-reserved.tsx` — "place réservée" envoyée au visiteur avant acceptation de l'hôte ; supprimée quand le flux a été corrigé (seul `acceptation-visite` est envoyé, après acceptation explicite de l'hôte)

**Preview visuelle** : `localhost:PORT/dev/emails` (ou URL Vercel preview avec `EMAIL_PREVIEW=true`).
Ajouter dans `.env.local` :
```
EMAIL_PREVIEW=true
```
La route retourne 404 en production (sans cette variable).

Données mock dans `emails/__mocks__/index.ts` — basées sur les profils seed (Marie, JP, Sophie).

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

| E-mail | Rôle | Statut | Note |
|--------|------|--------|------|
| `david.thery@demo.fr` | admin | — | super_admin |
| `theo.nelson.ia@gmail.com` | admin | — | super_admin |
| `marie.dubois@demo.fr` | ambassadeur | `validated` | Paris — cluster |
| `jp.martin@demo.fr` | ambassadeur | `validated` | Lyon — complet |
| `sophie.leroux@demo.fr` | ambassadeur | `pending_review` | Bordeaux — test dashboard candidature |
| `lucas.dupont@demo.fr` | ambassadeur | `validated` | Paris — cluster |
| `camille.petit@demo.fr` | ambassadeur | `validated` | Paris — cluster |
| `antoine.moreau@demo.fr` | ambassadeur | `validated` | Paris — cluster (église) |
| `julie.fontaine@demo.fr` | ambassadeur | `validated` | Paris — cluster |
| `theo.garnier@demo.fr` | ambassadeur | `validated` | Paris — cluster |

**Cluster Paris** : 6 ambassadeurs à Paris (Marie + 5 nouveaux) pour tester le rendu Leaflet avec beaucoup de pins dans la même ville. Pour le live J+10, 4 d'entre eux sont activés (Marie, Lucas, Camille, Antoine).

## Crons email

Déclarés dans `vercel.json` (Vercel Cron) et en miroir dans `.github/workflows/` (GitHub Actions, désactivés par défaut) :

| Route | Schedule | Rôle |
|-------|----------|------|
| `/api/cron/dispatch-campaigns` | `0 8 * * *` | Envoie les campagnes planifiées (`scheduled_campaigns`) aux ambassadeurs et visiteurs |
| `/api/cron/send-feedback-emails` | `0 10 * * *` | Envoie les emails de feedback post-live aux hôtes ayant participé |
| `/api/cron/check-activations` | `0 9 * * *` | Envoie `admin-alerte-no-activations` si 0 hôtes actifs pour le prochain live |

**Tous les crons sont désactivés** (`vercel.json` vide) — à réactiver lors du passage en production.

Toutes les routes cron exigent le header `x-cron-secret: $CRON_SECRET`.

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
- `enrichment_pending` requiert `profile_photo_url` non NULL — la route `PATCH /api/ambassadeur/enrichissement` refuse la soumission si la photo de profil n'a pas été uploadée.
- Ambassadeur validé : `PATCH /api/ambassadeur/profile` permet d'éditer ville (+ re-géocodage), adresse privée, consignes et téléphone. Si la ville change, un email `ambassadeur-modification-admin` est envoyé à l'admin. Si `lat`/`lng` sont absents (ville tapée sans sélection dropdown), retourne 400.

## Formulaire d'inscription (`/inscription`)

- **Champs obligatoires étape 1** : Prénom (`first_name`), Nom (`last_name`), E-mail, Téléphone (`phone`), Ville (avec géocodage confirmé), Pays. Le bouton "Continuer" est désactivé tant que l'un de ces champs est vide, que `form.lat == null`, ou que le numéro de téléphone n'est pas valide (`isValidPhoneNumber` de `react-phone-number-input`).
- **`PhoneInput`** (`components/ui/PhoneInput.tsx`) : remplace `<input type="tel">` sur `/inscription` et `MesInfosSection`. Utilise `react-phone-number-input` v3 — sélecteur d'indicatif pays avec drapeau (défaut France), formatage automatique, validation E.164. La valeur stockée en DB et transmise à l'API est en format E.164 (ex : `+33612345678`). Lors du chargement depuis la DB dans `MesInfosSection`, normaliser les espaces : `.replace(/\s+/g, '')` (données legacy peuvent être au format `+33 6 12 34 56 78`).
- **`CityInput`** (`components/ui/CityInput.tsx`) : autocomplétion Nominatim via `/api/geocode`. Le `onChange` expose `(city, lat?, lng?, country?)`. `country` est transmis uniquement lors d'une sélection dans le dropdown (pas lors d'une saisie libre).
- **Validation géocodage** : double couche — (1) frontend : bouton "Continuer" désactivé tant que `form.lat == null`, hint ambre si texte tapé sans sélection ; (2) API : `POST /api/inscriptions` retourne 400 si `lat` ou `lng` absents. Évite les ambassadeurs sans coordonnées invisibles sur la carte (`host-activations/route.ts` filtre `hp.lat && hp.lng`). Le check utilise `== null` (et non `!lat`) pour ne pas bloquer les villes à latitude 0 (équateur).
- **Auto-remplissage pays** : quand une ville est sélectionnée dans le dropdown, `country` bascule automatiquement sur le pays retourné par le geocoding (ex : sélectionner "Yaoundé" → pays passe à "Cameroun"). Si la sélection ne retourne pas de pays, le champ reste inchangé.
- **`CountrySelect`** (`components/ui/CountrySelect.tsx`) : expose le nom du pays (`"Cameroun"`), pas le code ISO. Pays épinglés : FR, BE, CH, CA, LU, MA, SN, CI, CM.
- **Types de lieux** (`TYPES` dans `inscription/page.tsx`) : `individual` → "Domicile — lieu de prière", `church` → "Église — lieu de prière". Labels publics orientés ministère. En admin (`AmbassadeursTable`) : "Domicile" / "Église" (court). Sur la carte (popup) : "Lieu de prière à domicile" / "Lieu de prière en église".

## Pages admin

| Route | Description |
|-------|-------------|
| `/admin/stats` | Vue générale — KPIs ambassadeurs |
| `/admin/ambassadeurs` | Datatable ambassadeurs — pagination, recherche full text (nom, e-mail, ville), filtres statut, Suspendre/Réactiver |
| `/admin/live` | Feed en direct — signaux live + témoignages du dernier event |
| `/admin/planning` | Gestion des événements (création, modification) |
| `/admin/calendrier` | Campagnes email — liste des campagnes planifiées + formulaire pour programmer une campagne ambassadeurs ou visiteurs (`CalendrierCampaignSection`) |
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
- **Popup des pins** : texte conditionné sur `host_type` — "Lieu de prière à domicile" ou "Lieu de prière en église" + action Contacter. Couleurs des pins : domicile = indigo `#4f46e5`, église = violet `#7c3aed` (distinguables à l'œil sur la carte).
- **Recherche par ville** (`MapPublique`) : barre de recherche flottante `absolute top-3 left-3 z-[1000]`, debounce 400ms → Nominatim OSM (`/search?format=json&limit=5&accept-language=fr`). Sur sélection : `map.flyTo([lat, lon], zoom 10)`. Résultats : `display_name` splité sur `", "` pour afficher ville + pays.
  - **Limite Nominatim** : 1 req/s par IP (politique OSM). Le debounce 400ms est suffisant au lancement. **TODO** : évaluer migration vers [Photon (Komoot)](https://photon.komoot.io) (self-hostable, gratuit) ou Mapbox Geocoding (clé API) si trafic simultané > ~50 users ou si Nominatim commence à rate-limiter.
- **État vide** (`MapPublique`) — la carte est vide hors état `live` (is_active=false sur tous les hôtes). Deux comportements distincts :
  - `hosts.length === 0` → composant `EmptyMapContent` affiché — overlay contextuel centré selon l'état de l'app :
    - `liveInProgress && hosts.length === 0` (`live-zero`) → "Live en cours / Les ambassades confirment..." + lien "Regarder le live →" (conditionné à `lastEvent?.live_link`)
    - `nextEvent` dans ≤ 2j → "PROCHAIN LIVE [date] / Les ambassades confirment leur participation..."
    - `nextEvent` dans > 2j (`upcoming`, `blank`) → "PROCHAIN LIVE [date] / Les ambassades s'afficheront dès qu'elles confirmeront..." + stats + "Voir les témoignages →"
    - `lastEvent && !nextEvent` (`closed`, `past`) → "Dernier live [date] / Prochain live annoncé prochainement." + stats + "Partager un témoignage →"
    - Aucun event → "Pas encore de live prévu / Rejoignez la communauté..." + bouton "Devenir ambassadeur" (seul état avec ce CTA)
  - `hosts.length > 0` mais viewport vide au zoom ≥ 5 → hint discret bas-centré "Pas d'ambassade dans ta ville ? / Sois le premier ambassadeur ici →". Seuil 5 = niveau pays (Côte d'Ivoire, France entière). Mécanisme : `hostsRef` + listener `moveend/zoomend` Leaflet + `visibleCount` React state.
  - `live_link` sur `events` : renseigné par David dans `/admin/planning` à la création de chaque live. Propagé via `getHomepageData()` → `lastEvent.live_link`. Utilisé dans l'overlay `live-zero`.

## DevOverlay — simulation d'états (dev uniquement)

`components/DevOverlay.tsx` — bouton `DEV 🔧` coin bas-droit, rendu uniquement si `process.env.NODE_ENV === 'development'`.

Appelle `POST /api/dev/state` qui invoque `lib/dev/state.ts:applyState()`. Les 9 états disponibles :

| État | Label | is_active | liveInProgress | nextEvent |
|------|-------|-----------|---------------|-----------|
| `live` | 🔴 Live | true (tous) | true | J+10 |
| `live-zero` | 🔴 Live (0 confirm.) | false | true | J+10 |
| `soon` | ⏱ Soon 3j | false | false | J+3 |
| `soon-confirmed` | ⏱ Soon 3j ✓ pins | partiel (4 premiers) | false | J+3 |
| `upcoming` | 📅 Upcoming | false | false | J+10 |
| `upcoming-confirmed` | 📅 Upcoming ✓ pins | partiel (4 premiers) | false | J+10 |
| `past` | ⏪ Past | false | false | aucun |
| `closed` | 🔚 Closed | false | false | J+10 |
| `blank` | 🫙 Blank 0 confirm. | false | false | J+10 (is_active=false) |

**Règle critique** : seuls `live` et `live-zero` ont `event_date` dans la fenêtre live (`NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS`). `soon-confirmed` et `upcoming-confirmed` activent 4 `host_activations` sur l'événement futur — les pins apparaissent sur la carte avant le live, simulant des ambassadeurs qui ont cliqué tôt sur le lien de campagne. Tous les autres états ont `is_active=false` → carte vide → overlay contextuel affiché.

**Fix `closed`** (commit 56a4d30) : l'état `closed` remet `demoFutureEvent` à J+10. Sans ce fix, après `past → closed`, evtFutur restait à J-10 ce qui maintenait l'overlay "Dernier live" au lieu de "Dernier live + prochain annoncé".

Le DevOverlay inclut aussi une section Magic Link rapide pour se connecter en tant que `david.thery`, `theo.nelson.ia`, ou `marie.dubois` sans passer par Resend.

## Page témoignages publique (`/temoignages`)

- En-tête : icône `Sparkles` + titre **"Ce que Dieu a fait"** + sous-titre + stats (N témoignages • M villes).
- Filtre par live : `TemoignageLiveFilter` (client component) — dropdown custom (pas `<select>` natif) avec recherche intégrée, navigue vers `?live=<uuid>`. Filtrage server-side dans la query Supabase. Affiché en ligne avec le CTA "Partager le mien" (lien discret) visible dès l'arrivée.
- Colonne unique (`flex flex-col gap-4`) — meilleure lisibilité pour du contenu textuel long.
- Pagination 20 par page (param `?page=N`), identique à `/admin/ambassadeurs`. `getTemoignages` accepte `page` + retourne `total` via `{ count: 'exact' }`. Stats (N témoignages, M villes) calculées sur l'ensemble, pas seulement la page courante (`getTotalCities` requête séparée).
- **`TemoignageCard`** (client component) : icône `Quote` indigo en haut, texte sans guillemets, `line-clamp-4` par défaut. Si `scrollHeight > clientHeight`, bouton **"Lire la suite"** apparaît ; **"Réduire"** pour replier.
- Métadonnées : `{first_name}, {city}` (depuis `host_profiles`) OU `{visitor_name}, {submitter_city}` pour les témoignages anonymes + titre du live en indigo.
- Jointure Supabase many-to-one → retourne un objet, pas un tableau. Normaliser avec `Array.isArray ? [0] : direct`.
- CTA principal "Partage ton témoignage" en bas de page. CTA discret "Partager le mien" visible à côté du filtre (accessible sans scroller).
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

## Dashboard ambassadeur (`/dashboard`)

Page centrale de l'ambassadeur. Server Component principal, hydraté par plusieurs Client Components.

- **Encarts contextuels selon le statut** (dans le bloc `isOnboarding`) :
  - `pending_review` → encart ambre "Ta candidature a bien été reçue !" + attente email + invite à regarder la vidéo
  - `pre_approved` → encart indigo "Félicitations, tu as été pré-approuvé !" + CTA `/dashboard/questionnaire`
  - `enrichment_pending` → encart violet "Ton dossier est en cours d'examen"
  - Document PDF et bouton "j'accepte les conditions" : **intentionnellement absents** — ils appartenaient à l'ancien flux self-service (`/onboarding`), supprimé quand le pipeline est passé admin-driven.
- **`MissionDuMoment`** (`components/dashboard/MissionDuMoment.tsx`) : carte contextuelle prioritaire en haut du dashboard pour les ambassadeurs `validated`. 5 états selon la priorité décroissante : (1) signal approuvé → invite à rejoindre le live (emerald) ; (2) signal envoyé → "en attente de David" (indigo atténué) ; (3) live en cours sans signal → formulaire de signal (indigo) ; (4) demandes en attente → nudge amber ; (5) live dans ≤ 3 jours non confirmé → nudge bleu discret. Retourne `null` si aucune condition active.
- **`StatusTimeline`** (`components/dashboard/StatusTimeline.tsx`) : stepper 4 étapes **affiché uniquement pour les ambassadeurs non-validés** (`pending_review`, `pre_approved`, `enrichment_pending`). Étapes : Inscription → Pré-approbation → Profil enrichi → Validation finale. Mappé sur `host_profiles.status` via `STATUS_TO_STEP`. Absent du dashboard pour les `validated` (ils ont terminé leur parcours).
- **Ordre des sections pour `validated`** : MissionDuMoment → Mes lives → **Mes demandes** (remonté — urgences prioritaires) → Témoignage live (si live en cours) → Mon ambassade → Photos → MesInfosSection → **Formation (collapsée par défaut)**.
- **Formation collapsée par défaut** : bouton toggle "Formation ambassadeur" toujours visible ; l'iframe YouTube ne se monte qu'après le clic (`showFormation` state). Pour `enrichment_pending` et autres non-validés, la formation est affichée immédiatement (onboarding).
- **Section "Mes lives"** : pour chaque `host_activation`, affiche une carte CTA :
  - Inactif → bouton plein indigo "Je participe à ce live" (`PATCH /api/host-activations/[id]`)
  - Actif → badge vert "Vous participez à ce live" + bouton secondaire "Annuler ma participation"
- **Section "Mes demandes"** : carte enrichie par demande — nom visiteur, live concerné, horodatage relatif (`Intl.RelativeTimeFormat`), message déplié (pas de `line-clamp`), boutons Accepter/Refuser.
- **Section "Modifier mes photos"** : affichée uniquement si `status === 'enrichment_pending'` OU si l'ambassadeur clique sur le bouton toggle. Section cachée par défaut pour un ambassadeur validé.
- **`MesInfosSection`** (`app/dashboard/MesInfosSection.tsx`) : visible uniquement pour un ambassadeur `validated`. Formulaire édition ville + pays + adresse privée + consignes + téléphone. `CityInput` : si ville tapée sans sélection dropdown, `cityConfirmed = false` → hint ambre + blocage du submit. `PhoneInput` : valeur initialisée avec `.replace(/\s+/g, '')` pour normaliser les données legacy vers E.164.

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
- `profile_photo_url` et `room_photo_urls` stockent un **chemin** Supabase Storage (ex : `ambassador-photos/uuid/photo.jpg`), pas une URL publique. Bucket privé. Toujours lire via `lib/storage/photo-url.ts` : `getOwnerPhotoUrl(path)` (ambassadeur) ou `getAdminPhotoUrl(path)` (admin). Ne jamais exposer sur la carte publique.

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
