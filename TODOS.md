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

## TODO-19 : Pins inactifs — différenciation visuelle `is_active=false` — **COMPLETED**

**Statut :** Livré par commit `0d83cc1 feat(carte): pins grisés (Feature A) + groupes femmes (Feature B)` (2026-05-07). `MapPublique.tsx` distingue maintenant les pins actifs (couleur normale) vs inactifs (grisés, popup contextuel "Pas encore confirmé" hors-live ou "Pas disponible" pendant le live). Cluster regroupé en 2 sections (Disponibles / En attente). EmptyMapContent reste affiché si `activeHosts.length === 0` même quand des pins inactifs sont visibles.

---

## TODO-20 : Audit classes `dark:` orphelines

**Quoi :** `grep -r "dark:" app/ components/` pour trouver les classes Tailwind dark mode oubliées dans les composants. Les retirer toutes (DESIGN.md = no dark mode v1).

**Pourquoi :** La media query `@media (prefers-color-scheme: dark)` a été retirée de `globals.css` (commit `b78968f`), mais des classes Tailwind `dark:bg-...` peuvent traîner dans des composants. Elles ne s'activeront jamais (Tailwind dark mode pas configuré) mais polluent le code.

**Pros :** Code plus propre. Pas de surprise si on active dark mode plus tard.

**Cons :** Aucun. Pure cleanup.

**Contexte :** Issu du design-review 2026-05-02. À faire quand on a un moment calme — non bloquant.

---

## TODO-21 : Tracking recherches vides + auto-suggestion villes à recruter

**Quoi :** Quand un visiteur cherche une ville dans la barre Nominatim de `MapPublique` et qu'aucune ambassade n'est visible à proximité du résultat, logguer la recherche dans une nouvelle table `search_misses` (`id, query_normalized, lat, lng, country, has_results=false, created_at`). Aucune donnée identifiante : pas d'IP, pas d'user agent, pas d'identifiant utilisateur. Agrégat sur 30 jours dans `/admin/stats` : "Cette semaine, 12 visiteurs ont cherché en Suisse Romande, 0 ambassade." → drill-down `/admin/ambassadeurs?country=CH`.

**Pourquoi :** La densité du réseau est *la* métrique pastorale qui détermine la qualité de l'expérience (cf design doc d'avril : "La qualité de l'expérience dépend de la densité du réseau, pas de la technologie."). Aujourd'hui, David recrute des ambassadeurs au feeling. Avec ce signal, il sait *exactement* où concentrer ses efforts de recrutement. C'est ce que le doc de recherche appelle "transformer la frustration en recrutement".

**Pros :** Transforme un silence en stratégie. Compose parfaitement avec la "Vue Briefing du Berger" (devient une 3e file d'action après "à traiter" et "silencieux"). Donne à David une intelligence terrain qu'aucun autre canal ne lui donne.

**Cons :** Nouvelle table à maintenir. RGPD à valider même anonymisé (logger une query peut être considéré comme tracking — vérifier la position légale française/européenne sur les recherches anonymes). Signal trop faible avant 200+ ambassades / trafic visiteurs mesurable — peu d'utilité la première année.

**Contexte :** Cherry-pick CP2 du CEO review du 2026-05-07 (`~/.gstack/projects/DavidTheryApp/ceo-plans/2026-05-07-admin-stats-briefing-berger.md`). **Différé** parce que l'app est en phase de conception (DB seed-only, ~50 ambassadeurs prospectés). Signal de déclenchement : quand l'app dépasse 200 ambassades validées OU quand le trafic carte publique devient mesurable (>500 visiteurs uniques / live). À ce moment, ajouter la table + l'agrégat dans la Vue générale.

**Effort estimé :** S-M (humain ~3 jours) → avec CC+gstack : ~3-4h. Nouvelle table + insert depuis `/api/geocode` + helper agrégat + intégration dans `lib/admin/pastoral-stats.ts`.

**Priorité :** P3 (utile mais prématurée).

**Dépend de :** Aucune dépendance technique. Dépend des conditions de déclenchement ci-dessus (volume).

---

## TODO-22 : Briefing pastoral enrichi V2 (narrative + mailto + digest hebdo)

**Quoi :** Reconsidérer une V2 enrichie de `/admin/stats` qui inclurait :
- Narrative pastoral templaté en haut de page (8-10 fragments déterministes combinés par règles `if N>0`, max 3 phrases, ton restraint validé par David)
- Bouton "Lui écrire ✉" sur les ambassades à vérifier, avec 3 templates mailto pré-rédigés (encouragement / bienvenue / check-in) dans la voix de David
- Cron Vercel `admin-weekly-digest` (lundi 8h Réunion) qui envoie le briefing par email aux `admin_users`, opt-out via `admin_users.weekly_digest_enabled BOOLEAN DEFAULT TRUE`

**Pourquoi :** La V1 du plan CEO (2026-05-07) proposait directement ces features dans le scope initial. Codex (outside voice) a fait remonter trois angles morts : (1) le narrative templaté risque de sonner uncanny à la 3e lecture ("software pretending to discern"), (2) le mailto pré-rempli sur métrique faible peut sonner managérial / shaming, (3) l'email digest est prématuré tant que l'usage de la page n'est pas prouvé. Pivot stratégique : valider l'usage V1 (panel factuel sobre) avant d'investir dans la cérémonie.

**Pros :** Si l'usage V1 est prouvé (David ouvre la page après chaque live, clique des liens, Camille traite sa file), les enrichissements V2 transforment la page en vrai outil pastoral d'action — un clic = un geste posé. Pattern "morning briefing" qui marche dans le B2B haut de gamme.

**Cons :** Risque uncanny pastoral si la voix sonne faux. Demande validation explicite voix David (boucle feedback 2-3 semaines). Email digest = surface supplémentaire à maintenir. Si déclenché trop tôt (avant validation usage V1), risque de construire un OS pastoral que David n'utilise pas.

**Contexte :** Issu du pivot CEO review du 2026-05-07 après outside voice Codex. Plan CEO complet : `~/.gstack/projects/DavidTheryApp/ceo-plans/2026-05-07-admin-stats-briefing-berger.md`. **Signal de déclenchement** : 2-3 lives après ship V1, mesurer le tracking page_view. Si David ouvre la page ≥ 1x par live sur 3 lives consécutifs ET clique au moins 1 lien par visite, alors ouvrir une session pour spécifier V2.

**Effort estimé :** L (humain ~1 semaine) → avec CC+gstack : ~6-10h. Inclut narrative builder + 3 templates mailto + cron digest + template React Email + colonne `admin_users.weekly_digest_enabled` + tests + preview `/dev/emails`.

**Priorité :** P3 conditionnelle. Devient P2 si l'usage V1 est confirmé après 2-3 lives.

**Dépend de :**
- Ship V1 du plan CEO (panel factuel "À noter depuis le dernier live")
- Tracking page_view actif et exploitable
- Validation explicite voix David sur 8-10 fragments narrative + 3 templates mailto (preview `/dev/emails`)

---

