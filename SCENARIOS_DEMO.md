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

2. **L'acceptation explicite** — Quand un visiteur demande à rejoindre une ambassade, l'hôte reçoit un email et choisit d'accepter ou non. S'il accepte, le visiteur reçoit les coordonnées par email. L'hôte peut refuser sans s'expliquer. Est-ce que ce flux vous semble juste ?

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
| Sophie | Bordeaux | France | 10 places | pending_review |

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
- Sophie (Bordeaux) n'apparaît pas : statut `pending_review`, pas encore validée par l'admin

---

## Scénario 2 — Demande de contact (parcours visiteur)

**Ce que montre ce scénario :**
Un visiteur qui veut rejoindre une ambassade pour le prochain live. Flux actuel : le visiteur envoie sa demande → l'ambassadeur reçoit un email avec un lien → l'ambassadeur accepte ou refuse explicitement → si accepté, le visiteur reçoit les coordonnées par email.

**Étapes — côté visiteur :**
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
5. Message de confirmation : *"Votre demande a été envoyée à Marie. Elle vous répondra par e-mail."*

**Suite — côté ambassadeur (voir Scénario 6) :**
- Marie reçoit un email avec le résumé de la demande et un bouton « Accepter »
- Elle clique → page `/accueillir/{token}` → elle accepte
- Thomas reçoit les coordonnées de Marie par email

**Points clés :**
- L'adresse de l'ambassadeur n'est jamais affichée sur le site — elle est envoyée par email uniquement après acceptation explicite de l'hôte
- Le champ WhatsApp accepte n'importe quel indicatif pays (sélecteur de drapeau)
- La demande est en statut `pending` jusqu'à la décision de l'hôte — pas d'auto-acceptation

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
Le parcours pour devenir un nouvel ambassadeur. Le candidat remplit le formulaire → statut `pending_review` → l'admin pré-approuve → le candidat reçoit un email pour compléter son profil (questionnaire enrichissement) → l'admin valide définitivement.

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
- La ville avec autocomplete est géocodée → l'épingle apparaîtra précisément sur la carte une fois validé et activé
- Le pays se remplit automatiquement depuis le geocoding (ex : sélectionner "Yaoundé" → pays = "Cameroun")
- Le bouton "Continuer" est bloqué tant qu'une ville n'a pas été sélectionnée dans la liste (pas de saisie libre)
- 200+ pays disponibles, francophones épinglés en tête
- L'adresse est stockée mais jamais visible publiquement
- La candidature arrive dans la modération admin avec statut `pending_review` — **pas d'auto-activation**
- L'ambassadeur n'apparaît sur la carte qu'après validation complète + activation manuelle pour un live


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

## Scénario 6 — L'ambassadeur reçoit et accepte une demande

**Ce que montre ce scénario :**
Ce que voit l'ambassadeur quand un visiteur lui demande de rejoindre son ambassade. L'hôte accepte ou refuse explicitement — aucune auto-validation.

**Contexte :** Nathalie a envoyé une demande à Marie (Paris). Marie reçoit un email avec un lien tokenisé.

**Simuler le flux d'acceptation :**
1. Dans Supabase Dashboard → Table `contact_requests`
2. Trouver la ligne de **Nathalie** (visitor_email = `nathalie.v@mail.com`)
3. Copier la valeur de `action_token`
4. Ouvrir : `http://localhost:3000/accueillir/{action_token}`
5. La page affiche :
   - Nom du visiteur, nombre de personnes, message
   - Nom de l'event et date
   - Deux boutons : **« Accepter »** (vert) et **« Refuser »** (rouge)
6. Cliquer sur **« Accepter »**
7. Confirmation : *"Nathalie recevra vos coordonnées par e-mail."*
8. Nathalie reçoit un email avec l'adresse complète de Marie

**Points clés :**
- Aucune authentification requise : le lien tokenisé identifie l'hôte
- L'adresse n'est JAMAIS affichée sur le site — envoyée par email uniquement après acceptation
- L'hôte peut refuser depuis cette même page ou via le lien rapide `/refuser/{token}` dans l'email
- La page `/accueillir/[token]` gère aussi le cas « déjà accepté » ou « déjà refusé » proprement

---

## Scénario 7 — L'hôte refuse une demande (lien rapide)

**Ce que montre ce scénario :**
L'hôte peut refuser une demande via un lien dédié, sans passer par la page d'acceptation complète.

**Contexte :** L'hôte reçoit un email avec deux liens : « Voir la demande » (`/accueillir/`) et « Refuser » (`/refuser/`). Le lien `/refuser/` est le chemin rapide.

**Étapes :**
1. Dans Supabase Dashboard → Table `contact_requests`
2. Trouver une ligne en statut `pending` (ex : Luc → Marie, `luc.b@mail.com`)
3. Copier la valeur de `action_token`
4. Ouvrir : `http://localhost:3000/refuser/{action_token}`
5. La page demande confirmation : *"Refuser la demande de Luc ?"*
6. Cliquer sur « Oui, refuser cette demande »
7. Statut passe à `declined` — le visiteur est notifié par email

**Points clés :**
- L'hôte n'a pas besoin de se connecter : le lien tokenisé suffit
- La demande de Laure (Fatou/Bruxelles) est déjà en `declined` dans les données de démo
- Refus et acceptation sont deux chemins distincts : `/refuser/` (rapide) et `/accueillir/` (contexte complet)

---

## Scénario 8 — Présentation de la carte internationale

**À utiliser pour ouvrir la démo devant David.**

**Étapes (storytelling) :**
1. Ouvrir la carte sur `http://localhost:3000`
2. **Pitch :** *"Voici la carte en temps réel. Chaque épingle est une maison ouverte pour votre prochain live."*
3. Dézoomer au maximum → la carte mondiale avec des épingles sur 3 continents (Europe, Amérique, Afrique)
4. **Pitch :** *"J-7 avant le live, vous planifiez un envoi email depuis le calendrier. Chaque ambassadeur reçoit un lien pour confirmer sa participation. Ceux qui cliquent apparaissent sur la carte."*
5. Cliquer sur l'épingle de **Kofi à Abidjan** → *"120 personnes peuvent se réunir en Côte d'Ivoire pour suivre votre message."*
6. Cliquer sur l'épingle de **Aminata à Dakar** → *"60 places au Sénégal."*
7. Cliquer sur **Marie à Paris** → *"Et ici, 15 places disponibles à Paris, avec ses propres consignes d'accueil."*
8. **Pitch :** *"Le visiteur envoie une demande. L'hôte reçoit un email et accepte ou refuse explicitement. Si accepté, le visiteur reçoit les coordonnées par email. Aucun compte requis — tout passe par un lien tokenisé sécurisé."*

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
Un visiteur qui a reçu une guérison peut témoigner via le formulaire public, sans compte.

**Étapes :**
1. Ouvrir `http://localhost:3000/temoignages/nouveau`
   - Ou cliquer sur « Partage ton témoignage » depuis `/temoignages`
2. Sélectionner le live dans le dropdown : *"Nuit de Prière — Souffle nouveau"*
3. Remplir le témoignage :
   - Zone de texte (min 20 chars) : *"J'avais des douleurs chroniques depuis 10 ans. Pendant le live, quelque chose s'est passé — je suis guéri !"*
   - Prénom (optionnel) : *Pierre*
   - Ville (optionnel) : *Paris*
4. Cliquer sur « Envoyer mon témoignage »
5. Confirmation : *"Merci ! Votre témoignage sera publié après validation."*
6. Dans `/admin/temoignages` → le témoignage de Pierre apparaît dans les en attente (`is_visible = false`)
7. David clique « Publier » → visible sur `/temoignages`

**Points clés :**
- Accès public, aucun compte requis, aucun token nécessaire
- Le formulaire est pré-rempli si `?live=<uuid>` est passé dans l'URL (depuis le filtre `/temoignages`)
- Les témoignages anonymes (`host_profile_id = NULL`) et ceux des ambassadeurs se modèrent au même endroit

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

## Scénario 14 — Pipeline de validation ambassadeur (pré-approbation → questionnaire → validation)

**Ce que montre ce scénario :**
Le cycle complet de validation d'un nouveau candidat : l'admin pré-approuve → le candidat reçoit un email et complète son questionnaire → l'admin valide définitivement.

**Prérequis :** Sophie (Bordeaux) a le statut `pending_review` dans les données de démo.

**Côté admin — pré-approbation :**
1. Ouvrir `http://localhost:3000/admin/ambassadeurs`
2. Trouver **Sophie Leroux (Bordeaux)** — badge statut `En examen`
3. Cliquer sur « Pré-approuver » → statut passe à `pre_approved`
4. Sophie reçoit un email avec un lien vers `/dashboard/questionnaire`

**Côté ambassadeur — questionnaire enrichissement :**
1. Sophie se connecte via le magic link → `/dashboard`
2. Un encart pastoral s'affiche en haut : *"Félicitations, tu as été pré-approuvée ! Il reste une dernière étape."*
3. Cliquer sur « Compléter mon profil →» → `/dashboard/questionnaire`
4. Remplir :
   - *"J'ai suivi le Défi Guérison"* (checkbox)
   - Fréquentation église : Régulier
   - Dénomination : Protestant évangélique
   - *"J'ai déjà assisté à une conférence de David Théry"* (checkbox)
   - Parcours spirituel : quelques lignes
5. Cliquer sur « Envoyer » → statut passe à `enrichment_pending`
6. L'équipe reçoit une notification email : *"Sophie a complété son questionnaire — en attente de validation finale."*

**Côté admin — validation finale :**
1. Dans `/admin/ambassadeurs`, Sophie affiche le badge `Dossier complet`
2. Consulter le questionnaire enrichissement dans la vue détail
3. Cliquer « Valider » → statut passe à `validated`
4. Le trigger DB crée automatiquement une `host_activation` avec `is_active=false`
5. Sophie reçoit l'email de bienvenue ambassadeur

**Points clés :**
- La transition `pre_approved → validated` directe est bloquée : le questionnaire est obligatoire
- L'admin peut néanmoins utiliser « Valider sans questionnaire » (action distincte, loggée)
- Sophie n'apparaît sur la carte qu'après activation explicite pour un live via campagne email

---

## Scénario 15 — Activation par campagne email (admin → ambassadeur → carte)

**Ce que montre ce scénario :**
Comment David active ses ambassadeurs pour un live via une campagne email planifiée.

**Côté admin — planification de la campagne :**
1. Ouvrir `http://localhost:3000/admin/calendrier`
2. Dans le formulaire « Programmer une campagne » :
   - **Live** : sélectionner *"Live Guérison — La puissance de l'Amour"* (J+10)
   - **Type** : Ambassadeurs
   - **Date d'envoi** : J-7 avant le live, 10h00
   - **Message personnalisé** (optionnel) : *"Chers ambassadeurs, le prochain live aura lieu dans 7 jours. Êtes-vous disponibles pour accueillir ?"*
3. Cliquer sur « Planifier la campagne »
4. La campagne apparaît dans la liste avec statut `pending`

**Ce qui se passe à l'envoi (cron toutes les 5 min) :**
- Le cron envoie un email à chaque ambassadeur `validated`
- L'email contient un bouton **« Je m'inscris comme ambassadeur »**
- Le bouton pointe vers `/accueillir/activer/{activation_token}` (token unique par ambassadeur)

**Côté ambassadeur — activation depuis l'email :**
1. Marie reçoit l'email de campagne
2. Elle clique sur le bouton → page `/accueillir/activer/{token}`
3. La page affiche : titre du live, date, bouton « Je m'inscris comme ambassadeur »
4. Marie clique → `host_activations.is_active = true` → elle apparaît sur la carte

**Points clés :**
- Aucune authentification requise : le token d'activation est à usage unique et suffisant
- Si Marie clique deux fois → idempotent (pas d'erreur, pas de doublon)
- Ambassadeurs non actifs via campagne = ne figurent pas sur la carte pour ce live
- Le statut de la campagne passe `pending → sending → sent` avec compteur d'envois

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

*Mis à jour le 1 mai 2026 — DavidTheryApp v1.6 (nettoyage notes brutes scénarios 2 et 4 ; pitch 24h auto supprimé ; scénario 11 réécrit /accueil-invite → /temoignages/nouveau ; scénario 14 : pipeline validation enrichissement ; scénario 15 : activation par campagne email)*
