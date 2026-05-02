# Changelog

All notable changes to this project will be documented in this file.

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
