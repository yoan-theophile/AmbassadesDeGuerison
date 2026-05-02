# Changelog

All notable changes to this project will be documented in this file.

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
