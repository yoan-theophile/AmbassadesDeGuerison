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
- [ ] Session sans `host_profile` → redirige vers `/inscription`
- [ ] Session avec profil `pending_review` → affiche état "en attente de validation" (pas d'encart questionnaire)
- [ ] Session avec profil `pre_approved` → encart indigo "Félicitations, tu as été pré-approuvé !" + bouton "Compléter mon profil →" vers `/dashboard/questionnaire`
- [ ] Session avec profil `enrichment_pending` → encart violet "Ton dossier est en cours d'examen"
- [ ] Session avec profil `validated` → dashboard complet s'affiche (sans encart statut)

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

### Activation de l'ambassade (is_active)

- [ ] Section "Mon ambassade" visible avec le toggle d'activation (`is_active`)
- [ ] Toggler `is_active` → appel `PATCH /api/host-activations/[id]` → RLS vérifie que l'user est bien l'hôte (403 si autre user)
- [ ] `is_full` n'est PAS modifiable via l'UI (badge statique si l'ambassade est pleine)

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

## Module 6 — Accueil invité `/accueillir/[token]`

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

- [ ] Champs obligatoires : prénom, email, ville, pays
- [ ] Champ **téléphone** (optionnel) visible après l'email — label "Téléphone (optionnel)", type tel, maxLength 20, note de confidentialité sous le champ
- [ ] `CityInput` : saisir "Paris" → dropdown Nominatim apparaît → sélectionner "Paris, Île-de-France" → coordonnées lat/lng renseignées
- [ ] Sans sélection dans le dropdown → hint ambre "Sélectionnez une ville dans la liste"
- [ ] Bouton "Continuer" désactivé si `lat` est absent
- [ ] Sélectionner une ville étrangère (ex: "Yaoundé") → pays bascule automatiquement sur "Cameroun"
- [ ] `CountrySelect` : pays épinglés (FR, BE, CH, CA, LU, MA, SN, CI, CM) visibles en premier
- [ ] Soumettre avec un téléphone → `host_profiles.phone` sauvegardé en DB

### Étape 2 — Type d'ambassade

- [ ] Choisir "Individu" vs "Église" → champs adaptés (dénomination pour église)
- [ ] Champs consignes, setup vidéo
- [ ] Bouton "Créer mon profil" → soumission

### Soumission

- [ ] Succès → profil créé avec statut `pending_review` → message inline "Demande envoyée !" (plus de redirect vers `/onboarding`)
- [ ] Email déjà existant → message d'erreur "Email déjà utilisé"
- [ ] Honeypot rempli → 200 silencieux

---

## Module 9 — Onboarding `/onboarding` *(flux legacy — non utilisé dans le pipeline actuel)*

> ⚠️ Le flux principal est désormais admin-driven (`pending_review → pre_approved → questionnaire → enrichment_pending → validated`). La page `/onboarding` reste accessible mais n'est plus le chemin critique. Le statut `pending_onboarding` n'existe pas en DB.

- [ ] La page `/onboarding` charge sans erreur 500
- [ ] Un profil `validated` accédant à `/onboarding` est redirigé vers `/dashboard`

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
- [ ] Colonne statut : badges `Validé`, `En examen`, `Pré-approuvé`, `Questionnaire`, `Suspendu`, `Refusé`
- [ ] Filtre "Questionnaire" visible dans la barre de filtres (en plus des autres)
- [ ] Champ de recherche : saisir "Marie" → seule Marie apparaît
- [ ] Filtre par statut : "validated" → seuls les 7 validés
- [ ] Filtre par statut : "pending_review" → seulement Sophie
- [ ] Pagination fonctionnelle si > 20 ambassadeurs

### Chevron expand/collapse

- [ ] Chaque ligne a un chevron (▾/▴) en première colonne
- [ ] Cliquer le chevron d'un ambassadeur `validated` → panneau "Questionnaire ambassadeur" s'ouvre
- [ ] Si questionnaire non rempli → message "Questionnaire non encore rempli"
- [ ] Si questionnaire rempli → champs affichés : téléphone, fréquentation église, dénomination, Défi Guérison (Oui/Non), Conférence DT (Oui/Non), parcours spirituel, livres/formations

### Actions par statut

- [ ] Sophie (`pending_review`) → boutons "Pré-approuver" + "Refuser"
- [ ] Sophie (`pre_approved`) → bouton "Valider (bypass)" + "Refuser" (**pas** de bouton "Valider" standard)
- [ ] Sophie (`enrichment_pending`) → boutons "Valider" + "Refuser" + CTA "Valider le questionnaire" dans le panneau détail
- [ ] Marie (`validated`) → bouton "Suspendre"
- [ ] Marie (`suspended`) → bouton "Réactiver"
- [ ] Cliquer "Valider (bypass)" depuis `pre_approved` → statut `validated`, log `bypass_enrichment` créé dans `moderation_log`
- [ ] Cliquer "Valider" depuis `enrichment_pending` → statut `validated`

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
- [ ] Section "Campagnes planifiées" visible avec form de création
- [ ] Form création : champs — live (select), type (Ambassadeurs / Visiteurs), date d'envoi, message optionnel
- [ ] Créer une campagne `type=ambassadeurs` → `POST /api/admin/campaigns` → snapshot de TOUS les `host_profiles` à `status=validated` dans `campaign_recipients`
- [ ] Si l'INSERT des destinataires échoue → la campagne est rollbackée (pas de campagne orpheline)
- [ ] La campagne créée apparaît dans la liste avec son statut `pending` et le nombre de destinataires

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

- [ ] `GET /accueillir/invalid-token` → 404 ou message d'erreur clair
- [ ] `GET /refuser/invalid-token` → 404 ou message d'erreur clair
- [ ] `GET /visitor/invalid-token` → 404 ou message d'erreur clair
- [ ] `GET /unsubscribe/invalid-token` → 200 avec message générique (pas d'info leak)
- [ ] `POST /api/campaign-activations` avec token inexistant → 404 JSON

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

> Tester depuis `/admin/ambassadeurs`. Utiliser Sophie (`pending_review`) et Marie (`validated`).

| Transition | Action admin | Résultat attendu |
|---|---|---|
| `pending_review → pre_approved` | Bouton "Pré-approuver" | Statut `pre_approved`, email avec CTA questionnaire envoyé |
| `pre_approved → enrichment_pending` | Sophie ouvre `/dashboard/questionnaire` et soumet | Statut `enrichment_pending`, notif admin reçue |
| `enrichment_pending → validated` | Bouton "Valider" (standard) | Statut `validated`, email bienvenue envoyé |
| `pre_approved → validated` (bypass) | Bouton "Valider (bypass)" | Statut `validated`, log `bypass_enrichment` dans `moderation_log` |
| `validated → suspended` | Bouton "Suspendre" | Statut `suspended`, pin disparaît de la carte |
| `suspended → validated` | Bouton "Réactiver" | Statut `validated`, pin réapparaît |
| `pending_review → rejected` | Bouton "Refuser" | Statut `rejected` |
| ~~`pre_approved → validated` (API directe)~~ | POST action=`validated` sur un `pre_approved` | **400 JSON** — "Le candidat doit d'abord remplir le questionnaire" |

---

## Module 31 — Questionnaire ambassadeur `/dashboard/questionnaire`

> Se connecter avec un compte `pre_approved` (passer Sophie à `pre_approved` via admin).

- [ ] Un profil `pending_review` accédant à `/dashboard/questionnaire` → message "Ce questionnaire n'est accessible que pour les candidats pré-approuvés" + lien retour
- [ ] Un profil `validated` accédant → même message de blocage
- [ ] Un profil `pre_approved` → le formulaire s'affiche complet
- [ ] Champs présents : case "J'ai suivi le Défi Guérison", case "J'ai déjà assisté à une conférence de David Théry", select fréquentation église (3 options), champ dénomination (optionnel), textarea parcours spirituel (max 500 chars), textarea livres (max 300 chars), champ téléphone (optionnel)
- [ ] Compteur caractères visible sous le textarea parcours (ex : "42/500")
- [ ] Soumettre → `PATCH /api/ambassadeur/enrichissement` → statut passe à `enrichment_pending`
- [ ] Après soumission → écran de confirmation "Profil envoyé !" + lien retour dashboard
- [ ] Soumettre 2 fois → 403 (statut déjà `enrichment_pending`, plus `pre_approved`)
- [ ] Champs enregistrés en DB : vérifier dans `/admin/ambassadeurs` → panneau détail

---

## Module 32 — Activation campagne email `/accueillir/activer/[token]`

> Prérequis : créer une campagne `type=ambassadeurs` dans `/admin/calendrier`, puis déclencher le cron `POST /api/cron/dispatch-campaigns` manuellement (ou inspecter les `campaign_recipients` pour récupérer un `activation_token`).

- [ ] Token valide non encore activé → page affiche titre du live, date, et bouton "Je m'inscris comme ambassadeur"
- [ ] Cliquer "Je m'inscris" → `POST /api/campaign-activations` → `host_activations.is_active = true`
- [ ] Page reste sur place après le clic (pas de redirect) → confirmation visuelle inline
- [ ] Recharger la page avec le même token → état "Vous êtes déjà inscrit comme ambassadeur pour ce live"
- [ ] Token invalide → message d'erreur "Lien invalide ou expiré"
- [ ] L'activation est **sans auth** (l'ambassadeur clique depuis son email)

---

## Module 33 — Désabonnement visiteur `/unsubscribe/[token]`

> Prérequis : récupérer un `unsubscribe_token` depuis `campaign_recipients` (table DB).

- [ ] Token valide → page affiche message de confirmation sobre (désabonné avec succès)
- [ ] Lien retour vers `/` présent
- [ ] Token invalide → 200 avec message générique (pas d'info leak sur l'existence du token)
- [ ] Après désabonnement : `campaign_recipients.status = 'unsubscribed'` en DB
- [ ] Idempotent : réutiliser le même token → 200 sans erreur

---

## Module 34 — Cron dispatch campagnes `/api/cron/dispatch-campaigns`

> Tester avec `curl -X POST http://localhost:3000/api/cron/dispatch-campaigns -H "X-Cron-Secret: [secret]"` ou via GH Actions.

- [ ] Sans header `X-Cron-Secret` → 401
- [ ] Secret invalide → 401
- [ ] Aucune campagne pending → 200 JSON `{ dispatched: 0 }`
- [ ] Campagne pending avec destinataires → emails envoyés, `campaign_recipients.status = 'sent'`, `sent_at` renseigné
- [ ] Si un envoi échoue → `attempts++`, statut reste `pending` (pas `sent`). Après 3 échecs : `status = 'failed'`
- [ ] Pagination cursor (pas OFFSET) : tester avec > 100 destinataires si possible

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
| 2026-05-01 | M1 — Accueil / 4 états | ✅ 14/14 | live/upcoming/soon/past OK. Search Nominatim→flyTo OK. Zoom bottomleft OK. No overlap search/banner. |
| 2026-05-01 | M13 — Auth admin (spot) | ✅ | /admin/stats → /auth. /admin/moderation → /auth (middleware avant redirect page). |
| 2026-05-01 | M29 — Tests auto | ✅ 141/141 | vitest 17 fichiers, 0 échec. |
| 2026-05-01 | M4 — Dashboard ambassadeur | ✅ partiel | Guard session OK. Signal live envoyé OK. Témoignage soumis OK (après fix timing). "Mes demandes" vides (seed contact_requests lié à un event différent — non-bloquant). |
| 2026-05-01 | M2 — Page ambassade publique | ✅ | Form chargée. Soumission Thomas→confirmation + lien invite f47b4e8a. 3 bugs trouvés et corrigés (champs API, filtre event, demo-state registration_dates). |
| 2026-05-01 | M14 — Admin stats | ✅ corrigé | KPIs chargés. Bug : "0 Pays représentés" → query filtrait status='active' au lieu de 'validated'. Corrigé dans stats/page.tsx + badge/route.tsx + NouveauTemoignageForm.tsx. Après fix : 6 pays affichés. |
| 2026-05-01 | M15 — Admin ambassadeurs | ✅ corrigé | Search, filtres statut, pagination OK. Bug : recherche affichait "1 ambassadeur" en compteur mais listait encore les 8 → useState(initial) ne se réinitialise pas lors de navigation Next.js. Fix : remplacé state de liste par statusOverrides uniquement. Suspend/Réactiver OK. |
| 2026-05-01 | M16 — Admin live | ✅ | Feed signaux (Mains levées) : 2 signaux pending, Approuver retire la carte instantanément. Onglet Témoignages : "3 témoignages reçus — À modérer après le live". |
| 2026-05-01 | M17 — Admin calendrier | ✅ | 1 à venir + 3 passés affichés. Onglets À venir/Passés OK. Modifier inline (pré-rempli). Nouveau live (form vide). Campagnes planifiées section présente. |
| 2026-05-01 | M18 — Admin témoignages | ✅ | 16/12 publiés. Publication individuelle (icône œil) : 4→3 non publiés, 12→13 publiés. Tout publier (3) : 0 non publiés, 16/16 publiés. |
| 2026-05-01 | M19 — Admin paramètres | ✅ | Formulaire URL vidéo + PDF. Enregistrer : feedback dans le bouton (texte "Enregistré !" 3s). Pas d'erreur API. |
| 2026-05-01 | Admin Signalements | ✅ | 1 signalement en attente (thomas.b@mail.com → Fatou Bruxelles). Actions Prendre en charge / Résoudre / Classer présentes. |
| 2026-05-01 | Admin Blocages | ✅ | 0 entrée, form de blocage (email, téléphone, motif) fonctionnel. |
| 2026-05-01 | Admin Équipe | ✅ | Aucun membre, form ajout (email + rôle Admin). |
| 2026-05-01 | M22 — Admin calendrier | ✅ | 1 à venir + 3 passés. Section campagnes planifiées avec form (live, type Ambassadeurs/Visiteurs, date, message). |
| 2026-05-01 | M24 — Admin settings timing | ✅ | 6 champs numériques (J avant/après). API PATCH 200. Feedback "Sauvegardé" 3s dans bouton (code OK, timing difficile à capturer via JS). |
| 2026-05-01 | M25 — Auth `/auth` | ✅ | Formulaire magic link. Soumission email inconnu → "Vérifiez votre messagerie" (anti-énumération, comportement normal). |
| 2026-05-01 | M26 — Pages publiques | ✅ | /faq (12 Q&A) OK. /contact-equipe → formulaire + "Message envoyé" OK. /page-inexistante → 404 "Page introuvable" + CTA. |
| 2026-05-01 | M27 — Pages preview | ✅ | /preview/homepage-poster, /annuaire, /storytelling → 200 + meta noindex, nofollow confirmé. |
| 2026-05-01 | M3 — Flux visiteur `/live/[event_id]/ambassade/[host_id]` | ✅ corrigé | Page charge avec infos ambassade + formulaire. Bug critique : VisitRequestForm envoyait `visitor_first_name/email/...` mais l'API attend `first_name/email/consent`. Fix : renommage des clés JSON. Après fix : 201 + action_token. |
| 2026-05-01 | M5 — Page visiteur `/visitor/[token]` | ✅ | État "en attente" : event, ambassade, "Marie a reçu votre demande", "Sous 24h". Token invalide → "Page introuvable". |
| 2026-05-01 | M6 — Page hôte `/accueillir/[token]` | ✅ | Note : route est `/accueillir/[token]` (pas `/accueil-invite/`). Infos visiteur (Lucas, 2 personnes, message), boutons "J'accueille" / "Je ne peux pas" visibles. |
| 2026-05-01 | M10 — Témoignages publics `/temoignages` | ✅ | 16 témoignages • 10 villes. Filtre par live (combobox custom) → 9 témoignages "Nuit de Prière". "Filtré sur", "Effacer ×", "Lire la suite", WhatsApp/Copier link OK. |
| 2026-05-01 | M11 — Formulaire témoignage | ✅ | Bouton désactivé < 20 chars. Compteur 96/2000. Soumission → "Merci pour ton témoignage" screen OK. Pré-sélection live, prénom + ville optionnels OK. |
| 2026-05-01 | M8 — Inscription `/inscription` | ✅ corrigé | 3 étapes OK. Autocomplétion Nominatim + auto-pays OK. Bouton "Continuer" bloqué sans sélection dropdown. Bug critique : API insérait `status='pending_onboarding'` → violation contrainte check. Fix : status → `'pending_review'`. Redirect post-soumission → écran "Demande envoyée" (remplace ancien `/onboarding`). Ambassadeur Lucie visible dans admin `pending_review`. |
| 2026-05-01 | M9 — Onboarding | ⚠️ obsolète | Flux `pending_onboarding → /onboarding → active` remplacé par review admin. `/api/onboarding/complete` référence encore ces statuts (dead code). Sophie seed a déjà `pending_review`. Page `/onboarding` non reliée au nouveau flux. |
| 2026-05-01 | M7 — Flux visiteur refus | ✅ | Bénédicte refusée via `/accueillir/[token]` (bouton "Je ne peux pas"). Page `/visitor/[token]` passe en état "Demande non retenue" avec bandeau "Pas de place cette fois". |
| 2026-05-01 | M12 — Page visiteur états | ✅ | Avant refus : état "en attente". Après refus : "Demande non retenue". Token invalide → "Page introuvable" + CTA "Retour à la carte". |
| 2026-05-01 | M28 — Sécurité API | ✅ | Honeypot `website` → 200 {} sans insertion DB. Token invalide `/accueillir/xyz` → 404 page custom. Validation contenu < 20 chars → 400 + message d'erreur. |
| 2026-05-01 | Cohérence statuts | ✅ fix | 5 fichiers corrigés : `status='active'` → `'validated'` (stats/page, badge/route, NouveauTemoignageForm) ; `status='pending_onboarding'` → `'pending_review'` (api/inscriptions). Dashboard : redirect `pending_onboarding → /onboarding` supprimée (statut inexistant en DB). `onboarding/page.tsx` : vérif `'active'` → `'validated'`. `api/onboarding/complete` : `pending_onboarding/active` → `pending_review/validated`. CLAUDE.md mis à jour (table seed + section pipeline). QA_SCENARIOS : `/accueil-invite/` → `/accueillir/` corrigé. |

---

| 2026-05-01 | Flow E2E visiteur (M5+M6) | ✅ | Testé avec Pierre/token `f2febdf1`. **Avant acceptation** : `/visitor/[token]` affiche 3 étapes — ① "Demande envoyée" ② "Marie répond — sous 24h" (en attente) ③ "Adresse à venir — transmise par e-mail" (grisée). **Page ambassadeur** `/accueillir/[token]` : pas d'auth requise, affiche nom visiteur + nb personnes + message. Clic "J'accueille" → confirmation "Demande acceptée ! Pierre recevra vos coordonnées par e-mail." **Après acceptation** : `/visitor/[token]` rafraîchi → étape ② "Demande acceptée !", étape ③ "Vous recevrez les coordonnées de Marie par e-mail." Adresse jamais affichée en clair (envoyée par email via `sendAcceptationVisite`). UX note : étape ③ titre reste "Adresse à venir" même après acceptation — pourrait dire "Adresse envoyée" (faible prio). |
| 2026-05-01 | Flow E2E admin pré-validation + carte (M8+M30) | ✅ avec précision | Inscription Alice/Strasbourg : 3 étapes OK, geocoding Nominatim → lat/lng correct, confirmation inline "Demande envoyée" (plus de redirect /onboarding). DB : `status=pending_review`, lat=48.58, lng=7.75. **Carte avant validation** : pas de pin Strasbourg ✅. **Admin pipeline** (testé live via magic link) : "En examen" → "Pré-approuver" → `pre_approved` → "Valider" → `validated`. Trigger DB `trg_auto_activate_host_on_validated` auto-crée une `host_activation` avec `is_active=false`. **Carte après validation** : toujours pas de pin — attendu, car la carte (`/api/host-activations`) affiche uniquement les `host_activations.is_active=true` pour l'événement le plus récent. L'admin doit activer séparément l'ambassadeur pour un événement (step manquant dans l'UI de test). **Note architecture** : la carte ne gate PAS sur `status=validated` mais sur `host_activations.is_active=true` pour l'event courant. |
| 2026-05-01 | Bug route morte PATCH /api/admin/ambassadeurs/[id] | ⚠️ dead code | Ce route.ts accepte `status: 'active'` mais `'active'` viole la contrainte CHECK DB. La route `/status` (POST) remplace tout ce flow depuis le refactor. Route ancienne non appelée par l'UI actuelle. Pas bloquant mais risque si quelqu'un l'appelle directement. |

---

*Généré le 2026-05-01 — DavidTheryApp v1 — branch `develop`*
*États gérés par `scripts/demo-state.js`*
