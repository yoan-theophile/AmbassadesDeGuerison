# TODOS.md — Ambassades de Guérison

Généré le 2026-04-19. Items différés ou à planifier après le premier live.

---

## TODO-1 : Rate limiting sur `/api/contact-requests/*/acknowledge` — **ARCHIVÉ**

**Statut mai 2026 :** Phase 2 livrée. La route `/accueil-invite/[token]` et le système 24h auto-révélation sont supprimés. Le flux est désormais : hôte accepte explicitement via `/accueillir/[token]` → visiteur reçoit adresse par email. Ce TODO est **archivé**.



**Quoi :** Vercel Edge Middleware — 10 req/min par IP sur cet endpoint.

**Pourquoi :** L'endpoint révèle l'adresse domicile de l'hôte après le clic "J'ai bien pris note". UUID v4 (128 bits) rend la force brute astronomiquement difficile, mais pas impossible à l'échelle d'une attaque ciblée.

**Pros :** Protection défense-en-profondeur pour des données (adresses) sensibles.

**Cons :** Peu de valeur pratique en v1 avec ~50 hôtes — l'attaque ciblée est très improbable.

**Contexte :** Même niveau de priorité que M1 (rate limit formulaire contact). Vercel Edge Middleware déjà utilisé pour le middleware Auth → s'appuie sur la même infra.

**Dépend de :** Rien. Peut être ajouté à n'importe quel moment post-lancement.

---

## TODO-2 : Privacy rurale (centroïde département)

**Quoi :** Si `population < 5 000 hab` (détecté via `place_rank` Nominatim), afficher le centroïde du département sur la carte plutôt que la ville exacte.

**Pourquoi :** Un hôte dans un village de 400 habitants avec "Saint-Machin-les-Bains" affiché est très facilement localisable, même sans `address_private`.

**Pros :** Protège la vie privée des hôtes ruraux sans les exclure.

**Cons :** Nominatim `place_rank` à investiguer. Ajoute de la complexité au geocoding pipeline (déjà p-queue 1 req/sec).

**Contexte :** Phase test v1 = villes. Ce TODO s'active si des hôtes ruraux s'inscrivent. Signal de déclenchement : 1er hôte avec population < 5000 hab qui signale un inconfort de vie privée.

**Dépend de :** `lib/geocoding/nominatim.ts` (pipeline Nominatim existant).

---

## TODO-3 : Supabase Log Drain → alerting webhook

**Quoi :** Configurer Supabase Log Drain (Dashboard → Settings → Log Drains) pour envoyer les `RAISE WARNING` des triggers vers un webhook ou un email.

**Pourquoi :** Le GitHub Actions cron quotidien (`.github/workflows/host-activations-check.yml`) détecte déjà les échecs après coup. Le Log Drain donnerait une alerte temps-réel (< 1 min après l'échec).

**Pros :** Détection immédiate. Particulièrement utile le soir de la création d'un event.

**Cons :** Disponible uniquement sur Supabase Pro (€25/mois). Configuration UI, pas de code.

**Contexte :** Le cron GitHub Actions est le filet de sécurité v1. Ce TODO s'active lors de l'upgrade Supabase Pro (planifié J-1 avant le premier live public).

**Dépend de :** Upgrade Supabase Pro.

---

## TODO-4 (DÉFÉRÉ CEO REVIEW) : Privacy rurale

Voir TODO-2 ci-dessus.

---

## TODO-5 (DÉFÉRÉ CEO REVIEW) : WhatsApp group integration v2

**Quoi :** Analytics groupe (membres actifs, messages), invitation automatique des visiteurs acceptés.

**Pourquoi :** Les hôtes africains (Côte d'Ivoire, Cameroun) animent des groupes WhatsApp actifs. L'intégration API permettrait un funnel visiteur → groupe automatique.

**Pros :** Réduirait la friction pour les visiteurs, augmenterait la rétention dans les communautés WhatsApp.

**Cons :** Twilio WhatsApp API ~€0.005/message + complexité d'intégration + validation Meta Business Account.

**Contexte :** v1 = stockage + affichage du lien uniquement. Ce TODO s'active si ≥ 10 hôtes utilisent le `whatsapp_group_url` et signalent que le processus manuel est trop lent.

---

## TODO-7 : IA — Détection des témoignages forts

**Quoi :** Appel Anthropic API (Claude Haiku) qui lit les N témoignages d'un live et retourne les 2-3 plus impactants (spécificité, émotion, authenticité). Résultat stocké en mémoire côté client ou en cache DB.

**Pourquoi :** David reçoit parfois 20+ témoignages après un live. Trouver le meilleur à la main lui prend 10 minutes. L'IA peut le faire en 3 secondes.

**Pros :** Réduit le travail de modération de David. Valeur immédiate dès le premier live avec ≥ 5 témoignages.

**Cons :** Coût par requête (~$0.001 pour Haiku). Nécessite `ANTHROPIC_API_KEY` en prod. Risque de classement inattendu dans un contexte ministériel (prompt à calibrer soigneusement).

**Contexte :** Déféré car les fonctionnalités sans-IA (stats bar + bouton partage) suffisent pour v1. À activer quand David aura son premier live avec ≥ 10 témoignages et exprimera le besoin de trouver les meilleurs plus vite. Point de départ : `components/TemoignagesAdmin.tsx` + nouvelle route `app/api/admin/temoignages/highlights/route.ts`.

**Dépend de :** `ANTHROPIC_API_KEY` en prod + décision sur le modèle (Haiku = rapide/pas cher, Sonnet = meilleure qualité).

---

## TODO-8 : IA — Génération de post WhatsApp/newsletter

**Quoi :** Bouton "Générer le résumé" dans le bandeau "Live sélectionné". L'IA lit les témoignages publiés du live et génère un texte prêt à copier-coller (style WhatsApp, voix de David).

**Pourquoi :** David copie-colle ses témoignages sur WhatsApp manuellement aujourd'hui. Un résumé généré lui économise 15-20 min par live.

**Pros :** Fort ROI pour David. Démonstration concrète de l'IA dans le workflow.

**Cons :** Prompt à valider avec David pour respecter son style et sa voix. L'output doit être relu avant d'être envoyé — introduire une étape de validation UI.

**Contexte :** Déféré pour les mêmes raisons que TODO-7. Dépend de la même infrastructure API. À designer avec David sur un exemple réel (demander les témoignages d'un live passé pour calibrer le prompt).

**Dépend de :** TODO-7 (même infra API Anthropic).

---

## TODO-10 : Retry mail Resend bounce (visiteur acceptation) — **reporté en pré-production**

**Statut :** sans objet en phase de conception (pas de vrais visiteurs). À activer quand David annonce la date du premier live public et qu'on a des mails Resend qui partent vers de vraies adresses.



**Quoi :** Job qui re-essaie 1x à H+1 quand le mail "Marie t'accueille — voici l'adresse" bounce à la livraison Resend. Si bounce persiste, notif admin pour appel manuel au visiteur (le tel est dans la demande).

**Pourquoi :** Sans retry, un visiteur accepté qui ne reçoit pas l'adresse vit un silent failure : il croit Marie l'a accepté (Étape 2/3 affichée côté frontend), mais l'adresse n'arrive jamais. Pour un mail de guérison, c'est trahir la confiance — exactement ce qu'on veut éviter.

**Pros :** Évite le silent failure, défense en profondeur, donne à l'admin une opportunité d'appeler à la main.

**Cons :** Resend a déjà son propre retry interne, on peut surveiller le webhook bounce avant d'investir.

**Contexte :** Ressort de l'eng review du pivot live-driven (2026-05-01). À évaluer après Phase 4. Si volume bounce > 1% au premier mois post-lancement, activer ce TODO.

**Dépend de :** Resend webhook bounce events configurés. (Phase 2 déjà livrée — dépendance levée.)

---

## TODO-9 : IA — Modération assistée

**Quoi :** L'IA scanne les nouveaux témoignages et signale ceux qui sont suspects (trop vagues, hors-sujet, potentiellement spam ou inventés). Badge visuel sur la carte — David valide ou ignore.

**Pourquoi :** Protège la page publique de témoignages de mauvaise qualité sans que David ait à lire chaque entrée.

**Cons :** Définir "suspect" dans un contexte charismatique est subtil — un témoignage de guérison miraculeuse ne doit pas être flaggé. Nécessite un prompt très soigné et une révision humaine obligatoire.

**Contexte :** Le moins urgent des trois TODOs IA. À activer si le volume dépasse 50+ témoignages par live.

**Dépend de :** TODO-7 (même infra). Trigger : volume ≥ 50 témoignages/live.

---

## TODO-6 (DÉFÉRÉ CEO REVIEW) : Push notifications (PWA v2)

**Quoi :** Web Push Notifications via PWA Service Worker.

**Pourquoi :** Alerter les hôtes en temps réel quand un visiteur soumet une demande (Mode C) sans email.

**Pros :** Réactivité améliorée, surtout sur mobile en Afrique (email moins consulté).

**Cons :** Complexité du Service Worker, gestion des permissions, taux d'opt-in faible sur web.

**Contexte :** Resend email suffit pour v1. Ce TODO s'active si les hôtes se plaignent de délais de notification.

---

_(TODOs 11-16 convertis en tâches #58-#71 dans TASKS.md — 2026-05-01)_

---

## TODO-17 : Vérification mobile réelle des touch targets

**Quoi :** Émuler un viewport mobile (390x844 iPhone 14) et confirmer visuellement que les nav links du header rendent à ~40px de hauteur en dessous de 640px.

**Pourquoi :** Le fix `py-2.5 sm:py-1.5` (commit `bdbc9c7`) est mathématiquement correct mais n'a été testé qu'en desktop pendant `/design-review` (le resize_window via Chrome MCP n'a pas affecté la rendition CSS effective).

**Pros :** 30 secondes de DevTools pour confirmer ce qui devrait déjà marcher.

**Cons :** Aucun. À faire avant la première démo mobile à un visiteur.

**Contexte :** Issu du design-review 2026-05-02. Si le rendu mobile ne correspond pas à 40px, ajuster `py-2.5` → `py-3`.

---

## TODO-19 : Pins inactifs — différenciation visuelle `is_active=false`

**Quoi :** Sur la carte, distinguer visuellement les ambassades activées pour le live courant (`is_active=true`) vs celles non encore confirmées (`is_active=false`). Piste : même teinte indigo mais opacité 60% + point gris sur les inactifs.

**Pourquoi :** Actuellement les 7 pins sont identiques visuellement. En état `live`, un visiteur peut cliquer sur un pin "inactif" et envoyer une demande à un hôte qui n'a pas confirmé sa participation — friction inutile.

**Pros :** Information visible avant le clic. Réduit les demandes "à vide".

**Cons :** Risque de paraître "moins peuplée" la carte. À tester si la différenciation aide ou décourage.

**Contexte :** Issu du design-review 2026-05-02. À traiter quand on a un vrai event en `live` avec mix `is_active=true/false` (le seed actuel a déjà les conditions).

---

## TODO-20 : Audit classes `dark:` orphelines

**Quoi :** `grep -r "dark:" app/ components/` pour trouver les classes Tailwind dark mode oubliées dans les composants. Les retirer toutes (DESIGN.md = no dark mode v1).

**Pourquoi :** La media query `@media (prefers-color-scheme: dark)` a été retirée de `globals.css` (commit `b78968f`), mais des classes Tailwind `dark:bg-...` peuvent traîner dans des composants. Elles ne s'activeront jamais (Tailwind dark mode pas configuré) mais polluent le code.

**Pros :** Code plus propre. Pas de surprise si on active dark mode plus tard.

**Cons :** Aucun. Pure cleanup.

**Contexte :** Issu du design-review 2026-05-02. À faire quand on a un moment calme — non bloquant.

