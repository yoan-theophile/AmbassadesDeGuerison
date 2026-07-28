# Ambassades de Guérison

Application web pour le réseau d'ambassades de David Théry — groupes de prière qui se réunissent localement lors des lives de guérison.

## Vision

Lors de chaque live, des milliers de personnes regardent seules chez elles. Les Ambassades de Guérison créent un réseau de lieux d'accueil — maisons ou églises — où les gens se retrouvent pour prier ensemble, en communion avec le message de David diffusé en direct.

## Ce que fait l'application

**Pour les visiteurs**
- Trouver une ambassade près de chez soi sur une carte mondiale interactive, triable par distance (géolocalisation éphémère, jamais stockée)
- Découvrir comment se passe une première visite (`/decouvrir`) avant de se lancer
- Envoyer une demande de visite à un ambassadeur pour un live précis
- Recevoir l'adresse par e-mail dès que l'ambassadeur accepte la demande
- Retrouver ses infos (email, téléphone) sans les retaper à chaque demande, via un espace visiteur minimal (`/mon-espace`, connexion par magic link)
- Soumettre un témoignage après le live (lien public, sans compte requis)

**Pour les ambassadeurs**
- S'inscrire et gérer son profil (lieu, capacité, consignes, message de présentation, adresse précise privée)
- Recevoir les demandes de visiteurs pour chaque live
- Envoyer un signal "main levée" pendant le live
- Donner un retour sur les visiteurs reçus après un live
- Partager des témoignages

**Pour David (admin)**
- Planifier les lives
- Voir en direct les signaux des ambassadeurs pendant le live
- Modérer et publier les témoignages
- Suivre un panneau factuel d'actions à traiter depuis le dernier live (candidats à valider, témoignages à modérer, ambassades à vérifier)

## Stack technique

- **Next.js 15** — App Router, TypeScript
- **Supabase** — PostgreSQL, Auth (magic links), RLS
- **Tailwind CSS** — design system
- **Leaflet + OpenStreetMap** — carte publique
- **Resend + React Email v6** — e-mails transactionnels (20 templates TSX dans `emails/*.tsx`)
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

### Preview des emails

Ajouter dans `.env.local` :

```
EMAIL_PREVIEW=true
```

Puis ouvrir [http://localhost:3000/dev/emails](http://localhost:3000/dev/emails) pour visualiser les 17 templates dans le navigateur (sans envoyer d'email). Disponible aussi sur les Vercel Preview deployments si `EMAIL_PREVIEW=true` est configuré dans les variables d'environnement Vercel (scope : Preview).

## État du projet

Ce projet est en développement actif. Les fonctionnalités ci-dessus sont construites et testées. Des évolutions sont prévues sur la base des retours de David Théry.

## Licence

Code source privé — tous droits réservés.
