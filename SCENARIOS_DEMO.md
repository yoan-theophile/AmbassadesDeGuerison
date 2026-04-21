# Scénarios de test — Ambassades de Guérison
## Guide de démo pour David Thery

> **Avant de commencer** : lancer `npm run dev` puis ouvrir `http://localhost:3000`

---

## Données de démo disponibles

### 6 ambassadeurs actifs sur la carte
| Ambassadeur | Ville | Pays | Capacité |
|-------------|-------|------|---------|
| Marie | Paris | France | 15 places |
| Jean-Pierre | Lyon | France | 80 places (COMPLET) |
| Fatou | Bruxelles | Belgique | 40 places |
| Samuel | Montréal | Canada | 12 places |
| Claire | Genève | Suisse | 8 places |
| Kofi | Abidjan | Côte d'Ivoire | 120 places |

### 2 lives
- **Live passé** : « Live Guérison #14 — Brisez les chaînes » (il y a 3 semaines)
- **Live à venir** : « Live Guérison #15 — La puissance de l'Amour » (dans 10 jours)

---

## Scénario 1 — La carte publique

**Ce que montre cette page :**  
La carte mondiale avec les épingles des ambassades actives pour le dernier live.

**Étapes :**
1. Ouvrir `http://localhost:3000`
2. La carte s'affiche avec 6 épingles géolocalisées
3. Zoomer sur la France : Paris (Marie) et Lyon (Jean-Pierre)
4. Zoomer sur l'Europe : Bruxelles (Fatou) et Genève (Claire)
5. Dézoomer : Montréal (Canada) et Abidjan (Côte d'Ivoire) apparaissent
6. Cliquer sur l'épingle de **Marie à Paris** → bulle d'information avec son prénom et sa ville
7. Cliquer sur « Voir l'ambassade » dans la bulle

**Points clés à montrer à David :**
- Couverture internationale en temps réel
- L'épingle de **Jean-Pierre (Lyon)** affiche « Complet » (ambassade pleine)
- Actualisation automatique toutes les 30 secondes sans rechargement de page

---

## Scénario 2 — Demande de contact (parcours visiteur)

**Ce que montre ce scénario :**  
Un visiteur qui veut rejoindre une ambassade pour le prochain live.

**Étapes :**
1. Depuis la carte, cliquer sur **Marie (Paris)**
2. Dans la bulle, cliquer sur « Voir l'ambassade »
   - URL : `http://localhost:3000/ambassade/{id}`
3. La page affiche :
   - Prénom et ville
   - Type de lieu : Domicile
   - Mode de contact : Formulaire
   - Les consignes de Marie : *"Sonner à l'interphone Dubois. Ascenseur disponible. Parking Opéra à 200m."*
4. Remplir le formulaire de contact :
   - **Prénom** : Thomas
   - **E-mail** : thomas.demo@test.fr
   - **Message** : Je viendrai avec mon épouse, nous sommes deux.
5. Cliquer sur « Envoyer la demande »
6. Message de confirmation : *"Demande envoyée — Marie recevra votre demande..."*

**Points clés :**
- L'adresse privée n'est jamais visible avant acceptation (sécurité)
- Le formulaire est simple et rapide (3 champs)
- Confirmation immédiate

---

## Scénario 3 — Ambassade avec groupe WhatsApp

**Ce que montre ce scénario :**  
Une ambassade d'église avec lien WhatsApp direct.

**Étapes :**
1. Depuis la carte, cliquer sur **Jean-Pierre (Lyon)**
2. Cliquer sur « Voir l'ambassade »
3. Observer :
   - Type : Église / lieu de culte
   - **Ambassade affichée comme « Complète »** (80/80 places)
   - Bouton vert « Rejoindre le groupe WhatsApp »
4. Le bouton WhatsApp ouvre le groupe communautaire directement

**Points clés :**
- Les ambassades d'église peuvent accueillir plus de monde (80 places)
- L'état « complet » est géré automatiquement
- Lien WhatsApp de groupe optionnel pour la communauté

---

## Scénario 4 — Inscription comme ambassadeur

**Ce que montre ce scénario :**  
Le parcours pour devenir un nouvel ambassadeur.

**Étapes :**
1. Depuis la carte, cliquer sur « Devenir hôte » (bouton indigo en haut à droite)
   - Ou URL directe : `http://localhost:3000/inscription`
2. **Étape 1 — Coordonnées :**
   - Prénom : Sophie
   - E-mail : sophie.nouveau@test.fr
   - Ville : Toulouse
   - Pays : France
   - Cliquer sur « Continuer »
3. **Étape 2 — Le lieu :**
   - Type : Domicile
   - Capacité : 12 personnes
   - Adresse complète : 15 rue de la République, 31000 Toulouse
   - Consignes : Appartement 3ème étage, porte gauche
   - Cliquer sur « Continuer »
4. **Étape 3 — Contact :**
   - Mode de contact : E-mail
   - Récapitulatif visible
   - Cliquer sur « Envoyer ma demande »
5. Page de confirmation : *"Merci Sophie. Votre demande est en cours de validation."*

**Points clés :**
- Formulaire en 3 étapes, clair et progressif
- L'adresse est stockée mais jamais visible publiquement avant activation
- L'ambassadeur reçoit un e-mail de confirmation (Resend)
- La candidature arrive dans la modération admin

---

## Scénario 5 — Tableau de bord admin (KPIs)

**Ce que montre ce scénario :**  
La vue de pilotage pour David.

**Étapes :**
1. Ouvrir `http://localhost:3000/admin/stats`
   - *(Redirige vers `/auth` si non connecté — normal en démo)*
   - Pour la démo : se connecter avec un compte admin (voir ci-dessous)
2. Le tableau de bord affiche :
   - **Dernier live** : Live Guérison #14 — date
   - **Ambassades actives** : 6
   - **Pays représentés** : 5 (France, Belgique, Canada, Suisse, Côte d'Ivoire)
   - **Demandes de contact** : 5
   - **Témoignages** : 3

**Points clés :**
- Chiffres en temps réel
- Vue épurée, 4 KPIs essentiels
- Navigation vers la modération

> **Note démo** : Pour accéder à `/admin/stats`, utiliser un compte avec le rôle `admin`
> dans Supabase (user_metadata.role = "admin"). À configurer dans le dashboard Supabase.

---

## Scénario 6 — L'invitation visiteur (lien magique)

**Ce que montre ce scénario :**  
Ce que reçoit un visiteur quand son hôte accepte sa demande.

**Contexte :** Pierre a envoyé une demande à Marie (Paris). Marie a accepté.
Sa demande est en statut `accepted` dans la base.

**Simuler le lien d'invitation :**
1. Dans Supabase Dashboard → Table `contact_requests`
2. Trouver la ligne de Pierre (visitor_email = `pierre.v@mail.com`)
3. Copier la valeur de `action_token`
4. Ouvrir : `http://localhost:3000/accueil-invite/{action_token}`
5. La page affiche :
   - « Bienvenue chez Marie »
   - Les règles générales de conduite
   - Les consignes de Marie
   - Bouton « J'ai bien pris note — Voir l'adresse »
6. Cliquer sur le bouton
7. L'adresse complète apparaît : *"12 rue de la Paix, 75001 Paris"*

**Points clés :**
- L'adresse n'est dévoilée qu'après lecture et acceptation des règles
- Lien à usage unique (7 jours de validité)
- Processus sécurisé : le visiteur doit lire les consignes avant d'avoir l'adresse

---

## Scénario 7 — Présentation de la carte internationale

**À utiliser pour ouvrir la démo devant David.**

**Étapes (storytelling) :**
1. Ouvrir la carte sur `http://localhost:3000`
2. **Pitch :** *"Voici la carte en temps réel. Chaque épingle est une maison ouverte pour votre prochain live."*
3. Dézoomer au maximum → la carte mondiale avec des épingles sur 3 continents
4. **Pitch :** *"Quand vous créez un live, tous les ambassadeurs sont automatiquement activés. En un clic, 6 pays sont prêts à vous accueillir."*
5. Cliquer sur l'épingle de **Kofi à Abidjan** → *"120 personnes peuvent se réunir en Côte d'Ivoire pour suivre votre message."*
6. Cliquer sur **Marie à Paris** → *"Et ici, 15 places disponibles à Paris, avec ses propres consignes d'accueil."*
7. **Pitch :** *"Le visiteur clique, envoie une demande, et reçoit l'adresse uniquement quand l'hôte valide. Zéro risque de diffusion non désirée."*

---

## Pour réinitialiser les données entre les démos

```bash
node scripts/seed.js
```

Ce script vide la base et réinsère toutes les données de démo proprement.

---

## Compte admin pour la démo

Pour accéder aux pages `/admin/*` :
1. Aller dans **Supabase Dashboard** → Authentication → Users
2. Créer un utilisateur avec votre e-mail
3. Dans les **user_metadata**, ajouter : `{ "role": "admin" }`
4. Utiliser la magic link pour se connecter via `http://localhost:3000/auth`

---

*Généré le 21 avril 2026 — DavidTheryApp v1*
