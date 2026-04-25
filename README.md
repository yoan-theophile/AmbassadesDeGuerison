# Ambassades de Guérison

Application web pour le réseau d'ambassades de David Théry — groupes de prière qui se réunissent localement lors des lives de guérison.

## Vision

Lors de chaque live, des milliers de personnes regardent seules chez elles. Les Ambassades de Guérison créent un réseau de lieux d'accueil — maisons ou églises — où les gens se retrouvent pour prier ensemble, en communion avec le message de David diffusé en direct.

## Ce que fait l'application

**Pour les visiteurs**
- Trouver une ambassade près de chez soi sur une carte mondiale interactive
- Envoyer une demande de contact à un ambassadeur
- Recevoir un lien sécurisé avec l'adresse de l'ambassade (révélée après 24h)
- Soumettre un témoignage après le live

**Pour les ambassadeurs**
- S'inscrire et gérer son profil (lieu, capacité, consignes)
- Recevoir les demandes de visiteurs pour chaque live
- Envoyer un signal "main levée" pendant le live
- Partager des témoignages

**Pour David (admin)**
- Planifier les lives
- Voir en direct les signaux des ambassadeurs pendant le live
- Modérer et publier les témoignages
- Suivre les KPIs : ambassades actives, pays, demandes, témoignages

## Stack technique

- **Next.js 15** — App Router, TypeScript
- **Supabase** — PostgreSQL, Auth (magic links), RLS
- **Tailwind CSS** — design system
- **Leaflet + OpenStreetMap** — carte publique
- **Resend** — e-mails transactionnels
- **Nominatim** — géocodage des villes

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Copier `.env.local.example` en `.env.local` et renseigner les clés Supabase et Resend.

### Réinitialiser les données de démo

```bash
# Recréer le schéma (Supabase SQL Editor)
supabase db query --linked --file scripts/reset-db.sql

# Insérer les données de démo
node scripts/seed.js
```

### Connexion admin en local

```bash
node scripts/magic-link.js david.thery@demo.fr
```

## État du projet

Ce projet est en développement actif. Les fonctionnalités ci-dessus sont construites et testées. Des évolutions sont prévues sur la base des retours de David Théry.

## Licence

Code source privé — tous droits réservés.
