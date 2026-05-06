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
5. Il regarde les **vidéos d'onboarding** obligatoires (formations David)
6. Il accepte la **charte** de l'ambassadeur
7. Son profil est soumis **en attente de validation** — David reçoit une notification

**Pipeline de validation (côté admin) :**

```
Inscription → en attente → David pré-approuve → Ambassadeur reçoit un email
                                                          │
                                                          ▼
                                              Il remplit le questionnaire
                                              d'enrichissement (parcours
                                              spirituel, formation, etc.)
                                                          │
                                                          ▼
                                              David valide → Profil VALIDÉ
```

Ce n'est qu'une fois **validé** que l'hôte peut être activé pour un live.

### Ce que l'hôte fait avant chaque live

- Il reçoit un **email de David** avec un lien d'activation pour le live à venir
- Il clique le lien → son ambassade s'active → il apparaît sur la carte publique
- S'il n'est pas disponible, il ignore l'email (il n'apparaît pas sur la carte)
- Pendant le live, si son ambassade est complète, il le signale depuis son tableau de bord

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
5. Il remplit un **formulaire de contact** (prénom, message)
6. L'hôte reçoit une notification par email
7. L'hôte **accepte** → le visiteur reçoit l'adresse et les consignes par email

> **Note vie privée :** L'adresse exacte de l'hôte n'est jamais visible publiquement.
> Elle est transmise uniquement après acceptation explicite de l'hôte.

---

## Parcours 3 — David (admin)

### Gestion des candidatures (en continu)

David reçoit un **email automatique** dès qu'un ambassadeur s'inscrit :
*"Nouvelle candidature — Prénom, Ville — à valider dans l'admin."*

Il va ensuite dans `/admin/ambassadeurs` pour traiter la candidature :

```
Email reçu : nouvelle candidature
        │
        ▼
David ouvre /admin/ambassadeurs
        │
        ├── Pré-approuver → l'ambassadeur reçoit un email avec le questionnaire
        │                    et les vidéos d'onboarding
        │                          │
        │                          ▼
        │                    L'ambassadeur remplit le questionnaire
        │                          │
        │                          ▼
        │                    David reçoit un email : questionnaire soumis
        │                          │
        │                          ▼
        │                    David valide → ambassadeur ACTIF
        │
        └── Rejeter → candidature archivée
```

David peut aussi **suspendre** ou **réactiver** un ambassadeur à tout moment depuis cette même page.

### Avant le live

1. David crée un **événement** dans l'admin : titre, date, lien YouTube, lien StreamYard/Zoom
2. Il envoie son email Mailchimp habituel avec le lien vers l'application
3. Dans l'admin (`/admin/calendrier`), il crée une **campagne email** pour le live :
   - Il choisit la date d'envoi et un message personnalisé
   - L'application envoie automatiquement un email à tous les ambassadeurs validés
   - Chaque email contient un lien personnalisé — un clic suffit pour s'activer
4. David consulte le **tableau de bord admin** : nombre d'hôtes actifs, pays, capacité totale

### Pendant le live

1. David (ou un modérateur) surveille le **feed des signaux** (rafraîchi toutes les 5 secondes)
2. Quand un hôte signale un moment fort (Module 7), la notification apparaît dans le feed
3. David **approuve** → l'hôte reçoit automatiquement le lien pour témoigner en direct
4. David **refuse** → l'hôte n'est pas contacté

### Après le live

- David consulte les statistiques : combien de visites, combien de contacts, témoignages reçus
- Les témoignages des hôtes sont visibles sur une page publique de l'application
- David modère les témoignages dans `/admin/temoignages` avant qu'ils soient publiés

### Alertes visiteur

Si un visiteur ne trouve pas d'ambassade ou a besoin d'aide, il peut envoyer un message via
un formulaire. David reçoit un **email automatique** avec le contenu du message et l'adresse
email du visiteur pour lui répondre directement.

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
Dès qu'une ambassade est visible sur la carte (un hôte a cliqué "Je participe"),
n'importe qui peut s'inscrire pour la rejoindre. Pas de fenêtre d'ouverture artificielle :
si on fait confiance aux gens qui ouvrent leur maison, on fait aussi confiance à ceux
qui veulent venir.

Les inscriptions ferment automatiquement le jour du live (l'hôte doit pouvoir préparer
son accueil sans nouvelles demandes de dernière minute). Les hôtes déjà actifs peuvent
continuer à gérer leurs ambassades même après la fermeture.

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
