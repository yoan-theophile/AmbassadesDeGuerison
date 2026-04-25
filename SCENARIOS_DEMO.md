# Scénarios de test — Ambassades de Guérison
## Guide de démo pour David Thery

> **Avant de commencer** : lancer `npm run dev` puis ouvrir `http://localhost:3000`

---

## Avant la démo — Discussion avec David

> **Objectif de cette section :** valider votre compréhension du besoin avant de montrer quoi que ce soit.
> Poser ces questions à David, l'écouter corriger ou confirmer, puis ajuster la démo en conséquence.

### Ce que j'ai compris de votre besoin

*À dire à David, en langage simple :*

> « Vous faites des lives de guérison en direct depuis La Réunion. Des milliers de personnes vous regardent seules chez elles — c'est dommage, parce que quelque chose de fort se passe quand on prie ensemble dans une même pièce.
>
> L'idée de cette application, c'est de créer une chaîne d'ambassades : des gens de confiance — des pasteurs, des responsables de cellule, des croyants engagés — qui ouvrent leur maison ou leur église le soir du live, pour que d'autres viennent les rejoindre. Votre message arrive chez eux via YouTube, mais ils sont ensemble physiquement.
>
> Votre rôle dans l'app : créer les lives à l'avance, voir en direct les signaux que vous envoient vos ambassadeurs pendant le live (s'il se passe quelque chose de fort, ils "lèvent la main"), modérer les témoignages après, et voir les KPIs globaux. »

### Questions de validation avant la démo

1. **Le recrutement des ambassadeurs** — Comment ça se passe aujourd'hui ? Via WhatsApp ? Réseaux ? Vous les connaissez personnellement tous ? L'app doit-elle rester fermée (vous activez chaque ambassadeur) ou ouverte (n'importe qui peut s'inscrire) ?

2. **Le délai de 24h** — Quand un visiteur demande à rejoindre une ambassade, l'adresse n'est révélée qu'au bout de 24h. L'hôte peut refuser sans s'expliquer. Est-ce que ça vous semble juste pour protéger vos ambassadeurs ?

3. **Les signaux "main levée"** — Pendant le live, vous auriez `/admin/live` ouvert sur un deuxième écran. Vous voyez les ambassadeurs qui veulent vous passer un témoignage en direct. Vous avez besoin de ça, ou c'est trop complexe à gérer pendant que vous animez ?

4. **Les témoignages écrits** — Après le live, les ambassadeurs et les visiteurs peuvent envoyer un témoignage. Vous les validez (ou refusez) avant publication. Qui fait cette modération — vous, ou quelqu'un de votre équipe ?

5. **Ce que vous attendez de la démo** — Y a-t-il une fonctionnalité spécifique que vous voulez voir en priorité ?

---

## Données de démo disponibles

### 8 ambassadeurs (7 actifs + 1 en attente d'onboarding)
| Ambassadeur | Ville | Pays | Capacité | Statut |
|-------------|-------|------|---------|--------|
| Marie | Paris | France | 15 places | actif |
| Jean-Pierre | Lyon | France | 80 places (COMPLET) | actif |
| Fatou | Bruxelles | Belgique | 40 places | actif |
| Samuel | Montréal | Canada | 12 places | actif |
| Claire | Genève | Suisse | 8 places | actif |
| Kofi | Abidjan | Côte d'Ivoire | 120 places | actif |
| Aminata | Dakar | Sénégal | 60 places | actif |
| Sophie | Bordeaux | France | 10 places | pending_onboarding |

### 4 événements
| Label | Titre | Statut |
|-------|-------|--------|
| J-60 | Live Guérison — Foi sans frontières | passé |
| J-30 | Live Guérison — Touché par la grâce | passé |
| J-7 | Nuit de Prière — Souffle nouveau | passé ← **event principal pour la démo** |
| J+10 | Live Guérison — La puissance de l'Amour | **à venir** |

### 10 demandes de contact (sur l'event J-7)
| Visiteur | Ambassade | Statut |
|---------|-----------|--------|
| Pierre | Marie (Paris) | pending — onboarding fait |
| Nathalie | Marie (Paris) | pending — lien non consulté |
| Luc | Marie (Paris) | pending — onboarding fait |
| Ahmed | Jean-Pierre (Lyon) | pending — onboarding fait |
| Isabelle | Jean-Pierre (Lyon) | pending — lien non consulté |
| Laure | Fatou (Bruxelles) | declined (refusée) |
| Thomas | Fatou (Bruxelles) | pending — onboarding fait |
| Emmanuel | Samuel (Montréal) | pending — onboarding fait |
| Bénédicte | Kofi (Abidjan) | pending — onboarding fait |
| Oumar | Aminata (Dakar) | pending — onboarding fait |

### 14 témoignages
- 10 ambassadeurs — répartis sur les 3 events passés
- 4 anonymes (formulaire public) — Grâce (Nantes), Patrick (Marseille), Christelle (Douala), 1 sans nom
- **12 visibles + 2 en attente de modération**

### 5 signaux live (event J-7)
| Ambassadeur | Statut signal |
|-------------|--------------|
| Jean-Pierre (Lyon) | approved |
| Kofi (Abidjan) | approved |
| Aminata (Dakar) | **pending** ← à traiter en démo |
| Marie (Paris) | used (lien partagé à l'antenne) |
| Fatou (Bruxelles) | declined |

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
3. La carte s'affiche avec **7 épingles** géolocalisées (Paris, Lyon, Bruxelles, Montréal, Genève, Abidjan, Dakar)
4. **Barre de recherche** (centre haut de la carte) : taper « Dakar » → suggestion apparaît → sélectionner → la carte vole vers Dakar zoom 10
5. Zoomer sur la France : Paris (Marie) et Lyon (Jean-Pierre)
6. Zoomer sur l'Europe : Bruxelles (Fatou) et Genève (Claire)
7. Dézoomer → Montréal, Abidjan, Dakar apparaissent sur 3 continents
8. Cliquer sur l'épingle de **Marie à Paris** → bulle d'information avec prénom, ville et capacité
9. Cliquer sur « Contacter → » dans la bulle

**Points clés à montrer à David :**
- Couverture internationale en temps réel — 6 pays sur 3 continents
- L'épingle de **Jean-Pierre (Lyon)** affiche « Complet » (80/80)
- La barre de recherche permet à n'importe quel visiteur de trouver une ambassade près de chez lui
- Si le visiteur zoome dans une zone sans ambassade (≥ niveau pays), un hint discret apparaît : *"Pas d'ambassade dans ta ville ? / Sois le premier ambassadeur ici →"*
- Actualisation automatique toutes les 30 secondes sans rechargement de page
- Sophie (Bordeaux) n'apparaît pas : statut `pending_onboarding`, pas encore visible

---

## Scénario 2 — Demande de contact (parcours visiteur)
 ! je viens avec combien de places ?
 ! envoie de demande, pas de réponse automatique | on mets juste dans l'email réponse
 De l'autre côté, Aminata peut dire oui ou non. et c'est après qu'elle recevra son adresse mail. Aminata reçoit le mail ou le numéro.

 avoir les process: Etape 1 ensuite 2.
 on garde le lien whatsapp.


**Ce que montre ce scénario :**
Un visiteur qui veut rejoindre une ambassade pour le prochain live. Le nouveau flux : auto-acceptation après 24h, pas de validation explicite de l'hôte.

**Étapes :**
1. Depuis la carte, cliquer sur **Marie (Paris)** → « Contacter → »
   - URL : `http://localhost:3000/ambassade/{id}`
2. La page affiche :
   - Prénom et ville
   - Type de lieu : Domicile
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

! L'adresse ne sera pas sur la carte
! acceptée une fois que vous avez acccepeté
à la placde de Adresse complète (privée)*
! lien whatsapp: popup pour expliquer comment créer un lien de groupe whatsapp
! envoyer la vidéo d'onboarding par email
! RAjouter le bouton "j'accepte" dans l'email
! Rajouter dans l'email la vidéo et le bouton
! rendez vous dans votre boîte mail pour finaliser l'inscription
cliquer sur le bouton.
! vérifier le process pour entrer dans une famille
! idée: grosse ville: géolocaliser à partir de l'adresse, par quartier par exemple ou menu déroulant
! bug à résoudre: ambassade non activée

On va recevoir beaucoup mais les gens doivent pouvoir choisir les dates auxquelles ils veulent participer.
Ajouter un formulaire
! blacklist par mail / numéro de téléphone
! possibilité de désactiver 
On a un calendrier: on envoie un mail à tous les ambassadeurs actifs.
Est-ce que vous êtes intéressés ou non ?
on met un lien pour activer leur ambassade sur la carte.
voici la prochaine date: click sur oui => activer sur la carte, sinon la carte s'efface
Si un visiteur a un problème,comme sur airbnb, les participants doivent pouvoir évaluer ce qu'ils ont vécu. C'est dans les deux sens. Chacun peut évaluer l'autre.

onboarding:
lire vidéo
lire la charte
on leur propose un autre mail pour qu'ils puissent nous parler d'eux.
juste le prénom sur la carte
nous on veut avoir juste le prénom
on veut avoir leur numéro de téléphone: on n'affiche pas mais David peut les appeler
système de visionnage(public) : téléphone, écran, portable
avez-vous fait le défi de guérison ? formation vraiment libre ?
est-ce que vous fréquentez une église ?
catholique / protestant ?
Avez-vous déjà lu un de mes livres ?
Assisté à une conférence.

Avec leur email dans mailchimp, on peut voir tous leurs tags.
Avoir un mot pour dire qu'à la fin du formulaire, on peut les accepter ou pas.
Savoir le poul des gens. Automatiser au maximum mais ça reste des gens.

Qu'est-ce qui serait un drapeau rouge.
- Prendre une photo du salon.
- hérésie
- 15 chats/insalubrité
- homme qui cherche une femme

Comment enlever de la friction par rapport aux personnes qui ont peur d'arriver.
photo de profil: sourire, idée de la personne(insalubre, drapeau rouge)
photo de leur salon(privé chez l'admin)
ça montre que c'est du sérieux tout en enlevant de la carte

prévalidation manuelle dans laquelle on valide que la personne est un candidat potentiel
comme une certification
la personne décidera d'elle-même des lives qu'elle va suivre
cool si statut intermédiaire: approuvé, en attente, examen approfondi.
peut-être elle(la sécrétaire de Camille) pourra appeler la personne

Après le live, les participants reçoivent un mail pour savoir s'ils sont venus ensuite d'évaluer avec quelques critères:
évaluation avec des étoiles: accueil, propreté, convivialité
responsable peut aussi évaluer: signaler quand c'était pas bien ou good

les gens puissent évoluer l'hôte
à la fin du live, les gens puissent partager leurs feedbacks:
est-ce qu'il y a un point à remonter, par exemple signaler un drapeau rouge
l'assisante pourra le voir et prendre des mesures à ce sujet.

super. 
envisager une traduction en temps réel
une application où 
être sur plusieurs canaux, sur plusieurs pays
il y a un niveau de filtre: 

Serveur O2Switch
Depôt: 
Lien public: 

Principe de faire confiance aux gens qui vontn ouvrir leur maison, des gens qui vont aller chez le gens, des guérisons.

Intégrer l'IA
Des gens qui posent des questions, avoir une FAQ.
Volume: sondage d'intérêt.
250 personnes qui disent "je suis prêt à ouvrir mon église"
512 ça m'intéresse
Générer des finances

Pays:
- France
- Mexique
- Espagne
- Italie
- Nouvelle Calidonie

Système:
Calibrer pour supporter 1000 ambassades
Fonctionner par quartier
Témoignages
live samedi après midi (québequoi, france, réunion)

Idée: celui qui soif doit avoir accès
FAQ: questions - réponses
public parfois agés


Gestion des mails.

Code réduction pour les bouquins.



**Étapes :**
1. Depuis la carte, cliquer sur « Devenir ambassadeur » (bouton indigo en haut à droite)
   - Ou URL directe : `http://localhost:3000/inscription`
2. **Étape 1 — Coordonnées :**
   - Prénom : Thomas
   - E-mail : thomas.nouveau@test.fr
   - **Ville** : commencer à taper « Toul » → suggestions Nominatim apparaissent → sélectionner « Toulouse, France »
     *(La géolocalisation lat/lng est capturée automatiquement)*
   - **Pays** : se remplit automatiquement sur « France » après la sélection Toulouse
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
- Le pays se remplit automatiquement depuis le geocoding (ex : sélectionner "Yaoundé" → pays = "Cameroun")
- Le bouton "Continuer" est bloqué tant qu'une ville n'a pas été sélectionnée dans la liste (pas de saisie libre)
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
   - **Ambassades actives** : 7
   - **Pays représentés** : 6 (France, Belgique, Canada, Suisse, Côte d'Ivoire, Sénégal)
   - **Demandes de contact** : 10
   - **Témoignages** : 12 publiés

**Points clés :**
- Chiffres en temps réel
- Vue épurée, KPIs essentiels
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
2. Trouver la ligne de **Pierre** (visitor_email = `pierre.moreau@mail.com`)
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
2. Trouver la ligne de **Nathalie** (visitor_email = `nathalie.v@mail.com`)
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
3. Dézoomer au maximum → la carte mondiale avec des épingles sur 3 continents (Europe, Amérique, Afrique)
4. **Pitch :** *"Quand vous créez un live, tous les ambassadeurs sont automatiquement activés. En un clic, 6 pays sont prêts à vous accueillir."*
5. Cliquer sur l'épingle de **Kofi à Abidjan** → *"120 personnes peuvent se réunir en Côte d'Ivoire pour suivre votre message."*
6. Cliquer sur l'épingle de **Aminata à Dakar** → *"60 places au Sénégal."*
7. Cliquer sur **Marie à Paris** → *"Et ici, 15 places disponibles à Paris, avec ses propres consignes d'accueil."*
8. **Pitch :** *"Le visiteur envoie une demande, reçoit un lien sécurisé, et l'adresse s'affiche automatiquement après 24h. L'hôte peut refuser à tout moment. Zéro compte requis pour le visiteur."*

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
   - **Gauche — Mains levées** : liste des ambassadeurs qui veulent « monter en live »
     - Chaque signal affiche le nom, la ville et le message de l'ambassadeur
     - **Aminata (Dakar)** est en `pending` → cliquer « Approuver » → signal passe en approuvé
     - Bouton « Refuser » → signal décliné
     - Les signaux approuvés/refusés de Jean-Pierre et Kofi sont déjà là (archivés)
   - **Droite — Témoignages** : compteur des témoignages en attente de modération pour ce live
     - Affiche *"N témoignages en attente"*
     - Cliquer → redirige vers `/admin/temoignages` pré-filtré sur cet event
3. Les signaux se rafraîchissent automatiquement (toutes les 5s)

**Points clés :**
- David voit les signaux en temps réel pendant le live
- Les témoignages écrits se modèrent après le live depuis `/admin/temoignages`
- Le compteur à droite lui dit combien de témoignages l'attendent — sans polluer la vue live

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
5. Dans `/admin/temoignages` → le témoignage de Pierre apparaît dans les en attente
6. David clique « Publier » → le témoignage est visible sur `/temoignages`

**Points clés :**
- Zéro compte requis pour le visiteur : le token de son lien suffit
- Les témoignages visiteurs et ambassadeurs sont modérés au même endroit

---

## Scénario 12 — Modération post-live (admin/temoignages)

**Ce que montre ce scénario :**
La page de modération complète que David utilise après un live pour publier les témoignages.

**Étapes :**
1. Ouvrir `http://localhost:3000/admin/temoignages`
2. **Bandeau live** en haut : titre de l'event sélectionné + badge *"N en attente"*
3. **Stats bar** : total de témoignages / publiés / villes représentées — scopés au live sélectionné
4. **Combobox événement** (avec champ de recherche) : changer de live → les stats et onglets se réinitialisent
5. **Onglets** : Tous / En attente / Publiés
6. Cliquer sur un témoignage en attente → bouton « Publier » → apparaît immédiatement dans l'onglet "Publiés"
7. Bouton « Tout publier » → valide tous les témoignages en attente en un clic
8. Bouton **« Copier le lien »** → copie l'URL `/temoignages` pour partager sur les réseaux

**Points clés :**
- Filtrage par event : David peut retrouver les témoignages d'un live passé (3 events dans les données de démo)
- Le combobox a un champ de recherche — utile quand David aura 20+ lives archivés
- Bouton "Tout publier" pour les sessions chargées
- Le lien copiable permet de poster directement la page publique des témoignages

---

## Scénario 13 — Page témoignages publique

**Ce que montre ce scénario :**
La vitrine publique des témoignages — ce que n'importe quel visiteur peut voir.

**Étapes :**
1. Ouvrir `http://localhost:3000/temoignages`
2. En-tête : *"Ce que Dieu a fait"* + stats (12 témoignages • N villes)
3. Filtre par live : combobox avec les 3 events passés → changer → la grille se filtre
4. Grille 2 colonnes — cartes de hauteur variable, certaines avec *"Lire la suite"*
5. Cliquer sur « Lire la suite » → le texte long se déplie
6. Boutons **« Partager »** (copier le lien + WhatsApp)
7. CTA en bas : *"Partagez votre témoignage"* → `/temoignages/nouveau`

**Points clés :**
- Page publique indexable — preuve sociale pour les visiteurs hésitants
- Témoignages anonymes (Grâce/Nantes, Patrick/Marseille) et ambassadeurs côte à côte
- Le filtre par live avec date dans le label aide David à retrouver ses archives

---

## Pour réinitialiser les données entre les démos

```bash
node scripts/seed.js
```

Ce script vide la base et réinsère toutes les données de démo proprement.

> **Note** : Le schéma DB doit correspondre à `scripts/reset-db.sql`. Si des colonnes
> sont manquantes, relancer ce script dans Supabase SQL Editor puis relancer `node scripts/seed.js`.

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

*Mis à jour le 24 avril 2026 — DavidTheryApp v1.4 (seed ×8 ambassadeurs + 4 events + 14 témoignages, barre recherche carte, admin/live compteur, scénario 12 modération post-live, section discussion préalable)*
