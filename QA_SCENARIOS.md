# QA Scenarios — Ambassades de Guérison

> **Comment utiliser ce fichier**
> Cocher chaque case au fur et à mesure des tests. Mettre `~` pour "partiel / à surveiller", `x` pour OK.
> Relancer `node scripts/demo-state.js <état>` pour changer l'état avant chaque section.

---

## Préparation

```bash
# 1. Base propre
node scripts/seed.js

# 2. Lancer l'app
npm run dev

# 3. Connexion admin
node scripts/magic-link.js david.thery@demo.fr
# → ouvrir l'URL dans le navigateur
```

**États disponibles (à lancer depuis la racine du projet) :**

| Commande | Ce que ça produit |
|---|---|
| `node scripts/demo-state.js live` | 🔴 Live en cours — EventBanner rouge, pins actifs |
| `node scripts/demo-state.js soon` | ⏱ Prochain dans 3j — countdown |
| `node scripts/demo-state.js upcoming` | 📅 Prochain dans 10j — état par défaut du seed |
| `node scripts/demo-state.js past` | ⏪ Entre deux lives — aucun futur |
| `node scripts/demo-state.js status` | Afficher l'état actuel sans modifier |

---

## Module 1 — Page d'accueil publique `/`

> Tester les 4 états via `demo-state.js`. Rafraîchir le navigateur après chaque changement d'état.

### État : `upcoming` (défaut seed — prochain dans 10j)

- [ ] La carte Leaflet s'affiche plein écran sans erreur
- [ ] L'EventBanner affiche la date du prochain live (ex : "Prochain live le lundi 11 mai")
- [ ] L'EventBanner est sur fond blanc/clair (pas rouge)
- [ ] Les 7 pins d'ambassadeurs apparaissent sur la carte
- [ ] Cliquer sur un pin → popup avec nom, ville, CTA "Contacter"
- [ ] La barre de recherche par ville est visible (haut-gauche)
- [ ] Saisir "Lyon" dans la recherche → dropdown Nominatim → cliquer → la carte recentre sur Lyon
- [ ] Le footer affiche "Ambassades de Guérison — rejoignez un groupe de prière..."
- [ ] Le header affiche le sous-titre "Groupes de prière — lives de guérison" (desktop)

### État : `soon` (prochain dans 3j)

- [ ] L'EventBanner affiche un countdown (ex : "Prochain live dans 2j 23h 59min")
- [ ] Le fond de l'EventBanner est indigo
- [ ] Le countdown se met à jour si on attend quelques secondes

### État : `live` (live en cours)

- [ ] L'EventBanner affiche "Live en cours — rejoignez-nous" sur fond rouge/indigo intense
- [ ] L'icône Radio clignote (pulsing)
- [ ] Les 7 pins sont activés (is_active=TRUE) — tous visibles sur la carte
- [ ] Cliquer sur un pin → popup avec CTA "Rejoindre cette ambassade" (ou équivalent live)

### État : `past` (aucun futur)

- [ ] L'EventBanner affiche "Dernier live il y a 7 jours — prochainement"
- [ ] Fond blanc/neutre
- [ ] Les pins restent visibles sur la carte (les ambassades existent toujours)

### Responsive

- [ ] Sur mobile (375px) : la carte est plein écran, l'EventBanner est lisible
- [ ] La barre de recherche ne chevauche pas le header sur mobile

---

## Module 2 — Page ambassade publique `/ambassade/[id]`

> Prérequis : état `upcoming` ou `live`. Cliquer sur un pin de Marie (Paris) depuis la carte.

- [ ] La page charge avec le nom, ville, pays de l'ambassadeur
- [ ] Le formulaire de contact est visible (prénom, email, message)
- [ ] Soumettre le formulaire avec des données valides → message de confirmation
- [ ] Soumettre sans prénom → erreur de validation
- [ ] Soumettre avec un email déjà existant → message "Demande déjà envoyée"
- [ ] Le honeypot (champ `website` caché) : si rempli → 200 silencieux (pas de vrai envoi)
- [ ] En état `live` : le formulaire est actif, la demande se crée
- [ ] En état `upcoming` : idem (le formulaire fonctionne hors-live)

---

## Module 3 — Flux de visite visiteur `/live/[event_id]/ambassade/[host_id]`

> Page de demande de visite avec `event_id` explicite.

- [ ] La page charge pour un event futur valide
- [ ] Formulaire : prénom, email, téléphone, message, nb_personnes
- [ ] Soumettre → confirmation → la demande apparaît dans le dashboard ambassadeur
- [ ] Si l'ambassade est pleine (`is_full=TRUE`) → message d'erreur approprié
- [ ] Si l'event n'existe pas → 404

---

## Module 4 — Dashboard ambassadeur `/dashboard`

> Se connecter avec `node scripts/magic-link.js marie.dubois@demo.fr` (statut `validated`)

### Accès et guards

- [ ] Sans session → redirige vers `/auth`
- [ ] Session avec profil `pending_review` → affiche état "en attente de validation"
- [ ] Session avec profil `pending_onboarding` → redirige vers `/onboarding`
- [ ] Session avec profil `validated` → dashboard complet s'affiche

### Contenu dashboard (état `upcoming`)

- [ ] Nom, ville de l'ambassadeur affichés
- [ ] Statut "Ambassadeur actif" visible
- [ ] Section "Mes demandes de visite" avec les 3 demandes de Marie (Pierre, Nathalie, Luc)
- [ ] Luc a le statut `accepted` — boutons Accept/Refuser grisés ou absents
- [ ] Pierre et Nathalie ont le statut `pending` — boutons Accept/Refuser disponibles

### Actions sur les demandes

- [ ] Cliquer "Accepter" sur Pierre → statut passe à `accepted`, `accepted_count` augmente
- [ ] Cliquer "Refuser" sur Nathalie → statut passe à `declined`
- [ ] Double-clic sur "Accepter" ne crée pas de doublon (idempotent)

### Photos (upload)

- [ ] Section "Photo profil" avec Dropzone visible
- [ ] Déposer une image JPG/PNG → aperçu inline, upload vers Supabase Storage
- [ ] Déposer un PDF → message d'erreur (format non accepté)
- [ ] Déposer un fichier > 5MB → message d'erreur (trop lourd)
- [ ] Section "Photo de la salle" disponible

### Partage du lien ambassade

- [ ] Bouton "Copier mon lien" → copie l'URL `/ambassade/[id]`
- [ ] Bouton "Partager" ouvre le mécanisme de partage natif (si supporté par le navigateur)

### État `live` — section Signaux

- [ ] En état `live` : une section "Signal live" apparaît dans le dashboard
- [ ] Zone de texte pour la description du signal
- [ ] Bouton "Envoyer un signal" → crée un signal dans `live_signals`
- [ ] Signal envoyé → confirmation, bouton désactivé ou message "Signal envoyé"
- [ ] En état `upcoming` : la section Signaux n'est PAS visible

### Témoignage post-live

- [ ] Zone de texte pour envoyer un témoignage (en bas du dashboard)
- [ ] Soumettre → témoignage visible dans `/admin/temoignages` (is_visible=false)
- [ ] Caractères minimum (20 chars) appliqués
- [ ] Double-submit bloqué (loading state)

---

## Module 5 — Page live ambassade `/visitor/[token]`

> Token = `action_token` d'une demande de contact acceptée.

- [ ] La page charge avec les infos du visiteur et de l'ambassade
- [ ] Adresse privée de l'hôte visible (après le délai de 24h ou immédiatement si testé directement)
- [ ] Token invalide → 404 ou message d'erreur approprié

---

## Module 6 — Accueil invité `/accueil-invite/[token]`

- [ ] La page charge avec le prénom du visiteur
- [ ] Affiche le nom + ville de l'ambassadeur
- [ ] Affiche les consignes d'accueil
- [ ] Lien WhatsApp visible si `whatsapp_group_url` non vide (Jean-Pierre / Kofi)
- [ ] Token invalide → message d'erreur clair
- [ ] Formulaire de témoignage présent

---

## Module 7 — Refus hôte `/refuser/[token]`

- [ ] La page charge pour un token valide
- [ ] Confirmer le refus → statut de la demande passe à `declined`
- [ ] Token déjà utilisé → message "Déjà traité"
- [ ] Token invalide → 404

---

## Module 8 — Inscription ambassadeur `/inscription`

### Étape 1 — Informations personnelles

- [ ] Champs obligatoires : prénom, email, ville, pays, capacité
- [ ] `CityInput` : saisir "Paris" → dropdown Nominatim apparaît → sélectionner "Paris, Île-de-France" → coordonnées lat/lng renseignées
- [ ] Sans sélection dans le dropdown → hint ambre "Sélectionnez une ville dans la liste"
- [ ] Bouton "Continuer" désactivé si `lat` est absent
- [ ] Sélectionner une ville étrangère (ex: "Yaoundé") → pays bascule automatiquement sur "Cameroun"
- [ ] `CountrySelect` : pays épinglés (FR, BE, CH, CA, LU, MA, SN, CI, CM) visibles en premier

### Étape 2 — Type d'ambassade

- [ ] Choisir "Individu" vs "Église" → champs adaptés (dénomination pour église)
- [ ] Champs consignes, setup vidéo
- [ ] Bouton "Créer mon profil" → soumission

### Soumission

- [ ] Succès → profil créé avec statut `pending_review` → redirection vers `/onboarding`
- [ ] Email déjà existant → message d'erreur "Email déjà utilisé"
- [ ] Honeypot rempli → 200 silencieux

---

## Module 9 — Onboarding `/onboarding`

> Se connecter avec Sophie (`sophie.leroux@demo.fr`, statut `pending_onboarding`)

- [ ] La page charge avec la vidéo YouTube configurée
- [ ] La case d'engagement et le bouton "Valider" sont **désactivés** avant tout clic dans la vidéo
- [ ] Cliquer dans la vidéo (focus sur l'iframe) → la case s'active
- [ ] Cocher la case → bouton "Valider mon engagement" s'active
- [ ] Cliquer "Valider" → `PATCH /api/onboarding/complete` → statut passe à `validated`
- [ ] Redirection vers `/dashboard` après validation
- [ ] Un profil déjà `validated` accédant à `/onboarding` est redirigé vers `/dashboard`

---

## Module 10 — Témoignages publics `/temoignages`

- [ ] La page charge avec l'en-tête "Ce que Dieu a fait"
- [ ] Stats visibles : "N témoignages • M villes"
- [ ] Grille 2 colonnes (desktop), 1 colonne (mobile)
- [ ] Cartes avec `line-clamp-4` — bouton "Lire la suite" si le texte est tronqué
- [ ] Cliquer "Lire la suite" → texte complet visible
- [ ] Cliquer "Réduire" → texte replié
- [ ] Filtre par live (combobox) → changer de live → la grille se filtre
- [ ] Témoignages anonymes (Grâce/Nantes, Patrick/Marseille) affichés sans ambassadeur
- [ ] Bouton "Partager" (copier lien + WhatsApp)
- [ ] CTA "Partage ton témoignage" → `/temoignages/nouveau`

---

## Module 11 — Formulaire témoignage `/temoignages/nouveau`

- [ ] La page charge sans authentification
- [ ] Dropdown live : liste les events passés avec leur titre et date
- [ ] Dropdown timing : "Pendant le live" / "Après le live"
- [ ] Contenu : minimum 20 chars, maximum 2000 chars
- [ ] Prénom et ville optionnels
- [ ] Soumettre → confirmation → témoignage en attente dans `/admin/temoignages`
- [ ] Pré-sélection via `?live=<uuid>` → le dropdown live est pré-rempli

---

## Module 12 — Feedback visiteur `/feedback/[token]`

- [ ] La page charge avec un token valide
- [ ] Formulaire : 4 étoiles (accueil, chaleur, écoute, prière) + texte libre
- [ ] Checkbox "Signaler un problème" → champ de motif apparaît
- [ ] Soumettre → feedback créé → visible dans `/admin/feedback`
- [ ] Token invalide → 404

---

## Module 13 — Pages admin — protection auth

> Toutes les pages `/admin/*` doivent rediriger un visiteur non-authentifié.

- [ ] `/admin/stats` → redirige vers `/auth` si non connecté
- [ ] `/admin/ambassadeurs` → redirige vers `/auth`
- [ ] `/admin/live` → redirige vers `/auth`
- [ ] `/admin/planning` → redirige vers `/auth`
- [ ] `/admin/temoignages` → redirige vers `/auth`
- [ ] `/admin/feedback` → redirige vers `/auth`
- [ ] `/admin/blacklist` → redirige vers `/auth`
- [ ] `/admin/team` → redirige vers `/auth`
- [ ] `/admin/calendrier` → redirige vers `/auth`
- [ ] `/admin/settings` → redirige vers `/auth`
- [ ] `/admin/settings/timing` → redirige vers `/auth`
- [ ] `/admin/moderation` → redirige vers `/admin/live` (pas vers `/auth`)

---

## Module 14 — Admin : stats `/admin/stats`

> Connexion admin requise.

- [ ] La page charge sans erreur
- [ ] KPIs affichés : nombre d'ambassadeurs, demandes, témoignages, signaux
- [ ] Les chiffres correspondent aux données du seed (8 ambassadeurs, 10 demandes, 14 témoignages, 5 signaux)

---

## Module 15 — Admin : ambassadeurs `/admin/ambassadeurs`

- [ ] La page charge avec la datatable (8 ambassadeurs dans le seed)
- [ ] Colonne statut : `validated` pour 7, `pending_review` pour Sophie
- [ ] Champ de recherche : saisir "Marie" → seule Marie apparaît
- [ ] Filtre par statut : "validated" → seuls les 7 actifs
- [ ] Filtre par statut : "pending_review" → seulement Sophie
- [ ] Pagination : si plus de N ambassadeurs, les pages fonctionnent
- [ ] Bouton "Suspendre" sur Marie → statut passe à `suspended`
- [ ] Bouton "Réactiver" sur Marie (suspendue) → statut repasse à `validated`
- [ ] Bouton "Pré-approuver" sur Sophie → statut passe à `pre_approved`
- [ ] Bouton "Rejeter" sur Sophie → statut passe à `rejected`

---

## Module 16 — Admin : live feed `/admin/live`

> Prérequis : état `live` (`node scripts/demo-state.js live`)

- [ ] La page charge avec le bandeau "Live en cours" (ou le nom de l'event actif)
- [ ] Liste des signaux : 5 signaux du seed (Jean-Pierre approved, Kofi approved, Aminata pending, Marie used, Fatou declined)
- [ ] Compteur "N signaux approuvés" visible
- [ ] Bouton "Approuver" sur le signal de Aminata (pending) → statut passe à `approved`
- [ ] Bouton "Refuser" sur un signal → statut `declined`
- [ ] Feed des témoignages visible (5 témoignages de l'event J-7)

### En état `upcoming` (hors live)

- [ ] La page charge sans erreur (pas de live en cours)
- [ ] Message "Aucun live en cours" ou affichage de l'event suivant

---

## Module 17 — Admin : planning `/admin/planning`

- [ ] La page charge avec les 4 events du seed
- [ ] Les dates sont affichées en heure La Réunion (UTC+4)
- [ ] Formulaire création d'event : titre, description, URL YouTube, date/heure
- [ ] Créer un event → apparaît dans la liste + dans EventBanner de la homepage
- [ ] Modifier un event existant → les changements sont sauvegardés
- [ ] La date/heure s'affiche correctement en timezone Réunion (field label : "Date et heure (heure La Réunion)")

---

## Module 18 — Admin : modération témoignages `/admin/temoignages`

- [ ] La page charge avec le bandeau live (titre + badge "N en attente")
- [ ] Stats bar : total / publiés / villes représentées, scopés à l'event sélectionné
- [ ] Combobox event : changer de live → les stats et onglets se réinitialisent
- [ ] Onglet "En attente" : 2 témoignages (Samuel + témoignage anon)
- [ ] Onglet "Publiés" : 12 témoignages
- [ ] Cliquer "Publier" → le témoignage passe dans "Publiés" immédiatement
- [ ] Bouton "Tout publier" → tous les "en attente" sont publiés en une fois
- [ ] Bouton "Copier le lien" → copie l'URL `/temoignages`
- [ ] Recherche multi-mots : saisir "Abidjan guérison" → filtrage
- [ ] Pagination fonctionnelle (si plus de 10 témoignages par page)

---

## Module 19 — Admin : modération feedbacks `/admin/feedback`

- [ ] La page charge avec les 3 feedbacks du seed
- [ ] 1 signalement en attente (Thomas B / Fatou)
- [ ] Cliquer "Voir le signalement" → motif affiché
- [ ] Bouton "Archiver" → le signalement passe en statut traité
- [ ] Notes de modération éditables

---

## Module 20 — Admin : blacklist `/admin/blacklist`

- [ ] La page charge sans erreur
- [ ] Formulaire d'ajout : email + motif
- [ ] Ajouter un email → il apparaît dans la liste
- [ ] La suppression d'un email de la liste fonctionne

---

## Module 21 — Admin : team `/admin/team`

- [ ] La page charge avec les 2 comptes admin (David + Théophile)
- [ ] Formulaire d'invitation d'un nouveau membre (email + rôle)
- [ ] Les rôles disponibles sont listés

---

## Module 22 — Admin : calendrier campagnes `/admin/calendrier`

- [ ] La page charge sans erreur
- [ ] Interface de création de campagne e-mail visible

---

## Module 23 — Admin : settings onboarding `/admin/settings`

- [ ] La page charge avec l'URL vidéo actuelle (vide → fallback `config/onboarding.ts`)
- [ ] Modifier l'URL YouTube → sauvegarder → la page `/onboarding` affiche la nouvelle vidéo
- [ ] Modifier le chemin PDF → sauvegarder → répercuté dans `/onboarding`

---

## Module 24 — Admin : settings timing `/admin/settings/timing`

- [ ] La page charge avec les valeurs par défaut de la `event_timing_config`
- [ ] Modifier une valeur → sauvegarder → les délais sont mis à jour

---

## Module 25 — Auth `/auth`

- [ ] La page charge sans erreur
- [ ] Saisir un email valide → bouton "Recevoir un lien magique" disponible
- [ ] Soumettre → message de confirmation "Vérifiez votre boîte mail"
- [ ] Magic link généré via terminal (`node scripts/magic-link.js <email>`) → connexion réussie
- [ ] Après connexion, redirection vers `/dashboard` (ambassadeur) ou `/admin/stats` (admin)
- [ ] Bouton "Se déconnecter" dans l'admin sidebar → déconnecte et redirige vers `/auth`

---

## Module 26 — Pages publiques diverses

### `/faq`

- [ ] La page charge sans erreur JS

### `/contact-equipe`

- [ ] La page charge sans erreur JS
- [ ] Formulaire de contact disponible
- [ ] Soumettre → confirmation

### `/temoignages/[live_id]` ou `/lives/[id]/temoignages`

- [ ] La page charge et affiche les témoignages du live correspondant

### `/not-found` (404)

- [ ] Une URL inexistante (ex: `/blabla`) → page 404 s'affiche

---

## Module 27 — Pages preview (noindex)

> Ces pages ne doivent pas être indexées par Google.

- [ ] `/preview/homepage-poster` charge sans erreur
- [ ] `/preview/homepage-annuaire` charge sans erreur
- [ ] `/preview/homepage-storytelling` charge sans erreur
- [ ] Chaque page preview a une meta `robots: noindex`

---

## Module 28 — APIs : sécurité

### Honeypot

- [ ] `POST /api/temoignages` avec `website` rempli → 200 silencieux (pas de vrai enregistrement)
- [ ] `POST /api/inscriptions` avec `website` rempli → 200 silencieux

### Rate limiting

- [ ] `POST /api/inscriptions` en rafale (10+ requêtes rapides depuis la même IP) → 429

### Tokens invalides

- [ ] `GET /accueil-invite/invalid-token` → 404 ou message d'erreur clair
- [ ] `GET /refuser/invalid-token` → 404 ou message d'erreur clair
- [ ] `GET /visitor/invalid-token` → 404 ou message d'erreur clair

---

## Module 29 — Tests automatisés existants

```bash
# Tests unitaires (vitest) — 141 tests
npm run test

# Tests E2E (playwright — nécessite npm run dev)
npm run test:e2e
```

### Résultats attendus

- [ ] `npm run test` → 141 tests passants, 0 échec
- [ ] `npm run test:e2e` → 4 specs passantes :
  - [ ] `e2e/admin-new-pages-auth.spec.ts` — protection auth admin
  - [ ] `e2e/regression.spec.ts` — statut v2, JS errors, dashboard redirect
  - [ ] `e2e/security-headers.spec.ts` — honeypot, meta noindex
  - [ ] `e2e/new-pages-availability.spec.ts` — /faq, /contact-equipe, tokens invalides

---

## Module 30 — Cycle de statut ambassadeur (admin)

> Tester depuis `/admin/ambassadeurs`

| Transition | Action | Résultat attendu |
|---|---|---|
| `pending_review → pre_approved` | Pré-approuver Sophie | Statut `pre_approved`, email envoyé |
| `pre_approved → validated` | Valider (après onboarding) | Statut `validated` |
| `validated → suspended` | Suspendre Marie | Statut `suspended`, pin disparaît de la carte |
| `suspended → validated` | Réactiver Marie | Statut `validated`, pin réapparaît |
| `pending_review → rejected` | Rejeter Sophie | Statut `rejected` |

---

## Récapitulatif — Matrice états × fonctionnalités clés

| Fonctionnalité | `past` ⏪ | `upcoming` 📅 | `soon` ⏱ | `live` 🔴 |
|---|:---:|:---:|:---:|:---:|
| EventBanner — texte | "Dernier live il y a..." | "Prochain live le..." | Countdown | "Live en cours" |
| EventBanner — couleur | blanc | blanc | indigo | rouge/indigo |
| Carte — pins visibles | ✓ | ✓ | ✓ | ✓ |
| Carte — pins actifs (is_active) | ✗ | partiel (3/7) | partiel | ✓ (7/7) |
| Dashboard — section Signaux | ✗ | ✗ | ✗ | ✓ |
| Dashboard — formulaire témoignage | ✓ | ✓ | ✓ | ✓ |
| `/admin/live` — feed actif | ✗ | ✗ | ✗ | ✓ |
| Formulaire contact ambassade | ✓ | ✓ | ✓ | ✓ |

---

## Journal d'avancement

| Date | Module | Résultat | Observations |
|------|--------|----------|--------------|
|      |        |          |              |

---

*Généré le 2026-05-01 — DavidTheryApp v1 — branch `develop`*
*États gérés par `scripts/demo-state.js`*
