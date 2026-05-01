# Journal des décisions — DavidTheryApp

> Chaque entrée répond à la question : **pourquoi avons-nous fait ce choix ?**
> Le "quoi" se trouve dans le code. Le "pourquoi" s'oublie — il est ici.

Format : `YYYY-MM-DD | Décision | Pourquoi | Alternatives écartées`

---

## Stack et infrastructure

### 2026-04 | Next.js 15 App Router (pas Pages Router)

**Décision :** App Router (dossier `app/`), pas Pages Router.

**Pourquoi :** Server Components natifs → moins de JS envoyé au client, chargement plus rapide sur mobile africain (connexion lente). Les layouts imbriqués simplifient la structure admin vs public. C'est la direction officielle Next.js.

**Alternatives écartées :**
- Pages Router : plus familier mais obsolescent, pas de Server Components natifs.
- Remix : bonne alternative mais moins d'intégrations disponibles pour Supabase/Vercel.

---

### 2026-04 | Supabase (pas Firebase ni Prisma+Postgres)

**Décision :** Supabase comme backend-as-a-service (BDD + Auth + RLS).

**Pourquoi :** Row Level Security (RLS) natif PostgreSQL — les hôtes ne peuvent jamais voir les données des autres, sans une ligne de code côté applicatif. Magic links intégrés, pas de gestion de sessions à coder. Gratuit jusqu'à ~100 hôtes actifs.

**Alternatives écartées :**
- Firebase : NoSQL, pas de jointures, RLS moins expressif.
- Prisma + Postgres auto-hébergé : plus de contrôle, mais infrastructure à maintenir.
- PlanetScale : pas de RLS PostgreSQL natif.

---

### 2026-04 | Authentification par magic link (pas de mot de passe)

**Décision :** Uniquement des magic links par email, aucun mot de passe.

**Pourquoi :** Audience mondiale francophone, beaucoup en Afrique. Les mots de passe sont une friction. Un magic link = un clic depuis l'email, aucun oubli de mot de passe. David n'a pas d'équipe support pour réinitialiser des mots de passe.

**Alternatives écartées :**
- OAuth Google/Facebook : exclut les utilisateurs sans ces comptes.
- Mot de passe classique : friction à l'inscription, support nécessaire.

---

### 2026-04 | Resend pour les emails

**Décision :** Resend comme service d'emails transactionnels.

**Pourquoi :** Intégration React (templates HTML en JSX), très bonne deliverabilité, DX excellente, gratuit jusqu'à 3 000 emails/mois.

**Limitation connue :** En sandbox (`onboarding@resend.dev`), les emails ne sont livrés qu'au propriétaire du compte. Pour les démos, utiliser `node scripts/magic-link.js` pour générer des liens directs.

---

### 2026-04 | Leaflet + OpenStreetMap (pas Google Maps ni Mapbox)

**Décision :** Leaflet.js avec les tuiles OpenStreetMap.

**Pourquoi :** Gratuit, sans clé API, sans limite de requêtes. Données OSM excellentes pour l'Afrique (souvent mieux que Google Maps dans les zones rurales).

**Limitation connue :** Nominatim (géocodage des villes) est limité à 1 requête/seconde par IP. Au-delà de ~50 users simultanés, évaluer Photon (Komoot, self-hostable, gratuit) ou Mapbox.

---

### 2026-04 | Vercel pour le déploiement

**Décision :** Hébergement sur Vercel, déploiement automatique sur push `main`.

**Pourquoi :** Intégration native Next.js, zéro configuration, preview deployments automatiques sur chaque PR, CI/CD gratuit.

---

## Architecture applicative

### 2026-04 | Port 6543 obligatoire pour Supabase côté serveur

**Décision :** Toutes les connexions serveur (Server Components, API routes) utilisent le port 6543 (pooler PgBouncer), pas 5432.

**Pourquoi :** Supabase héberge dans le cloud. Les Server Components Next.js peuvent créer de nombreuses connexions simultanées (une par requête). Sans pooler, on dépasse rapidement la limite de 60 connexions du plan gratuit.

---

### 2026-04 | Deux clients Supabase séparés

**Décision :**
- `lib/supabase/server.ts` → `createServiceClient()` avec `service_role` key (bypass RLS) — **uniquement Server Components et API routes**
- `lib/supabase/browser.ts` → `createBrowserClient()` avec `anon` key (respecte RLS) — **uniquement Client Components**

**Pourquoi :** Si `service_role` est utilisé côté client, RLS est contourné et n'importe qui peut lire toutes les données. La séparation est une règle de sécurité non négociable.

---

### 2026-04 | Trigger automatique pour host_activations

**Décision :** Un trigger PostgreSQL (`create_activation_on_onboarding_complete`) crée automatiquement une entrée `host_activations` pour chaque hôte actif quand un événement est créé.

**Pourquoi :** Évite d'oublier d'associer des hôtes à un live. L'admin crée l'événement, les activations se créent toutes seules. Pas de code applicatif à maintenir pour ça.

---

### 2026-04 | Polling toutes les 5 secondes (pas de WebSocket)

**Décision :** Le feed admin et la carte publique utilisent du polling (refetch toutes les 5s), pas de WebSocket en temps réel.

**Pourquoi :** Supabase Realtime ajoute de la complexité (gestion de connexions, reconnexions, état). Pour un usage limité à un admin en même temps + quelques dizaines d'hôtes, le polling est suffisant et beaucoup plus simple à debugger.

**À réévaluer si :** Plus de 200 hôtes actifs simultanément ou si David se plaint de la latence.

---

## Décisions produit / UX

### 2026-04 | Confiance aux hôtes — friction minimale

**Décision :** Les hôtes ne sont pas re-validés à chaque live. Une fois actif, tu restes actif.

**Pourquoi :** Ces gens ouvrent leur maison. Imposer une re-validation systématique serait irrespectueux. La friction doit être minimale pour ceux qui servent.

---

### 2026-04 | Adresse jamais visible publiquement

**Décision :** L'adresse exacte d'un hôte n'est jamais affichée sur la carte publique. Elle est transmise uniquement par email après acceptation.

**Pourquoi :** Protection de la vie privée, particulièrement importante pour les hôtes en Afrique ou dans des contextes sensibles.

---

### 2026-04 | Timezone La Réunion pour l'admin planning

**Décision :** Les dates/heures dans l'admin planning sont affichées et saisies en heure de La Réunion (UTC+4, `Indian/Reunion`).

**Pourquoi :** David est basé à La Réunion. C'est sa timezone de référence pour organiser les lives.

---

### 2026-04 | Uniquement le breakpoint `sm:` (640px)

**Décision :** 95% des adaptations responsive utilisent uniquement `sm:`. Les breakpoints `md:`, `lg:`, `xl:` sont évités sauf cas exceptionnel.

**Pourquoi :** L'application est soit mobile (< 640px) soit desktop. Pas de tablette intermédiaire. Multiplier les breakpoints crée de la complexité sans valeur.

---

## À compléter

Ajouter ici chaque décision significative prise lors du développement :
les modules ajoutés, les changements d'approche, les compromis retenus.
