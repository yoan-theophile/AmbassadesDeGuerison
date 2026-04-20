# Transfert de connaissance — DavidTheryApp

> Ce document permet à un développeur (ou à David) de comprendre, opérer et maintenir
> l'application sans avoir participé à sa conception.

---

## Vue d'ensemble technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Frontend | Next.js 15 (App Router, TypeScript) | Interface web + API routes |
| Base de données | Supabase (PostgreSQL) | Données, auth, RLS |
| Authentification | Supabase Auth (magic links) | Connexion sans mot de passe |
| Emails | Resend | Notifications, magic links, confirmations |
| Carte | Leaflet.js + OpenStreetMap | Carte des ambassades |
| Déploiement | Vercel | Hébergement, CI/CD automatique |
| Mobile | PWA (manifest + service worker) | Cache carte hors ligne |

---

## Structure des données (7 tables)

```
events              → Les lives (titre, date, lien YouTube, lien StreamYard)
host_profiles       → Les hôtes ambassadeurs (profil permanent)
host_activations    → Qui est actif pour quel live (créé par trigger automatique)
contact_requests    → Demandes de visiteurs vers un hôte
live_signals        → Signaux "moment fort" pendant le live
testimonials        → Témoignages post-live des hôtes
ratings             → (prévu v2 — pas encore implémenté)
```

Les données des hôtes et visiteurs sont protégées par **RLS (Row Level Security)** :
un hôte ne peut jamais voir les données d'un autre hôte.

---

## Setup local (première installation)

### Prérequis
- Node.js 20+
- Compte Supabase (gratuit)
- Compte Resend (gratuit)
- Compte Vercel (gratuit)

### 1. Cloner et installer

```bash
git clone <repo-url>
cd davidthery-app
npm install
```

### 2. Variables d'environnement

Copier `.env.example` vers `.env.local` et remplir :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # clé publique (safe côté client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # clé privée (JAMAIS exposée côté client)

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@votredomaine.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Important :** `SUPABASE_SERVICE_ROLE_KEY` bypass la sécurité RLS.
> Elle ne doit jamais apparaître dans le code frontend ni dans les logs.

### 3. Appliquer les migrations Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Lancer Supabase en local (nécessite Docker)
supabase start

# Appliquer les migrations
supabase db push
```

### 4. Lancer en développement

```bash
npm run dev
# → http://localhost:3000
```

---

## Feature flags

Les fonctionnalités peuvent être activées/désactivées sans toucher au code.

Fichier : `config/features.ts`

| Flag | Valeur par défaut | Description |
|------|------------------|-------------|
| `EMAIL_NOTIFICATIONS` | `true` | Emails Resend (magic link, signal approuvé, etc.) |
| `PHOTOS` | `false` | Photos dans les témoignages (v2) |
| `RATINGS` | `false` | Notation des ambassades (v2) |
| `ONBOARDING_VIDEOS` | `false` | Vidéos onboarding intégrées (v2 — fallback texte en v1) |

Pour activer une feature en production, changer la valeur dans Vercel Environment Variables
(sans redéployer manuellement — Vercel relit les env vars au prochain déploiement).

---

## Déploiement

### Déploiement automatique

Chaque push sur `main` déclenche un déploiement automatique sur Vercel.

```
git push origin main
→ Vercel build automatique
→ Disponible sur https://davidthery-app.vercel.app
```

### Déploiement manuel (si besoin)

```bash
npx vercel --prod
```

### Variables d'environnement en production

À configurer dans Vercel Dashboard → Settings → Environment Variables.
Les mêmes variables que `.env.local` mais avec les valeurs de production.

---

## Supabase — Opérations courantes

### Accéder à la base de données

```
Supabase Dashboard → https://supabase.com/dashboard
→ Ton projet → Table Editor (interface visuelle)
→ ou SQL Editor (requêtes directes)
```

### Créer un événement (live)

Via l'interface admin de l'application, ou directement en SQL :

```sql
INSERT INTO events (title, event_date, youtube_url, live_link)
VALUES (
  'Live Guérison — Novembre 2026',
  '2026-11-15 19:00:00+01',
  'https://youtube.com/watch?v=XXXXX',
  'https://streamyard.com/XXXXX'
);
```

Le **trigger automatique** crée une entrée `host_activations` pour chaque hôte actif.

### Vérifier les hôtes actifs pour un live

```sql
SELECT hp.first_name, hp.city, hp.country, ha.is_active, ha.capacity
FROM host_activations ha
JOIN host_profiles hp ON hp.id = ha.host_profile_id
JOIN events e ON e.id = ha.event_id
WHERE e.title LIKE '%Novembre 2026%'
ORDER BY hp.country, hp.city;
```

### Suspendre un hôte

```sql
UPDATE host_profiles SET status = 'suspended' WHERE email = 'hote@example.com';
```

### Voir les signaux d'un live

```sql
SELECT ls.*, hp.first_name, hp.city
FROM live_signals ls
JOIN host_activations ha ON ha.id = ls.host_activation_id
JOIN host_profiles hp ON hp.id = ha.host_profile_id
JOIN events e ON e.id = ha.event_id
WHERE e.title LIKE '%Novembre 2026%'
ORDER BY ls.created_at DESC;
```

---

## Emails — Resend

### Templates disponibles

| Template | Déclenché quand |
|----------|----------------|
| Magic link | Hôte ou visiteur se connecte |
| Signal approuvé | Admin approuve un signal live |
| Confirmation inscription | Hôte termine l'onboarding |
| Consignes invité | Visiteur accepté par un hôte |

### Voir les emails envoyés

Resend Dashboard → Logs → filtrer par email ou date.

---

## GitHub Actions (automatisations)

### supabase-keepalive.yml

Supabase met en pause les projets gratuits après 7 jours d'inactivité.
Ce workflow ping la base de données toutes les 5 jours pour éviter la pause.

```
.github/workflows/supabase-keepalive.yml
→ Cron : toutes les 5 jours
→ Action : SELECT 1 sur la base de données
```

### host-activations-check.yml

Vérifie chaque jour qu'un live à venir a bien des hôtes actifs.
Si 0 hôte actif 48h avant un live → email d'alerte à l'admin.

```
.github/workflows/host-activations-check.yml
→ Cron : quotidien à 8h
→ Action : vérifie host_activations pour les events dans les 48h
```

---

## Incidents courants

### "Les hôtes n'apparaissent pas sur la carte"

1. Vérifier que l'événement existe et que `event_date` est correct
2. Vérifier que les hôtes ont `status = 'active'` dans `host_profiles`
3. Vérifier que `host_activations.is_active = TRUE` pour cet événement
4. Vérifier que `lat` et `lng` ne sont pas NULL (si NULL, `geocoding_failed = TRUE`)

### "Un hôte ne reçoit pas ses emails"

1. Vérifier dans Resend Dashboard → Logs que l'email a bien été envoyé
2. Vérifier que `FEATURES.EMAIL_NOTIFICATIONS = true`
3. Vérifier l'adresse email dans `host_profiles.email`
4. Vérifier les spams côté destinataire

### "Le feed admin ne se rafraîchit plus"

Le feed utilise du polling (rafraîchissement toutes les 5 secondes).
Si ça semble bloqué, recharger la page. Ce n'est pas du temps réel (pas de WebSocket).

### "Supabase est en pause"

```bash
# Depuis le Supabase Dashboard → ton projet → "Restore project"
# Ou via l'API :
curl -X POST https://api.supabase.com/v1/projects/TON_PROJECT_ID/restore \
  -H "Authorization: Bearer TON_SUPABASE_TOKEN"
```

### "Le trigger host_activations ne s'est pas déclenché"

Le trigger `create_activation_on_onboarding_complete` crée automatiquement les activations
quand un événement est créé. Si les activations manquent :

```sql
-- Créer manuellement les activations manquantes
INSERT INTO host_activations (host_profile_id, event_id, capacity)
SELECT hp.id, 'ID_DE_LEVENEMENT', hp.capacity_default
FROM host_profiles hp
WHERE hp.status = 'active'
AND hp.id NOT IN (
  SELECT host_profile_id FROM host_activations WHERE event_id = 'ID_DE_LEVENEMENT'
);
```

---

## Architecture de sécurité (pour les développeurs)

### Règles d'accès (RLS)

| Table | Qui peut lire | Qui peut écrire |
|-------|--------------|----------------|
| `host_profiles` | Vue publique limitée (nom, ville) | L'hôte lui-même + admin |
| `host_activations` | Public (is_active, capacity) | L'hôte lui-même + admin |
| `contact_requests` | L'hôte concerné + le visiteur concerné | Visiteur (créer) + hôte (accepter/refuser) |
| `live_signals` | Admin + l'hôte qui a créé le signal | L'hôte lui-même |
| `events` | Public | Admin uniquement |

### Ne jamais faire

- Exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- Bypasser RLS dans une route API publique
- Stocker `action_token` (liens accept/decline) en clair dans les logs

---

## Coûts et limites (Supabase gratuit)

| Ressource | Limite gratuite | Usage attendu |
|-----------|----------------|---------------|
| Base de données | 500 MB | Très largement suffisant |
| Connexions DB | 60 simultanées | Port 6543 (pooler) obligatoire |
| Auth | 50 000 MAU | Suffisant pour v1 |
| Storage | 1 GB | Non utilisé en v1 (FEATURES.PHOTOS=false) |
| Pause inactivité | 7 jours | Géré par le keepalive GitHub Actions |

Quand l'application dépasse 100 hôtes actifs réguliers → envisager Supabase Pro (€25/mois).

---

## Contacts

| Rôle | Contact |
|------|---------|
| Développeur principal | theo.nelson.ia@gmail.com |
| David Thery | À compléter |
