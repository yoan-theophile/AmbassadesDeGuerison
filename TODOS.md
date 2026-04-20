# TODOS.md — Ambassades de Guérison

Généré le 2026-04-19. Items différés ou à planifier après le premier live.

---

## TODO-1 : Rate limiting sur `/api/contact-requests/*/acknowledge`

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

## TODO-6 (DÉFÉRÉ CEO REVIEW) : Push notifications (PWA v2)

**Quoi :** Web Push Notifications via PWA Service Worker.

**Pourquoi :** Alerter les hôtes en temps réel quand un visiteur soumet une demande (Mode C) sans email.

**Pros :** Réactivité améliorée, surtout sur mobile en Afrique (email moins consulté).

**Cons :** Complexité du Service Worker, gestion des permissions, taux d'opt-in faible sur web.

**Contexte :** Resend email suffit pour v1. Ce TODO s'active si les hôtes se plaignent de délais de notification.

