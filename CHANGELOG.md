# Changelog

All notable changes to this project will be documented in this file.

## [0.1.9.0] - 2026-08-07

### Added
- **Notification de refus de candidature** (`sendRefusCandidature`) : un candidat refusé reçoit désormais un email — message sobre + raison optionnelle reprise du champ notes admin, plutôt qu'un silence total. Alignement avec le principe déjà en place pour le refus de visite (pas de shadow-ban, David ne laisse jamais un candidat sans réponse).

### Changed
- **Photo du lieu d'accueil devient obligatoire** au questionnaire d'enrichissement (`/dashboard/questionnaire`) — retrait des mentions "optionnel" côté texte, garde serveur 400 si aucune photo n'est fournie (`PATCH /api/ambassadeur/enrichissement`). Un dossier ambassadeur incomplet (aucune photo du lieu) ne peut plus atteindre l'étape de validation admin.
- **Ergonomie de validation des dossiers ambassadeur** (`/admin/ambassadeurs`) : nouveau bloc "Engagement spirituel" mis en avant dans le panneau déplié, signal visuel de dossier incomplet (badge "N manquant(s)") visible sans déplier la ligne, lightbox photo avec navigation clavier, et vue carte empilée sous 640px pour éviter le scroll horizontal du tableau à 9 colonnes.
- **`reactiver` (réintégration depuis suspendu/refusé) revérifie désormais que le dossier est complet** avant de restaurer `validated` — sinon renvoie à `enrichment_pending` sans email. Empêche de valider silencieusement un candidat refusé avant d'avoir jamais complété son questionnaire (même risque que l'escape hatch `validated_bypass`, mais accessible depuis un bouton UI standard).
- **Échecs d'envoi d'email désormais logués** (`lib/email/send.ts`, `POST /api/inscriptions`) au lieu d'être avalés silencieusement (`.catch(() => {})`) — un envoi Resend ou Mailhog en échec remonte dans les logs serveur avec le destinataire et le sujet.

### Fixed
- **Bandeau "Live en cours" resté affiché après clôture** : `GET /api/host-activations` excluait déjà `closed_at` pour les pins carte, mais `lib/homepage-data.ts` (bandeau homepage) ne le faisait pas — un live clôturé continuait d'apparaître "en cours" jusqu'au changement de fenêtre horaire.
- **Placeholders factices retirés du header** et flux de connexion clarifié (`AppHeader`, `MonEspaceLink`).
- **Formulaire de témoignage remonté au-dessus de la liste des lives** sur le dashboard hôte — l'ancien ordre enterrait le CTA sous une liste qui pouvait être longue.
- **Bug Mailhog localhost IPv4/IPv6 intermittent documenté et corrigé** : `MAILHOG_SMTP_HOST=localhost` pouvait résoudre vers IPv4 ou IPv6 selon l'environnement (Docker Desktop/WSL2 Windows), causant des échecs d'envoi silencieux et non reproductibles. Fix : forcer `127.0.0.1`, plus un transport SMTP non partagé par envoi (filet de sécurité contre les connexions keep-alive qui traînent fermées).

### Internal
- **`lib/host-profile.ts`** : nouveau helper partagé `isDossierComplet()` — la logique "photo profil + ≥1 photo lieu" était dupliquée dans 3 fichiers (route admin, dashboard, StatusTimeline), source unique de vérité désormais.
- 7 nouveaux fichiers de tests unitaires (garde-fous reactiver/enrichissement, template email refus, gestion d'erreur email, événement clôturé, gaps questionnaire) — couverture du diff à 83%, incluant un test de régression sur la transition `reactiver`.

### QA
- ✅ 232 tests unitaires vitest passent.
- ✅ Typecheck TypeScript propre.
- ✅ Review pre-landing (5 findings informationnels, 0 critique) : dette technique dupliquée extraite, doc QA obsolète mise à jour.
- ✅ Review adversariale (Claude) : aucune vulnérabilité introduite — les changements `reactiver`/`enrichissement` ferment une faille de dossier incomplet pré-existante plutôt que d'en ouvrir une.

## [0.1.8.0] - 2026-07-28

### Added
- **Message de présentation ambassadeur** (`presentation_message`, 240 caractères max, optionnel) : 2-3 lignes affichées dans le popup carte (pin individuel + lignes actives de cluster), avec avatar photo. Un visiteur qui survole une ambassade voit maintenant qui il va rencontrer, pas juste "Domicile" ou "Église".
- **Photo ambassadeur dans le popup carte** : signed URL 24h (`getPublicMapPhotoUrls`, cache en mémoire), uniquement pour les hôtes actifs — jamais l'adresse. Toutes les photos uploadées sont converties en WebP compressé (`lib/image/compress-photo.ts`, Sharp) : profil 512×512 cover-fit, lieu max 1200px contain-fit.
- **Adresse précise ambassadeur** (`AddressInput`, autocomplétion Nominatim `mode=address`) → `lat_precise`/`lng_precise`, **jamais publics**. Sert uniquement au calcul de distance ci-dessous. Distinct de `quartier` (texte libre public déjà existant).
- **Distance visiteur ↔ ambassadeur, sans jamais stocker où vit le visiteur** : bouton "Trier par distance" dans les popups de cluster (≥ 2 hôtes) — géolocalisation navigateur déclenchée explicitement, jamais auto-appelée. `POST /api/distance` calcule côté serveur (Haversine, arrondi à l'entier km — mitigation anti-triangulation), rate-limité 8 req/min/IP, ne retourne jamais de coordonnées. Voir `docs/decisions.md` pour le raisonnement complet (le besoin réel de l'ambassadeur, c'est le téléphone du visiteur pour l'appeler — pas son adresse).
- **Profil visiteur réutilisable** (`visitor_profiles`) : un visiteur qui contacte plusieurs ambassades n'a plus besoin de retaper email/téléphone à chaque demande. Créé automatiquement (best-effort) à la première demande de visite, connexion par magic link (même mécanisme que les ambassadeurs). Nouvel espace minimal `/mon-espace` (email + téléphone éditable). `ContactForm`/`VisitRequestForm` préremplissent si une session existe.
- **Téléphone visiteur obligatoire** sur les 3 surfaces de demande de visite (`contact_requests.visitor_phone NOT NULL` + validation client `isValidPhoneNumber`). Permet à l'hôte d'appeler directement le visiteur en cas de besoin.
- **Feedback bidirectionnel post-live** : en plus du feedback visiteur → hôte existant, un ambassadeur peut désormais noter les visiteurs reçus (`/feedback/host/[token]`, "seriez-vous à l'aise que cette personne revienne ?"). Réponse négative → case "Bloquer ce visiteur" optionnelle.
- **Blacklist scopée par-ambassadeur** (`blacklist.host_profile_id`, nullable) : en plus du blocage global existant (`/admin/blacklist`), un ambassadeur peut désormais bloquer un visiteur spécifique uniquement pour ses propres futures demandes, directement depuis son formulaire de feedback.
- **`/admin/feedback` enrichie** : 2 onglets — "Signalements" (modération existante) et "Toutes les notations" (filtres event/direction, tri récent/score) pour voir l'ensemble des feedbacks bidirectionnels.
- **Page `/decouvrir`** : réassurance + 3 étapes concrètes + FAQ accessible (`FaqAccordion`, touch targets 44px) + témoignage vedette (fallback sur le plus récent publié si aucun pour le prochain live) + CTA retour carte. CTA discret "C'est votre première fois ?" sur la carte publique (coin bas-droit, masquable, mémorisé `localStorage`).
- **Helper text inline** sur les champs critiques (`/inscription`, formulaires de contact visiteur, dashboard) — explique pourquoi l'email et le téléphone sont demandés (connexion par magic link, contact direct hôte↔visiteur).

### Fixed
- **Rate-limit `/api/auth/magic-link`** (3 req/min/IP) — la route génère un lien de connexion admin pour n'importe quel email, non protégée jusqu'ici.
- **Bug SQL `send-feedback-emails`** : le filtre `.eq('host_activations.event_id', ...)` sur une relation non jointe était un no-op silencieux et retournait tous les `contact_requests` acceptés toutes events confondues. Remplacé par une requête en deux temps (`host_activation_id IN (...)`). Cron toujours désactivé hors production, mais le bug ne bloque plus son activation future.
- **Bucket `ambassador-photos` privé** : `reset-db.sql` créait le bucket en `public: true`, contredisant le reste du schéma (policies RLS owner-scoped). Corrigé en `public: false` avec les policies alignées.
- **Dédup suggestions ville** (`/api/geocode`) : Nominatim retourne parfois deux entités pour la même ville avec des coordonnées légèrement différentes, produisant deux options indiscernables dans le dropdown d'autocomplétion. Dédup par label plutôt que par coordonnées. (Trouvé par `/qa`.)
- **Indicatif téléphone verrouillé** (`PhoneInput`, `countryCallingCodeEditable={false}`) : sélectionner tout le champ et retaper juste le numéro national pouvait faire basculer silencieusement l'indicatif vers un autre pays détecté dans les chiffres tapés — risque de numéro de contact erroné. Changer de pays passe désormais uniquement par le sélecteur drapeau. (Trouvé par `/qa`.)

### Removed
- **`POST /api/contact-requests`** (route legacy) : référençait une colonne inexistante (`visitor_whatsapp`), jamais appelée par le frontend. `/api/visit-requests` est la seule route de création de demande de visite.
- **`emails/contact-reserved.tsx`** et `sendContactRequestReserved` : la doc affirmait ce template supprimé depuis mai 2026, mais le fichier et son câblage (`templates.ts`, `/dev/emails`) existaient toujours sans être appelés par aucune route réelle. Nettoyage pour aligner le code sur la documentation.

### Rationale produit
Ce lot répond directement aux retours réels de David sur le design doc du 12 mai (téléphone visiteur obligatoire, adresse précise pour calculer les distances, message de présentation ambassadeur, popup "première fois — découvrir"). Le point le plus structurant : en creusant le besoin "adresse visiteur pour calculer la distance", il s'est avéré que l'ambassadeur n'a pas besoin de savoir où vit le visiteur — juste de pouvoir l'appeler (téléphone, déjà collecté). La géolocalisation éphémère + Haversine arrondi au km résout le vrai problème sans introduire de PII visiteur superflue. Détail complet dans `docs/decisions.md`.

### QA
- ✅ 177 unit tests vitest passent.
- ✅ Vérification manuelle (browse tool) : `/decouvrir`, accordéon FAQ, CTA carte (affichage + fermeture + persistance localStorage après rechargement), flux profil visiteur bout-en-bout (demande → compte créé → magic link → `/mon-espace` → préremplissage).
- ✅ `e2e/rls-isolation.spec.ts` étendu : `lat_precise`/`lng_precise` jamais dans `/api/host-activations`, `/api/distance` ne fuite jamais de coordonnées, rejette > 20 host_ids et latitude invalide.
- ✅ Build Next.js + typecheck passent.

### Docs
- `docs/ARCHITECTURE.md` : nouvelle section "Profil visiteur réutilisable + distance éphémère", routes API mises à jour, bug SQL `send-feedback-emails` marqué résolu, tableau des features complété.
- `CLAUDE.md` : nouvelles sections profil visiteur, distance, feedback bidirectionnel ; `/admin/feedback` ajoutée au tableau des pages admin.
- `docs/knowledge-transfer.md` : 12 → 15 tables, 19 → 20 templates.
- `docs/decisions.md` : 2 nouvelles décisions (distance sans adresse visiteur, profil visiteur par magic link).
- `README.md` : fonctionnalités visiteur/ambassadeur à jour, compteur templates corrigé.
- `DESIGN.md` : 3 nouvelles décisions (touch targets FAQ, position CTA carte, pattern AddressInput).

## [0.1.7.0] - 2026-05-07

### Added
- **`/admin/stats` refondue : "À noter depuis le dernier live"**. Panneau factuel sobre qui remplace les 4 KPIs incohérents par 4 sections actionnables :
  - **À traiter** : pointeurs vers les pages d'action (candidats à valider, témoignages à modérer, signalements feedback). Camille trouve sa file en haut. Vide → "Rien à traiter en ce moment."
  - **Témoignages récents** : 3 derniers témoignages publiés depuis le dernier live, avec extrait + prénom + ville. Section masquée si vide.
  - **Ambassades à vérifier** : max 5 ambassadeurs avec un label de contexte factuel non-accusatoire (Profil incomplet, Validée mais jamais activée, Inactive depuis 2 lives, Ville sans demande visiteur ce live, Validée il y a ≥ 3 mois 0 accueil). Premier match wins. Click → fiche admin de l'ambassadeur.
  - **Snapshot footer** : totaux globaux (N ambassades · N pays · N témoignages · N visiteurs accueillis).
- **Helpers admin factorisés** :
  - `lib/admin/event-window.ts` : `getCurrentEvent()` + `getCurrentEventWindow()` réutilisés par `/admin/live` et `/admin/stats` (factorisé depuis `app/admin/live/page.tsx`).
  - `lib/admin/stats-helpers.ts` : 4 agrégats (`getActionQueue`, `getRecentFruits`, `getHostsToCheck`, `getSnapshotTotals`) avec try/catch fail-safe.
  - `lib/admin/context-label.ts` : pure function `computeContextLabel()` + mapping FR. Premier match wins.
  - `lib/admin/page-view-log.ts` : tracking d'usage en stdout JSON (queryable dans Vercel logs). Permet de mesurer si David ouvre vraiment la page après chaque live, avant d'enrichir vers une V2 (cf TODO-22).
- **Indexes performance DB** : `idx_host_activations_lookup`, `idx_contact_requests_activation_status`, `idx_testimonials_event_visible`. Permettent à `getHostsToCheck` de scaler à 1000+ ambassadeurs.
- **Tests** : 12 unit tests vitest (`tests/unit/admin/context-label.test.ts` couvrant les 5 conditions + premier match wins + multi-match + null edge case ; `tests/unit/admin/page-view-log.test.ts` couvrant écriture JSON + swallow errors + input dégénéré). 1 helper mock Supabase factorisé (`tests/unit/helpers/mock-supabase.ts`). 2 E2E playwright (`e2e/admin-stats-briefing.spec.ts` smoke tests + extension `e2e/regression.spec.ts` pour la régression `/admin/live`).

### Changed
- **`app/admin/live/page.tsx`** : `getCurrentEvent()` extrait et importé depuis `lib/admin/event-window.ts`. Comportement identique, mais helper réutilisable.

### Rationale produit
Pivot après CEO review du 2026-05-07 + Codex outside voice. La V1 originale du plan ("Le Briefing du Berger") proposait un narrative pastoral templaté + email digest hebdo + mailto pré-rempli. Codex a fait remonter un risque majeur : *« construire un OS pastoral avant de valider que le pasteur a l'habitude d'ouvrir cette page »*. Plus le risque "uncanny pastoral" du narrative templaté qui sonne faux à la 3e lecture. La V1 shippée est volontairement sobre et factuelle. L'usage sera mesuré (page_view stdout) avant d'enrichir vers une V2 (TODO-22 : narrative restraint validé par David + mailto avec templates pastoraux + email digest hebdo).

### QA
- ✅ Playwright MCP en local : page rend les 4 sections avec données seed réelles (2 candidats / 2 témoignages / 1 signalement / 3 témoignages cards / 5 ambassades à vérifier / footer 14 ambassades · 7 pays · 12 témoignages · 4 visiteurs).
- ✅ Régression `/admin/live` : page charge sans erreur, `getCurrentEvent` factorisé fonctionne identiquement.
- ✅ Build Next.js + 169/169 unit tests + ESLint + typecheck passent.

## [0.1.6.0] - 2026-05-07

### Added
- **Pins grisés sur la carte publique** : les ambassadeurs validés mais inactifs (`is_active=false`) apparaissent en gris au lieu d'être masqués. Popup contextuel : "Pas encore confirmé" hors-live, "Pas disponible" pendant le live. Cluster regroupé en deux sections (Disponibles / En attente). Closes TODO-19.
- **Groupes femmes** (`is_women_only`) : nouveau flag sur les ambassades de type "Domicile" pour signaler un groupe réservé aux femmes. Badge rose visible sur la fiche publique, dans le récap d'inscription et sur le dashboard. Pin spécifique sur la carte. Côté API, `is_women_only` est automatiquement remis à `false` si le type passe à "church" (defense-in-depth applicative).
- **Timezone navigateur** : nouveau hook client `useBrowserTimezone()` qui détecte le fuseau du visiteur et l'affiche sur EventBanner / Dashboard / MapPublique (ex : "heure de Paris", "heure d'Abidjan"). Côté serveur, `formatEventDateDual()` affiche systématiquement "La Réunion + Paris" pour les emails (David vit à La Réunion, Camille en France).
- **Indexes performance** ajoutés : `idx_host_activations_lookup`, `idx_contact_requests_activation_status`, `idx_testimonials_event_visible`.
- **TODO-21** (CP2 — tracking recherches vides + auto-suggestion villes) et **TODO-22** (CP1 — briefing pastoral V2 conditionnel à mesure d'usage) ajoutés. Issus du CEO review + Codex outside voice 2026-05-07.

### Changed
- **`/admin/planning` supprimée** : la création/modification de lives est intégrée dans `/admin/calendrier` (section Lives). Le lien sidebar pointe désormais vers `/admin/calendrier`. Réduit la fragmentation de l'admin.
- **Blacklist : refus honnête (403)** au lieu de shadow-ban. Choix éthique documenté dans CLAUDE.md (« Modération anti-abus visiteur ») : message neutre + voie de recours, pas de faux 201 silencieux. Renomme aussi `added_at` → `created_at` pour cohérence schéma.
- **Inscription** : récap étape 3 affiche désormais "Groupe réservé aux femmes" si la case a été cochée étape 2. Le candidat voit ce qu'il s'apprête à confirmer.
- **Questionnaire ambassadeur** : cap 500 caractères retiré du champ "Parcours personnel". Les ambassadeurs peuvent raconter leur histoire sans contrainte arbitraire.
- **Carte / formulaire visiteur** : retrait colonne `contact_mode` (legacy), formulaire de contact simplifié.

### Fixed
- **Récap inscription `is_women_only`** : la checkbox cochée à l'étape 2 n'apparaissait nulle part dans le récapitulatif de l'étape 3. Corrigé.
- **Badge OG** (5 itérations) : retrait edge runtime sur `app/ambassade/[id]/badge/route.tsx` (incompatible avec `@supabase/supabase-js`), `satori` exige template string et non JSX, `Cache-Control` restauré, vocabulaire aligné sur le reste du site.
- **Timezone côté serveur** : `formatEventDateDual` évite que Vercel IAD1 (UTC-4/-5) affiche une heure incorrecte dans les emails — toujours "La Réunion + Paris" explicitement.

### Docs
- ARCHITECTURE.md : tableau "Gaps schéma confirmés" mis à jour (les colonnes `events.feedback_sent` et `event_timing_config.soon_threshold_days` sont désormais présentes). Clôture live passée à ✅. Route `POST /api/admin/live/close` passée à ✅.
- TODOS.md : TODO-19 (pins inactifs) marqué COMPLETED.
- TODOS.md : ajout TODO-21 et TODO-22 (cherry-picks différés du CEO review).

## [0.1.5.0] - 2026-05-06

### Added
- **Photos ambassadeurs visibles dans `/admin/ambassadeurs`** : avatar 32px dans la colonne Nom + galerie complète (photo de profil + photos du lieu) dans le panneau étendu. Signed URLs 1h générées server-side via `getAdminPhotoUrl` (bucket privé). L'admin peut désormais valider un dossier en voyant les photos.
- **Champ `quartier` sur les fiches publiques d'ambassade** : affiché en `text-slate-400` sous "Ville, Pays" sur `/ambassade/[id]` et `/live/[event_id]/ambassade/[host_id]`. Donne un signal de proximité immédiat au visiteur. Cohérent avec l'affichage déjà en place dans les popups de la carte.
- **Sidebar admin pinné** (`components/AdminLayout.tsx`) : `sticky top-0 h-screen self-start` — le sidebar reste visible au scroll, les liens du bas (Carte publique, Se déconnecter) ne disparaissent plus sous le pli.
- **Seed enrichment_pending** (`scripts/seed.js`) : 2 nouveaux ambassadeurs (Émilie Rousseau / Toulouse, Pascal Nguyen / Strasbourg) avec questionnaire complet, pour tester la queue de validation admin.

### Changed
- **Pipeline d'inscription self-service entièrement aligné** : nouvel écran "Inscription confirmée !" sur `/inscription` avec CTA explicite vers `/auth` (au lieu de "Demande envoyée — en cours d'examen", message obsolète depuis le passage en self-service).
- **Statut admin "En examen" → "Inscrit"** sur `/admin/ambassadeurs` : "En examen" sonnait jugemental et inexact (l'admin n'examine plus rien à ce stade). "Inscrit" est factuel, neutre, aligné avec le ton pastoral du ministère.
- **Bouton "Valider (bypass)" retiré du UI admin** : un bypass produit un ambassadeur validé sans photo de profil ni questionnaire — incohérent avec le standard "lieu de prière de qualité". L'API conserve `validated_bypass` comme escape hatch (support, script SQL).
- **Guide PDF onboarding** ouvre dans un nouvel onglet (au lieu de forcer le téléchargement) — le candidat peut le lire directement depuis le dashboard.
- **"Lieu N" → "Vue N"** sur les photos du lieu d'accueil (`/admin/ambassadeurs`) : reflète mieux que ce sont des angles différents du même lieu, pas plusieurs adresses.

### Fixed
- **`CityInput` : la dropdown ne s'ouvrait plus sur `/inscription`** : le `useEffect([value])` resetait `hasUserTyped` à chaque frappe car `onChange(v)` faisait bouncer la value via le parent. Fix : `ownedValueRef` distingue les bounces internes des vrais changements externes.
- **Quartier perdu à l'inscription** (`/api/inscriptions`) : la branche INSERT "nouvel utilisateur Auth" oubliait le champ `quartier` — silencieusement perdu pour tous les nouveaux inscrits. Refactor : insert unifié, source de vérité unique pour les deux cas (Auth existant vs créé).
- **Message d'erreur "duplicate key" humanisé** : si un visiteur tente de s'inscrire avec un e-mail déjà existant, l'API renvoie maintenant "Un compte ambassadeur existe déjà avec cet e-mail. Connecte-toi depuis la page de connexion." au lieu de l'erreur Postgres brute.

### Removed
- **Gate d'ouverture des inscriptions** (J-7 par défaut) : le trigger SQL `fn_set_event_registration_dates` ne pose plus de date d'ouverture automatique. `registration_opens_at` reste NULL par défaut → l'API `POST /api/visit-requests` ne renvoie plus "Les inscriptions ne sont pas encore ouvertes". L'API check `now < registration_opens_at` est retiré (code mort). Dès qu'une fiche ambassade est visible (host actif), un visiteur peut s'inscrire.

### Rationale produit
Le gate de 7 jours était une friction artificielle introduite par le trigger DB sans cahier des charges. Le principe fondateur du produit ("on fait confiance aux gens qui ouvrent leur maison") s'applique aussi aux visiteurs qui veulent venir. Si une ambassade est visible sur la carte, l'inscription doit être possible — pas de blocage temporel.

La fermeture automatique des inscriptions à `event_date` reste en place : l'hôte doit pouvoir préparer son accueil sans recevoir de nouvelles demandes de dernière minute.

### Migration
- `scripts/migration-remove-registration-opens-gate.sql` : `CREATE OR REPLACE FUNCTION` du trigger + `UPDATE events SET registration_opens_at = NULL WHERE event_date > NOW()` pour libérer immédiatement les events à venir du gate. **Déjà appliqué sur la DB linkée**.

### Docs
- CLAUDE.md, docs/ARCHITECTURE.md, QA_SCENARIOS.md, SCENARIOS_DEMO.md, docs/presentation-david.md alignés sur tous les changements ci-dessus.

## [0.1.4.0] - 2026-05-03

### Added
- **Bouton "Clôturer le live"** (`components/LiveCloseButton.tsx` + `POST /api/admin/live/close`) : David peut terminer un live en un clic depuis `/admin/live`. Tous les pins disparaissent immédiatement de la carte publique.
- **`soonThresholdDays` configurable** : le seuil "les ambassades confirment leur participation" (affichage de l'overlay "soon" vs "upcoming") est maintenant lu depuis `event_timing_config.soon_threshold_days` en base (défaut : 2 jours) au lieu d'être codé en dur.
- **`/admin/settings/timing`** : champ `soon_threshold_days` ajouté à la page de configuration du timing.
- **Cron `check-activations`** (`app/api/cron/check-activations/route.ts`) : alerte l'admin par email si 0 hôtes actifs pour le prochain live. Route opérationnelle, non activée dans `vercel.json` — à scheduler quand prêt.
- **Workflow GH Actions `check-activations.yml`** : miroir du cron, désactivé par défaut (`workflow_dispatch` uniquement).
- **Tests email** (`tests/unit/email-templates.test.ts`) : 6 suites couvrant tous les `sendXxx` (MagicLink, BienvenueAmbassadeur, AcceptationVisite, CampagneAmbassadeurs, AdminAlertNoActivations, ContactRequestReserved).
- **`scripts/migration-v0140.sql`** : ajoute `feedback_sent BOOLEAN DEFAULT FALSE` sur `events` et `soon_threshold_days INTEGER DEFAULT 2` sur `event_timing_config`.
- **`vercel.json`** : crons `dispatch-campaigns` et `send-feedback-emails` officiellement schedulés.

### Fixed
- **`lib/dev/state.ts` — reset global `is_active`** : les transitions vers les états non-live (`soon`, `upcoming`, `past`, `closed`, `blank`) remettent maintenant `is_active = false` sur **toutes** les activations (`.in('is_active', [true, false])`), pas seulement sur le `demoLiveEvent`. Les pins ne pouvaient pas disparaître si d'autres events avaient des hôtes actifs.

### Removed
- **`emails/magic-link-bienvenue.tsx`** et `sendMagicLinkAmbassadeurBienvenue` : template orphelin — jamais appelé depuis une route. Redondant avec `registration-confirmation` qui couvre déjà le premier contact post-inscription.
- **`emails/contact-accepted.tsx`** et `sendContactRequestAccepted` : template orphelin — étape intermédiaire du flux contact retirée quand le flux a été simplifié (réservation directe sans "acceptation" préalable).

### Docs
- `SCENARIOS_DEMO.md` : réécriture complète pour la démo 45 min avec David Théry — 5 blocs minutés, 7 questions à débattre (clôture live, assistante, désactivation self-service, feedback, mobile, domaine, durée live).
- `docs/ARCHITECTURE.md` : vue d'ensemble technique complète (couches système, flux homepage, cycle ambassadeur, cycle live, inventaire features, gaps schéma, crons, routes API).
- Tous les autres fichiers de documentation mis à jour (compteur 19 → 17 templates, crons, routes API).

## [0.1.3.0] - 2026-05-02

### Added
- **Overlays carte vide contextuels** (`MapPublique.tsx`) : la carte affiche un message adapté selon l'état de l'app (live en cours, prochain live annoncé, dernier live passé, aucun live prévu) au lieu d'un écran vide générique. Chaque overlay inclut les stats communautaires (N ambassadeurs · X pays) et un CTA pertinent.
- **État DevOverlay `live-zero`** : simule un live en cours avec 0 ambassades confirmées (campagne email non encore envoyée). L'overlay affiche "Live en cours / Les ambassades confirment..." avec un lien "Regarder le live →" conditionné au champ `live_link` de l'événement.
- **État DevOverlay `blank`** : simule un futur live annoncé mais sans confirmations ambassadeurs — état typique entre l'annonce et l'envoi de la campagne.
- **Section Magic Link dans le DevOverlay** : génère un lien de connexion directement depuis le panneau, sans passer par Resend, pour les comptes `david.thery`, `theo.nelson.ia`, `marie.dubois`.
- **`live_link` propagé jusqu'à la carte** : le champ `events.live_link` (saisi par David dans `/admin/calendrier`) est maintenant transmis via `getHomepageData()` jusqu'à l'overlay `live-zero` pour afficher "Regarder le live →".

### Fixed
- **Bug état `closed`** (`lib/dev/state.ts`) : après une séquence `past → closed`, le `demoFutureEvent` restait à J-10 au lieu de J+10. L'overlay affichait "Dernier live" sans mention du prochain live. L'état `closed` remet maintenant systématiquement le futur event à J+10.
- **`is_active` non réinitialisé** entre les transitions DevOverlay : hors état `live`, tous les états remettent `is_active = false` sur le `demoLiveEvent`. Les pins ne persistent plus d'un état `live` vers un état non-live.

## [0.1.2.0] - 2026-05-02

### Added
- `DEPLOIEMENT.md` : référence complète pour déployer sur Vercel (commandes, variables, pièges CLI v53)
- `QA_SCENARIOS.md` Module 33 : 13 questions contenu pré-analysées depuis la perspective de David Théry (ton pastoral, vocabulaire, sujets)

### Changed
- `emails/validation-finale.tsx` : signature "— David Théry" ajoutée après la phrase de clôture
- `emails/bienvenue-ambassadeur.tsx` : signature "— David Théry" ajoutée en fin d'email
- `emails/admin-alerte-no-activations.tsx` : suppression du nom de trigger SQL technique `fn_auto_activate_hosts_for_event`, remplacé par du texte lisible
- `emails/campagne-visiteurs.tsx` : ligne de contextualisation ajoutée après le CTA pour les nouveaux visiteurs
- `lib/email/templates.ts` : sujets personnalisés pour `sendBienvenueAmbassadeur` (template 4) et `sendRegistrationConfirmation` (template 6) — prénom inclus dans le sujet
- `CLAUDE.md` : section Vercel ajoutée (URL production, dashboard, variables d'environnement)

### Fixed
- `emails/enrichissement-recu.tsx` : suppression de la valeur raw `enrichment_pending` de la DB et de la balise `<code>` qui la rendait encore plus technique dans l'email admin
- `app/dev/emails/page.tsx` : guard `EMAIL_PREVIEW !== 'true'` — la chaîne `"false"` est truthy en JS, la page `/dev/emails` était accessible en production

## [0.1.1.0] - 2026-05-02

### Added
- Preview emails accessibles sur `/dev/emails` — toutes les 19 notifications peuvent être relues en local et sur les Vercel Preview deployments, dans des iframes isolées du CSS Next.js
- 19 templates emails migrés en TSX (React Email v6) : magic link, bienvenue ambassadeur, pré-validation, campagnes, demandes de visite, confirmations, alertes admin
- Composants partagés `EmailLayout` et `Btn` pour la cohérence visuelle entre tous les emails
- Tests unitaires pour le mapping de props dans `lib/email/templates.ts` (mock Resend, 8 assertions couvrant les URLs construites et les props optionnelles)
- `QA_SCENARIOS.md` Module 33 : checklist de rendu + tableau de revue contenu pour David

### Changed
- `lib/email/templates.ts` : migration vers `react: React.createElement()` — suppression de `templateOrHtml()`, plus de dual-mode template Resend/HTML

### Removed
- Sous-packages inutilisés `@react-email/components` et `@react-email/render` (remplacés par le package monolithique `react-email`)
