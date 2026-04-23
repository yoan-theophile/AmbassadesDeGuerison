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

| E-mail | Rôle |
|--------|------|
| `david.thery@demo.fr` | admin |
| `theo.nelson.ia@gmail.com` | admin |
| `marie.dubois@demo.fr` | ambassadeur (actif) |
| `jp.martin@demo.fr` | ambassadeur (actif, complet) |

## Pages admin

| Route | Description |
|-------|-------------|
| `/admin/stats` | Vue générale — KPIs ambassadeurs |
| `/admin/ambassadeurs` | Datatable ambassadeurs — pagination, filtres, Suspendre/Réactiver |
| `/admin/settings` | Paramètres onboarding — URL vidéo YouTube + chemin PDF |

### Config onboarding (`onboarding_config`)

Table singleton (`id = 1`). Accès exclusivement via `createServiceClient()` (bypass RLS).

- `GET /api/onboarding/config` — lecture publique, fallback sur `config/onboarding.ts`
- `PATCH /api/admin/settings/onboarding` — écriture, requiert `role = admin`

Si la table est vide ou `video_url = ''`, le GET retourne les constantes de `config/onboarding.ts`.

## Règles importantes

- `lib/supabase/server.ts` (service_role) : JAMAIS importé depuis un Client Component
- `lib/supabase/browser.ts` (anon key) : uniquement dans les Client Components
- Port 6543 obligatoire pour les connexions Supabase server-side (pooler)
- Feature flags dans `config/features.ts`

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
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
