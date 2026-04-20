# Ambassades de Guérison — Présentation pour David

> Ce document explique l'application en langage simple, sans jargon technique.
> Il est conçu pour être présenté à David Thery et à ses équipes.

---

## C'est quoi l'application ?

L'application permet à des **hôtes ambassadeurs** de se signaler comme disponibles pour
accueillir des visiteurs pendant les lives de guérison de David Thery sur YouTube.

Un visiteur qui regarde le live peut trouver un hôte près de chez lui, et le rejoindre
pour vivre l'expérience en communauté plutôt que seul devant son écran.

---

## Les 3 types d'utilisateurs

| Qui | Rôle | Ce qu'il fait |
|-----|------|---------------|
| **David (admin)** | Créateur / modérateur | Crée les lives, surveille les hôtes, gère les signaux pendant le live |
| **Hôte ambassadeur** | Volontaire accueillant | S'inscrit, crée son ambassade, accueille des visiteurs |
| **Visiteur** | Participant | Trouve une ambassade sur la carte, contacte un hôte |

---

## Parcours 1 — L'hôte ambassadeur

### Comment un hôte s'inscrit

1. David envoie un email à sa communauté avec un lien vers l'application
2. L'hôte clique sur le lien, saisit son adresse email
3. Il reçoit un **lien magique** (magic link) par email — pas de mot de passe à retenir
4. Il remplit son profil :
   - Prénom, ville, pays
   - Type d'ambassade : chez lui (individuel) ou en église
   - Capacité d'accueil (ex: 5 personnes)
   - Mode de contact : adresse publique / formulaire / validation manuelle
5. Il regarde les **vidéos d'onboarding** obligatoires (formations David)
6. Il accepte la **charte** de l'ambassadeur
7. Son profil devient **actif** — il apparaît sur la carte publique

### Ce que l'hôte fait avant chaque live

- Il se connecte à son tableau de bord (via le lien magique reçu par email)
- Il clique **"Je suis disponible pour ce live"** pour s'activer
- S'il est plein ou indisponible, il se désactive en un clic

### Ce que l'hôte fait pendant le live

- Il voit les demandes de contact entrant en temps réel
- Il accepte ou refuse chaque visiteur
- Si son ambassade est complète, il clique "Complet" — aucune nouvelle demande ne lui parvient
- Il peut **signaler un moment fort** (voir Module 7 ci-dessous)

---

## Parcours 2 — Le visiteur

1. Il regarde le live YouTube de David
2. David mentionne l'application et l'URL de la carte
3. Le visiteur ouvre l'application — il voit une **carte des ambassades actives**
4. Il clique sur une ambassade près de chez lui
5. Selon le mode choisi par l'hôte :
   - **Mode public** : l'adresse est affichée directement
   - **Mode formulaire** : le visiteur envoie un message, l'hôte le reçoit
   - **Mode approbation** : l'hôte doit accepter avant que l'adresse soit révélée
6. Une fois accepté, le visiteur reçoit l'adresse par email + les consignes de l'hôte

> **Note vie privée :** L'adresse exacte de l'hôte n'est jamais visible publiquement.
> Elle est transmise uniquement après acceptation.

---

## Parcours 3 — David (admin)

### Avant le live

1. David crée un **événement** dans l'admin : titre, date, lien YouTube, lien StreamYard/Zoom
2. Il envoie son email Mailchimp habituel avec le lien vers l'application
3. Les hôtes actifs reçoivent une notification et s'activent d'eux-mêmes
4. David consulte le **tableau de bord admin** : nombre d'hôtes actifs, pays, capacité totale

### Pendant le live

1. David (ou un modérateur) surveille le **feed des signaux** (rafraîchi toutes les 5 secondes)
2. Quand un hôte signale un moment fort (Module 7), la notification apparaît dans le feed
3. David **approuve** → l'hôte reçoit automatiquement le lien pour témoigner en direct
4. David **refuse** → l'hôte n'est pas contacté

### Après le live

- David consulte les statistiques : combien de visites, combien de contacts, témoignages reçus
- Les témoignages des hôtes sont visibles sur une page publique de l'application

---

## Module 7 — Le signal de moment fort

C'est la fonctionnalité la plus interactive du live.

**Situation :** Pendant le live, un hôte est témoin d'un moment fort dans son ambassade
(une guérison, un témoignage marquant). Il veut le partager en direct sur le live YouTube.

**Comment ça marche :**

```
Hôte clique "🙌 Signaler un moment fort"
        │
        │ décrit le moment en quelques mots
        ▼
Signal envoyé à David (feed admin)
        │
        ├── David approuve → l'hôte reçoit immédiatement le lien StreamYard
        │                    pour intervenir en direct sur le live
        │
        └── David refuse → le signal est archivé, l'hôte n'est pas contacté
```

---

## La carte publique

- Visible par tout le monde, sans compte
- Affiche uniquement les hôtes **actifs** pour le prochain live
- Pins colorés par pays / type d'ambassade
- Se met à jour toutes les 30 secondes
- Fonctionne sur mobile, même avec une connexion internet faible (technologie PWA)

---

## Règles importantes à connaître

### La charte
Chaque hôte accepte une charte avant d'être validé. Si la charte change, les hôtes doivent
la revalider avant de pouvoir s'activer à nouveau.

### La capacité
Chaque hôte définit sa capacité (ex: 5 personnes). L'application surveille automatiquement
si la capacité est atteinte.

### Les inscriptions
Les inscriptions ouvrent 7 jours avant le live et ferment le jour du live.
Les hôtes déjà actifs peuvent continuer à gérer leurs ambassades même après la fermeture.

### La confidentialité
Les hôtes en Afrique ou dans des zones rurales peuvent choisir de ne pas afficher
leur adresse publiquement. Leur localisation est approximative sur la carte.

---

## Ce que l'application ne fait PAS (en version 1)

- Pas de vidéos ou photos jointes aux témoignages (texte uniquement)
- Pas de notifications push sur mobile (emails uniquement)
- Pas de système de notation des ambassades
- Pas de traduction (français uniquement)
- Pas d'intégration WhatsApp automatique (prévu en v2)

---

## Glossaire

| Terme | Définition |
|-------|-----------|
| **Hôte ambassadeur** | Volontaire qui accueille des visiteurs chez lui ou en église |
| **Ambassade** | Le lieu d'accueil d'un hôte |
| **Visiteur** | Personne qui cherche une ambassade à rejoindre |
| **Magic link** | Lien d'identification envoyé par email (pas de mot de passe) |
| **Signal** | Message qu'un hôte envoie à David pendant le live pour signaler un moment fort |
| **Activation** | Quand un hôte confirme qu'il sera disponible pour un live donné |
| **Live** | Session YouTube en direct de David Thery |
| **Feed admin** | Tableau de bord de David pendant le live, avec les signaux en temps réel |
