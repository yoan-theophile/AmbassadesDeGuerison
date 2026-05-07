# Documentation — DavidTheryApp

Ce dossier contient tout ce qu'il faut pour reprendre, opérer ou transmettre le projet
**Ambassades de Guérison** à un nouveau développeur ou à David Thery.

---

## Par où commencer

| Si tu es... | Commence par |
|-------------|-------------|
| Un nouveau développeur | [knowledge-transfer.md](./knowledge-transfer.md) |
| David ou son équipe (non-technique) | [presentation-david.md](./presentation-david.md) |
| Un dev qui veut comprendre les choix | [decisions.md](./decisions.md) |
| Un dev qui veut comprendre comment ça s'articule | [ARCHITECTURE.md](./ARCHITECTURE.md) |

---

## Contenu du dossier

| Fichier | Pour qui | Ce qu'il contient |
|---------|----------|------------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Développeur | Couches du système, flux de données, sécurité, rendu SSR/Client |
| [knowledge-transfer.md](./knowledge-transfer.md) | Développeur | Setup, stack, BDD, déploiement, opérations courantes, incidents |
| [presentation-david.md](./presentation-david.md) | Non-technique | Ce que l'app fait, pourquoi, comment — sans jargon |
| [decisions.md](./decisions.md) | Développeur | Pourquoi on a fait ces choix (pas juste quoi, mais pourquoi) |

---

## Autres ressources dans le projet

| Fichier | Ce qu'il contient |
|---------|------------------|
| `README.md` (racine) | Vue synthétique, installation rapide |
| `CLAUDE.md` (racine) | Guide développeur détaillé — règles, patterns, composants |
| `DEPLOIEMENT.md` (racine) | Déploiement Vercel — commandes, variables, pièges CLI v53 |
| `DESIGN.md` (racine) | Système de design — couleurs, typographie, spacing, responsive |
| `docs/SCENARIOS_DEMO.md` | Scénarios de démonstration pas à pas |
| `docs/QA_SCENARIOS.md` | Checklist QA complète — carte, overlays, états DevOverlay, emails, admin, E2E |
| `.env.local.example` (racine) | Template des variables d'environnement |
| `config/features.ts` | Feature flags (activer/désactiver des modules) |

---

## Mise à jour de cette documentation

Chaque fois qu'une décision importante est prise (choix technique, changement d'architecture,
ajout d'un module), l'ajouter dans [decisions.md](./decisions.md).

Chaque fois qu'un incident se produit et qu'on trouve la cause, l'ajouter dans la section
"Incidents courants" de [knowledge-transfer.md](./knowledge-transfer.md).
