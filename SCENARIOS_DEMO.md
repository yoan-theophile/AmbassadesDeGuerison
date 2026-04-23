# Scénarios de test — Ambassades de Guérison
## Guide de démo pour David Thery

> **Avant de commencer** : lancer `npm run dev` puis ouvrir `http://localhost:3000`

---

## Données de démo disponibles

### 7 ambassadeurs (6 actifs + 1 en attente d'onboarding)
| Ambassadeur | Ville | Pays | Capacité | Statut |
|-------------|-------|------|---------|--------|
| Marie | Paris | France | 15 places | actif |
| Jean-Pierre | Lyon | France | 80 places (COMPLET) | actif |
| Fatou | Bruxelles | Belgique | 40 places | actif |
| Samuel | Montréal | Canada | 12 places | actif |
| Claire | Genève | Suisse | 8 places | actif |
| Kofi | Abidjan | Côte d'Ivoire | 120 places | actif |
| Sophie | Bordeaux | France | 10 places | pending_onboarding |

### 2 lives
- **Live passé** : « Live Guérison #14 — Brisez les chaînes » (il y a 3 semaines)
- **Live à venir** : « Live Guérison #15 — La puissance de l'Amour » (dans 10 jours)

### 5 demandes de contact (sur le live passé)
| Visiteur | Ambassade | Statut |
|---------|-----------|--------|
| Pierre | Marie (Paris) | pending — onboarding fait |
| Nathalie | Marie (Paris) | pending — lien non encore consulté |
| Ahmed | Jean-Pierre (Lyon) | pending — onboarding fait |
| Laure | Fatou (Bruxelles) | declined (refusée) |
| Emmanuel | Samuel (Montréal) | pending — onboarding fait |

---

## Scénario 1 — La carte publique

**Ce que montre cette page :**
La carte mondiale avec les épingles des ambassades actives + le bandeau événement.

**Étapes :**
1. Ouvrir `http://localhost:3000`
2. **Bandeau EventBanner** visible en haut de la carte — 4 états :
   - Live démarré depuis < 4h : *"Live en cours — rejoignez-nous"* (indigo, icône pulsante)
   - Prochain live dans < 7j : *"Prochain live dans 10j 4h 32min"* (compte à rebours indigo)
   - Prochain live dans ≥ 7j : *"Prochain live le samedi 3 mai à 18h00"* (heure en timezone locale du visiteur)
   - Aucun live à venir : *"Dernier live il y a X jours — prochainement"*
3. La carte s'affiche avec 6 épingles géolocalisées
4. Zoomer sur la France : Paris (Marie) et Lyon (Jean-Pierre)
5. Zoomer sur l'Europe : Bruxelles (Fatou) et Genève (Claire)
6. Dézoomer : Montréal (Canada) et Abidjan (Côte d'Ivoire) apparaissent
7. Cliquer sur l'épingle de **Marie à Paris** → bulle d'information avec prénom, ville et capacité
8. Cliquer sur « Contacter → » dans la bulle

**Points clés à montrer à David :**
- Couverture internationale en temps réel
- L'épingle de **Jean-Pierre (Lyon)** affiche « Complet » (80/80)
- Actualisation automatique toutes les 30 secondes sans rechargement de page
- Sophie (Bordeaux) n'apparaît pas : statut `pending_onboarding`, pas encore visible
- La carte s'affiche même s'il n'y a pas de live passé (fallback sur le prochain event futur)

---

## Scénario 2 — Demande de contact (parcours visiteur)

**Ce que montre ce scénario :**
Un visiteur qui veut rejoindre une ambassade pour le prochain live. Le nouveau flux : auto-acceptation après 24h, pas de validation explicite de l'hôte.

**Étapes :**
1. Depuis la carte, cliquer sur **Marie (Paris)** → « Contacter → »
   - URL : `http://localhost:3000/ambassade/{id}`
2. La page affiche :
   - Prénom et ville
   - Type de lieu : Domicile
   - Mode de contact : Formulaire
   - Les consignes de Marie : *"Sonner à l'interphone Dubois. Ascenseur disponible. Parking Opéra à 200m."*
3. Remplir le formulaire de contact :
   - **Prénom** : Thomas
   - **E-mail** : thomas.demo@test.fr
   - **WhatsApp** (optionnel) : +33 6 12 34 56 78 — sélectionner le drapeau France
   - **Message** : Je viendrai avec mon épouse, nous sommes deux.
4. Cliquer sur « Envoyer la demande »
5. Message de confirmation : *"Un lien d'accès vous a été envoyé par e-mail. L'adresse de Marie sera disponible dans 24 heures."*

**Points clés :**
- L'adresse privée n'est jamais visible avant l'expiration du délai de 24h
- Le champ WhatsApp accepte n'importe quel indicatif pays (sélecteur de drapeau)
- La demande est en statut `pending` — l'hôte peut refuser, sinon c'est automatique
- Le visiteur reçoit un lien `/accueil-invite/{token}` par e-mail

---

## Scénario 3 — Ambassade avec groupe WhatsApp

**Ce que montre ce scénario :**
Une ambassade d'église avec lien WhatsApp direct.

**Étapes :**
1. Depuis la carte, cliquer sur **Jean-Pierre (Lyon)**
2. Cliquer sur « Contacter → »
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
Le parcours pour devenir un nouvel ambassadeur, avec saisie de ville intelligente et sélection de pays complète.

**Étapes :**
1. Depuis la carte, cliquer sur « Devenir ambassadeur » (bouton indigo en haut à droite)
   - Ou URL directe : `http://localhost:3000/inscription`
2. **Étape 1 — Coordonnées :**
   - Prénom : Thomas
   - E-mail : thomas.nouveau@test.fr
   - **Ville** : commencer à taper « Toul » → suggestions Nominatim apparaissent → sélectionner « Toulouse, France »
     *(La géolocalisation lat/lng est capturée automatiquement)*
   - **Pays** : sélectionner dans la liste — les pays francophones sont en tête (France, Belgique, Suisse, Canada...)
   - Cliquer sur « Continuer »
3. **Étape 2 — Le lieu :**
   - Type : Domicile
   - Capacité : 12 personnes
   - Adresse complète : 15 rue de la République, 31000 Toulouse
   - Consignes : Appartement 3ème étage, porte gauche
   - Cliquer sur « Continuer »
4. **Étape 3 — Contact :**
   - Lien groupe WhatsApp (optionnel) : laisser vide
   - Récapitulatif visible (prénom, ville, type, capacité)
   - Cliquer sur « Envoyer ma demande »
5. Page de confirmation avec **share CTA** :
   - Bouton « Copier le lien » → copie l'URL de la carte
   - Bouton « WhatsApp » → partage pré-rempli : *"Je viens de m'inscrire comme ambassadeur…"*

**Points clés :**
- La ville avec autocomplete est géocodée → l'épingle apparaîtra précisément sur la carte une fois activé
- 200+ pays disponibles, francophones épinglés en tête
- L'adresse est stockée mais jamais visible publiquement avant activation
- La candidature arrive dans la modération admin
- Dès la confirmation, l'ambassadeur est incité à partager — viralité dès le premier contact

---

## Scénario 5 — Tableau de bord admin (KPIs)

**Ce que montre ce scénario :**
La vue de pilotage pour David.

**Étapes :**
1. Ouvrir `http://localhost:3000/admin/stats`
   - *(Redirige vers `/auth` si non connecté — normal en démo)*
   - Se connecter avec `david.thery@demo.fr` via magic link
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

## Scénario 6 — L'invitation visiteur (nouveau flux auto-accept)

**Ce que montre ce scénario :**
Ce que reçoit un visiteur après avoir soumis une demande. L'adresse est masquée 24h puis révélée automatiquement.

**Contexte :** Pierre a envoyé une demande à Marie (Paris). Sa demande est en statut `pending`. Il a déjà consulté son lien (onboarding_completed = true).

**Simuler l'état « délai écoulé » (adresse visible) :**
1. Dans Supabase Dashboard → Table `contact_requests`
2. Trouver la ligne de **Pierre** (visitor_email = `pierre.demo@mail.com`)
3. Copier la valeur de `action_token`
4. Modifier `created_at` à une date d'il y a plus de 24h (ex : `2026-04-20 10:00:00`)
5. Ouvrir : `http://localhost:3000/accueil-invite/{action_token}`
6. La page affiche directement l'adresse : *"12 rue de la Paix, 75001 Paris"*

**Simuler l'état « en attente » (< 24h, adresse masquée) :**
1. Même chemin, mais `created_at` laissé à maintenant
2. Ouvrir le lien → page « Bienvenue chez Marie »
3. Les règles générales + consignes de Marie s'affichent
4. Cliquer sur « J'ai bien pris note »
5. Message : *"Votre adresse sera disponible dans X heures"* (compte à rebours)

**Points clés :**
- L'adresse n'est dévoilée qu'après 24h (évaluation lazy, pas de cron)
- Le visiteur peut consulter son lien autant de fois qu'il veut
- `action_token` est le même UUID pour le lien visiteur et le lien de refus de l'hôte

---

## Scénario 7 — L'hôte refuse une demande

**Ce que montre ce scénario :**
L'hôte peut refuser une demande via son lien de refus, même après l'auto-accept.

**Contexte :** Nathalie a envoyé une demande à Marie mais Marie ne peut pas l'accueillir.

**Étapes :**
1. Dans Supabase Dashboard → Table `contact_requests`
2. Trouver la ligne de **Nathalie** (visitor_email = `nathalie.demo@mail.com`)
3. Copier la valeur de `action_token`
4. Ouvrir : `http://localhost:3000/refuser/{action_token}`
5. La page demande confirmation : *"Refuser la demande de Nathalie ?"*
6. Cliquer sur « Confirmer le refus »
7. Statut passe à `declined` — `accepted_count` décrémenté

**Points clés :**
- L'hôte n'a pas besoin de se connecter : le lien tokenisé suffit
- La demande de Laure (Fatou/Bruxelles) est déjà en `declined` dans les données de démo
- Refus possible à tout moment, même après la fenêtre 24h

---

## Scénario 8 — Présentation de la carte internationale

**À utiliser pour ouvrir la démo devant David.**

**Étapes (storytelling) :**
1. Ouvrir la carte sur `http://localhost:3000`
2. **Pitch :** *"Voici la carte en temps réel. Chaque épingle est une maison ouverte pour votre prochain live."*
3. Dézoomer au maximum → la carte mondiale avec des épingles sur 3 continents
4. **Pitch :** *"Quand vous créez un live, tous les ambassadeurs sont automatiquement activés. En un clic, 6 pays sont prêts à vous accueillir."*
5. Cliquer sur l'épingle de **Kofi à Abidjan** → *"120 personnes peuvent se réunir en Côte d'Ivoire pour suivre votre message."*
6. Cliquer sur **Marie à Paris** → *"Et ici, 15 places disponibles à Paris, avec ses propres consignes d'accueil."*
7. **Pitch :** *"Le visiteur envoie une demande, reçoit un lien sécurisé, et l'adresse s'affiche automatiquement après 24h. L'hôte peut refuser à tout moment. Zéro compte requis pour le visiteur."*

---

## Scénario 9 — Tableau de bord ambassadeur (share + live + témoignages)

**Ce que montre ce scénario :**
Ce que voit un ambassadeur connecté pendant (et après) un live.

**Prérequis :** se connecter en tant que Marie (magic link) depuis `/auth`.

**Section « Partager mon ambassade » :**
1. Ouvrir le dashboard → section bleue en haut
2. L'URL de la fiche ambassade est affichée : `…/ambassade/{id}`
3. Cliquer sur « Copier le lien » → feedback *"Copié !"*
4. Cliquer sur « Partager sur WhatsApp » → message pré-rempli avec la ville et l'URL

**Section « Lever la main pour témoigner » (pendant le live) :**
1. Saisir un texte dans la zone : *"Quelqu'un vient d'être guéri d'un genou douloureux depuis 3 ans !"*
2. Cliquer sur « Lever la main pour témoigner »
3. Confirmation : *"David verra votre témoignage"*
4. L'admin David voit le signal apparaître dans `/admin/live` dans les 5 secondes

**Section « Partager un témoignage » :**
1. Saisir un témoignage complet
2. Choisir le timing : *Pendant le live* ou *Après le live*
3. Envoyer → compteur *"1 témoignage envoyé"* s'incrémente
4. Renvoyer un 2e témoignage → *"2 témoignages envoyés"*
5. Chaque témoignage passe en modération (is_visible = false jusqu'à validation David)

---

## Scénario 10 — Feed temps réel David (admin/live)

**Ce que montre ce scénario :**
La page que David ouvre sur un 2e écran pendant le live.

**Étapes :**
1. Ouvrir `http://localhost:3000/admin/live`
2. Deux colonnes côte à côte :
   - **Gauche — Signaux live** : liste des ambassadeurs qui veulent « monter en live »
     - Chaque signal affiche le nom, la ville et le message de l'ambassadeur
     - Bouton « Approuver » → signal disparaît du feed (statut approuvé)
     - Bouton « Refuser » → signal décliné
   - **Droite — Témoignages à publier** : témoignages en attente de modération
     - Bouton « Publier » → témoignage visible sur la page publique `/lives/{id}/temoignages`
     - Bouton « Refuser » → supprimé
3. Les deux feeds se rafraîchissent automatiquement (signaux : 5s, témoignages : 10s)

**Points clés :**
- David voit TOUT en un seul écran, sans naviguer
- Les signaux viennent des ambassadeurs qui vivent quelque chose de fort
- Les témoignages viennent à la fois des ambassadeurs ET des visiteurs (via leur lien accueil-invite)

---

## Scénario 11 — Témoignage visiteur (parcours complet)

**Ce que montre ce scénario :**
Un visiteur qui a reçu une guérison peut témoigner directement depuis son lien d'invite.

**Contexte :** Pierre a déjà consulté son lien et l'adresse est visible. Modifier `created_at` de sa demande à -25h (voir Scénario 6).

**Étapes :**
1. Ouvrir le lien `/accueil-invite/{action_token}` de Pierre
2. L'adresse de Marie s'affiche
3. En bas de la page, section **« Partagez votre témoignage »** :
   - Zone de texte : *"J'avais des douleurs chroniques depuis 10 ans. Pendant le live, quelque chose s'est passé — je suis guéri !"*
   - Prénom (optionnel) : *Pierre*
   - Cliquer sur « Envoyer mon témoignage »
4. Confirmation : *"Merci ! Votre témoignage sera publié après validation."*
5. Dans `/admin/live` → colonne droite → le témoignage de Pierre apparaît (visiteur anonyme ou prénom)
6. David clique « Publier » → le témoignage est visible sur `/lives/{id}/temoignages`

**Points clés :**
- Zéro compte requis pour le visiteur : le token de son lien suffit
- Les témoignages visiteurs et ambassadeurs sont modérés au même endroit
- La page témoignages publique a un bouton « Partager » (copier + WhatsApp)

---

## Pour réinitialiser les données entre les démos

```bash
node scripts/seed.js
```

Ce script vide la base et réinsère toutes les données de démo proprement.

> **Note** : Le schéma DB doit correspondre à `scripts/reset-db.sql`. Si les colonnes
> `visitor_whatsapp` ou `onboarding_completed` sont manquantes, relancer ce script
> dans Supabase SQL Editor puis relancer `node scripts/seed.js`.

---

## Compte admin pour la démo

Deux comptes admin sont créés par le seed (rôle admin déjà configuré) :

| E-mail | Usage |
|--------|-------|
| `david.thery@demo.fr` | Compte démo David |
| `theo.nelson.ia@gmail.com` | Compte développeur |

> **⚠️ Resend sandbox** : avec `onboarding@resend.dev` comme sender, Resend ne livre qu'à l'e-mail du propriétaire du compte. Les autres adresses (dont `david.thery@demo.fr`) ne reçoivent rien.

**Connexion sans e-mail — via terminal :**

```bash
node scripts/magic-link.js david.thery@demo.fr
```

Le script affiche directement l'URL de connexion à ouvrir dans le navigateur. Valable 1 heure.

Pour le compte développeur (`theo.nelson.ia@gmail.com`), la magic link arrive normalement dans la boîte mail.

---

*Mis à jour le 24 avril 2026 — DavidTheryApp v1.3 (EventBanner 4 états + heure, TemoignageCard expand, planning heure La Réunion)*
