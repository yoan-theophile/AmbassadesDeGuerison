# Démo David Théry — 45 minutes
## Ambassades de Guérison — v0.1.4.0

> **Setup avant que David arrive :**
> 1. `supabase db query --linked --file scripts/reset-db.sql && node scripts/seed.js`
> 2. `npm run dev` → `localhost:3000`
> 3. DevOverlay → clic **`📅 Upcoming`** (carte propre, prochain live visible)
> 4. Magic link admin prêt : `node scripts/magic-link.js david.thery@demo.fr`

---

## Structure — minutage

| Bloc | Contenu | Durée |
|------|---------|-------|
| 0 | Discussion amont — valider la compréhension | 5 min |
| 1 | La carte publique — les 3 états clés | 10 min |
| 2 | Parcours visiteur | 8 min |
| 3 | Côté admin | 12 min |
| 4 | Questions à débattre | 10 min |

---

## Bloc 0 — Discussion amont (5 min)

*Avant de montrer quoi que ce soit, dire à David :*

> « Voici ce que j'ai compris : vous faites des lives de guérison depuis La Réunion.
> Des milliers de personnes regardent, mais seules. L'idée : des gens de confiance ouvrent
> leur maison ou leur église le soir du live pour que d'autres viennent les rejoindre.
> Votre message arrive via YouTube, mais ils prient ensemble physiquement.
>
> Votre rôle dans l'app : créer les lives, envoyer une campagne email pour activer
> vos ambassadeurs, voir les signaux en direct pendant le live, modérer les témoignages
> après. »

**Valider avec lui :**

- Est-ce que cette description est juste ?
- Y a-t-il une fonctionnalité qu'il veut voir en priorité ?
- Est-ce que son assistante sera présente ou a-t-elle besoin d'une session séparée ?

---

## Bloc 1 — La carte publique (10 min)

### 1a — Ce que voit un visiteur entre deux lives (état Upcoming)

La DB est déjà en état `upcoming`. Ouvrir `localhost:3000`.

Ce que David doit voir :
- Carte vide (aucune épingle)
- Overlay centré : **"PROCHAIN LIVE [date] / Les ambassades s'afficheront dès qu'elles confirmeront..."**
- Stats communauté : *"7 ambassadeurs · 6 pays"*
- Lien *"Voir les témoignages →"*
- Bandeau EventBanner : *"Prochain live le [date] à [heure]"*

*À dire :*
> « Entre deux lives, un visiteur qui arrive voit ça. Il sait quand est le prochain live,
> combien d'ambassades existent déjà, et peut lire les témoignages. La carte n'affiche
> aucune épingle pour ne pas créer de demandes hors fenêtre live. »

### 1b — Pendant le live (état Live)

DevOverlay → clic **`🔴 Live`**.

Ce que David doit voir :
- **7 épingles apparaissent** sur la carte (Paris, Lyon, Bruxelles, Montréal, Genève, Abidjan, Dakar)
- Bandeau : *"Live en cours — rejoignez-nous"* (indigo, icône pulsante)

*À dire :*
> « Dès que vous démarrez un live, les épingles apparaissent. Les visiteurs peuvent
> trouver une ambassade près de chez eux et envoyer une demande de contact. »

Montrer :
- Barre de recherche → taper "Dakar" → la carte vole vers Dakar
- Cliquer sur l'épingle de **Kofi (Abidjan)** → *"120 places — Lieu de prière"*
- Cliquer sur **Jean-Pierre (Lyon)** → badge *"Complet"* (80/80)
- Cliquer sur **Marie (Paris)** → *"15 places"* → bouton *"Contacter →"*

### 1c — Live en cours, aucune ambassade confirmée (état Live-Zero)

DevOverlay → clic **`🔴 Live (0 confirm.)`**.

Ce que David doit voir :
- Carte vide (campagne non encore envoyée)
- Overlay : *"Live en cours / Les ambassades confirment leur participation..."*
- Si `live_link` renseigné : bouton *"Regarder le live →"*

*À dire :*
> « Si vous démarrez le live avant d'avoir envoyé la campagne email, les visiteurs
> voient cet écran. C'est honnête — les ambassades n'ont pas encore confirmé.
> Le lien vers le live YouTube est quand même accessible. »

---

## Bloc 2 — Parcours visiteur (8 min)

### 2a — Demander à rejoindre une ambassade

DevOverlay → revenir en **`🔴 Live`**.

1. Cliquer sur **Marie (Paris)** → *"Contacter →"*
2. Page `/ambassade/{id}` : prénom, ville, consignes d'accueil
3. Remplir le formulaire : Prénom *Thomas*, Email *thomas@test.fr*, Message *"Je viendrai avec mon épouse."*
4. Envoyer → *"Votre demande a été envoyée à Marie."*

*À dire :*
> « L'adresse de Marie n'est jamais visible sur le site. Elle arrive dans l'email
> de Thomas uniquement si Marie accepte explicitement. »

### 2b — Formulaire d'inscription (nouvelle ambassade)

1. DevOverlay → **`📅 Upcoming`** (retour à carte vide)
2. L'overlay affiche le bouton *"Devenir ambassadeur"* n'apparaît que dans l'état "aucun live prévu" — expliquer : les autres états ont un CTA différent (témoignages, pas inscription)
3. Ou : ouvrir directement `localhost:3000/inscription`
4. Étape 1 : taper "Toul" → suggestion Nominatim → sélectionner "Toulouse, France" → pays se remplit automatiquement
5. Étape 2 : Domicile, 12 places, adresse
6. Étape 3 : récapitulatif → Envoyer

*À dire :*
> « Le bouton "Continuer" reste bloqué tant qu'une ville n'est pas sélectionnée
> dans la liste. Pas de coordonnées = pas d'épingle sur la carte. »

---

## Bloc 3 — Côté admin (12 min)

Connexion : magic link `david.thery@demo.fr` (DevOverlay > Magic Link, ou terminal).

### 3a — Stats (2 min)

`/admin/stats` — KPIs : 7 ambassades actives, 6 pays, 10 demandes, 12 témoignages.

### 3b — Pipeline candidat (3 min)

`/admin/ambassadeurs` — **Sophie Leroux (Bordeaux)** est en `En examen`.

1. Cliquer *"Pré-approuver"* → statut passe à `pre_approved`
2. *À dire :* Sophie reçoit un email avec un lien questionnaire + vidéo à regarder. Elle revient une fois son questionnaire rempli. Puis validation finale → elle apparaît dans tous les lives futurs, mais ne s'active que via la campagne email.

### 3c — Campagne email (3 min)

`/admin/calendrier` — Programmer une campagne pour le live J+10 :

1. Sélectionner le live *"La puissance de l'Amour"*
2. Type : Ambassadeurs
3. Date d'envoi : J-7 à 10h00
4. Planifier

*À dire :*
> « À J-7, chaque ambassadeur validé reçoit un email avec un lien personnalisé.
> Ceux qui cliquent s'activent pour ce live et apparaissent sur la carte.
> Ceux qui ne cliquent pas ne figurent pas — David voit exactement qui sera là. »

### 3d — Feed live (4 min)

DevOverlay → **`🔴 Live`**. Ouvrir `/admin/live`.

Deux colonnes :
- **Mains levées** : Aminata (Dakar) en `pending` → cliquer *"Approuver"* → signal passe en approuvé
- **Témoignages** : compteur — cliquer → redirige vers `/admin/temoignages` pré-filtré

Montrer aussi le bouton **"Clôturer le live"** (coin haut droit) → confirmer → tous les pins disparaissent de la carte publique immédiatement.

*À dire :*
> « Cette page reste ouverte sur un 2e écran pendant le live. Vous voyez en temps
> réel les ambassadeurs qui veulent partager quelque chose à l'antenne. En fin de live,
> un clic sur "Clôturer" remet tous les pins à zéro — les visiteurs ne peuvent plus
> envoyer de demandes. »

---

## Bloc 4 — Questions à débattre (10 min)

Ces questions sont importantes. Certaines ont une réponse dans le code, d'autres ouvrent une décision produit.

---

### Q1 — La clôture manuelle suffit-elle, ou faut-il une clôture automatique ?

**Situation actuelle :** le bouton "Clôturer le live" existe dans `/admin/live` (option A implémentée). Un clic remet `is_active = false` sur tous les hôtes de l'event. La clôture automatique n'existe pas encore.

**Question :** Est-ce que David (ou son assistante) clôturera manuellement à chaque live, ou préfère-t-il une sécurité automatique en cas d'oubli ?

**Enjeu :** si personne ne clique "Clôturer" après le live, les épingles restent visibles le lendemain matin. Des visiteurs pourraient envoyer des demandes hors fenêtre live.

**Options à lui proposer :**
- A) Manuel uniquement — le bouton dans `/admin/live` suffit ✅ déjà livré
- B) Clôture automatique : X heures après `event_date` (ex : +6h), un cron remet tout à zéro
- C) Les deux : automatique + bouton manuel si live raccourci

---

### Q2 — Est-ce que l'assistante de David utilise l'admin ?

**Situation actuelle :** un seul niveau d'admin (rôle `admin`). Pas de granularité.

**Question :** Est-ce que David gère l'admin seul, ou son assistante fait-elle la modération des témoignages, le suivi des candidats ?

**Enjeu :** si l'assistante est utilisatrice, elle a besoin d'une session de formation séparée. Elle doit comprendre le pipeline, le feed live, la modération.

**Action si oui :** prévoir une session 30 min dédiée à l'assistante. Pas de changement technique nécessaire — elle utilise le même compte admin.

---

### Q3 — Est-ce que les ambassadeurs ont besoin de se désactiver eux-mêmes ?

**Situation actuelle :** un ambassadeur s'active via le lien dans l'email de campagne. Il ne peut pas se désactiver lui-même depuis son dashboard.

**Question :** Que se passe-t-il si un ambassadeur a dit "oui" via la campagne, mais ne peut finalement pas accueillir le soir du live ?

**Enjeu :** les visiteurs en attente (demandes `pending`) attendent une réponse. Si l'ambassadeur disparaît de la carte sans prévenir, le visiteur est laissé sans nouvelles.

**Options :**
- A) Bouton "Je ne serai pas disponible" dans le dashboard → remet `is_active = false` pour cet event
- B) Pas de désactivation self-service — David gère manuellement via l'admin si signalement
- C) Désactivation auto si l'ambassadeur n'a pas répondu à ses demandes après 48h

---

### Q4 — Feedback structuré post-live (ambassadeurs et visiteurs)

**Situation actuelle :** il existe une route `/feedback/[token]` avec 4 étoiles (accueil, chaleur, écoute, prière) + texte libre + "Signaler un problème". Mais cette route n'est pas encore déclenchée automatiquement — aucun email de feedback n'est envoyé après un live.

**Question :** Est-ce que David veut collecter des retours structurés post-live ?

**Enjeu :** les témoignages existent pour les guérisons. Mais un feedback d'expérience (l'accueil était-il chaleureux ? l'ambassadeur était-il disponible ?) est différent. C'est de la donnée qualité pour améliorer le réseau.

**Options :**
- A) Rien de plus — les témoignages suffisent
- B) Email de feedback automatique 24h après le live → `/feedback/{token}` — données visibles dans un futur `/admin/qualite`
- C) Intégrer dans le dashboard ambassadeur (pas d'email — s'il se connecte, il voit un formulaire)

---

### Q5 — Mobile : est-ce que ça tourne bien sur téléphone ?

**Situation actuelle :** la carte et les formulaires sont responsive, mais non testés sur un vrai téléphone.

**Question :** Est-ce que David va présenter l'app depuis son téléphone ? Est-ce que ses ambassadeurs (en Afrique, majorité mobile) vont s'inscrire depuis leur téléphone ?

**Enjeu :** si oui, il faut un test mobile avant la démo publique. La carte Leaflet et le formulaire d'inscription sont les deux zones à risque.

**Action si oui :** ouvrir `localhost:3000` depuis le téléphone (même réseau Wi-Fi) avant la fin de cette session.

---

### Q6 — Domaine personnalisé

**Situation actuelle :** l'app tourne sur `https://davidthery-app.vercel.app`.

**Question :** Est-ce que David a un domaine pour cette app ? `ambassades.davidthery.fr` ? `ambassades-guerison.com` ?

**Enjeu :** les liens dans les emails de campagne contiennent l'URL de l'app. Si on change le domaine après le premier envoi, les anciens liens deviennent invalides.

**Action :** décider du domaine avant le premier live réel. Le configurer dans Vercel + mettre à jour `NEXT_PUBLIC_APP_URL`.

---

### Q7 — La fenêtre "live en cours" est-elle de la bonne durée ?

**Situation actuelle :** la variable `NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS` est à **4 heures**. Cela signifie que la carte affiche les pins pendant 4h après l'heure de début du live.

**Question :** Combien de temps dure en général un live de David ? 2h ? 3h ? Plus ?

**Enjeu :** si le live dure 5h et que la fenêtre est à 4h, les pins disparaissent avant la fin du live. Si la fenêtre est trop large, les pins restent visibles jusqu'au lendemain.

**Action :** ajuster `NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS` dans les variables Vercel selon la réponse.

---

## Après la démo — notes

**Ce que tu cherches comme signal :**
- David valide les overlays contextuels (les 5 états font sens pour lui)
- David a une réponse sur la clôture du live (Q1 — critique pour la prod)
- David confirme ou infirme le besoin de feedback structuré (Q4)

**Ce qui déclenche la suite :**
Une fois les retours intégrés dans un commit sur `develop` et aucune incertitude restante sur les overlays ou le flux inscription → ouvrir `test/e2e-fonctionnels` (smoke homepage + flux inscription + unit tests EmptyMapContent).

---

## Reset entre deux passes

```bash
node scripts/seed.js
```

Puis DevOverlay → **`📅 Upcoming`** pour repartir propre.

---

*Mis à jour 2026-05-03 — v0.1.4.0 (Q1 mise à jour : bouton "Clôturer le live" livré dans /admin/live ; section 3d complétée)*
