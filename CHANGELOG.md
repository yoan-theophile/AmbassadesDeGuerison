# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Removed
- **Gate d'ouverture des inscriptions** (J-7 par défaut) : le trigger SQL `fn_set_event_registration_dates` ne pose plus de date d'ouverture automatique. `registration_opens_at` reste NULL par défaut → l'API `POST /api/visit-requests` ne renvoie plus "Les inscriptions ne sont pas encore ouvertes". Dès qu'une fiche ambassade est visible (host actif), un visiteur peut s'inscrire.
- **API check `now < registration_opens_at`** dans `/api/visit-requests` : retiré (devenu code mort). Le SELECT ne charge plus la colonne.

### Rationale produit
Le gate de 7 jours était une friction artificielle introduite par le trigger DB sans cahier des charges. Le principe fondateur du produit ("on fait confiance aux gens qui ouvrent leur maison") s'applique aussi aux visiteurs qui veulent venir. Si une ambassade est visible sur la carte, l'inscription doit être possible — pas de blocage temporel.

La fermeture automatique des inscriptions à `event_date` reste en place : l'hôte doit pouvoir préparer son accueil sans recevoir de nouvelles demandes de dernière minute.

### Migration
- `scripts/migration-remove-registration-opens-gate.sql` : `CREATE OR REPLACE FUNCTION` du trigger + `UPDATE events SET registration_opens_at = NULL WHERE event_date > NOW()` pour libérer immédiatement les events à venir du gate.

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
- **`live_link` propagé jusqu'à la carte** : le champ `events.live_link` (saisi par David dans `/admin/planning`) est maintenant transmis via `getHomepageData()` jusqu'à l'overlay `live-zero` pour afficher "Regarder le live →".

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
