# TASKS.md — Pivot live-driven

> **Source de vérité** : `~/.gstack/projects/davidtheryapp/tagne-develop-design-20260501-013211-pivot-live-driven.md`
>
> **Approche** : chantier code unique en 7 ordres logiques. Pas de phases séquencées (phase de conception, pas de prod à préserver). Démo unique à David post-chantier. Estimation ~12-15h CC réparties sur 3-5 sessions.
>
> **Reviews CLEAR** : `/plan-eng-review` (5 décisions), `/codex-plan-review` (14 findings arbitrés), `/plan-design-review` (11 décisions, score 3/10 → 8/10).
>
> **Hors scope chantier code (en parallèle)** : 8 emails David-voice (drafts en Ordre 2.4, validation post-démo) · Resend domaine custom (Théophile en parallèle) · Briefing Camille (pré-production).

---

## Ordre 1 — Schéma DB + seed (Fondations)

- [x] **#1 — Refonte `scripts/reset-db.sql` avec nouveau schéma complet**
  Créer toutes les nouvelles tables (`admin_users`, `live_feedbacks`, `blacklist`, `scheduled_campaigns`, `campaign_recipients`, `moderation_log`, `event_timing_config`) + ALTER `host_profiles` (`church_subtype`, `profile_photo_url`, `room_photo_urls`, `viewing_setup`, `healing_challenge_done`, `church_attendance`, `denomination`, `parcours_spirituel`, `admin_notes`, status élargi) + ALTER `contact_requests` (`visitor_notifications_optin`) + DROP COLUMN `testimonials.timing` + UNIQUE constraints + indexes.

- [x] **#2 — Fonctions SQL `is_admin()` + `is_super_admin()`**
  CREATE OR REPLACE FUNCTION `is_admin(uid UUID)` RETURNS BOOLEAN avec EXISTS sur `admin_users`. Idem pour `is_super_admin` avec filtre `role='super_admin'`. SECURITY DEFINER, STABLE, SET search_path = public.

- [x] **#3 — Modifier triggers `fn_auto_activate_*` pour `is_active=FALSE` par défaut**
  CREATE OR REPLACE FUNCTION `fn_auto_activate_hosts_for_event` et `fn_auto_activate_host_for_existing_events` avec `is_active = FALSE` au lieu de TRUE à l'INSERT. Tester via `tests/db/triggers.test.ts`.

- [x] **#4 — Réécrire les ~10 RLS policies existantes pour utiliser `is_admin()`**
  Toutes les policies utilisant `auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'` deviennent `is_admin(auth.uid())`. Concerne `events`, `host_profiles`, `host_activations`, `contact_requests`, `testimonials`, `live_signals`, `onboarding_config`. Plus nouvelles policies pour les nouvelles tables.

- [x] **#5 — Refonte `scripts/seed.js` avec nouveau schéma + 2 admins**
  Adapter `seed.js` au nouveau schéma : retrait de `timing` dans `testimonials`, nouveau cycle status pour `host_profiles` (`validated` remplace `active`), insertion des 2 admins (`david.thery@demo.fr`, `theo.nelson.ia@gmail.com`) dans `admin_users` avec role super_admin/moderator. Maintenir les 8 ambassadeurs, 14 témoignages, 4 events, 10 demandes de contact.

- [ ] **#6 — Vérifier `npm run db:reset` + `node scripts/seed.js` succeed**
  Tester que le reset+seed complet fonctionne sans erreur SQL. Les 2 admins seed doivent pouvoir se connecter via `magic-link.js` et accéder à `/admin/*`.

---

## Ordre 2 — Helpers et libs partagés (Plomberie)

- [x] **#7 — Helper `lib/auth/require-admin.ts`**
  Créer un helper async `requireAdmin(req)` qui : extrait l'user via `createServerClient` + `getUser`, retourne 401 si non auth, fait un SELECT `is_admin($uid)`, retourne 403 si pas admin, sinon retourne `{ user, supabase: createServiceClient() }`. Pattern early-return type `Promise<{ user, supabase } | NextResponse>`. Utilisé par toutes les routes `/api/admin/*`.

- [x] **#8 — `lib/timing-config.ts` (cache 60s `event_timing_config`)**
  Créer `getTimingConfig()` avec cache server 60s qui retourne les valeurs de `event_timing_config` (`campaign_ambassadors_days_before`, `campaign_visitors_days_before`, `host_reminder_days_before`, `visitor_auto_decline_days_before`, `feedback_days_after`, `queue_aging_days`). Utilisé par les jobs cron + UI `admin/settings/timing`.

- [x] **#9 — `lib/i18n/admin-labels.ts` constants**
  Constants centralisées pour le mapping vocabulaire admin/utilisateur : `{ ADMIN_RED_FLAG: 'Drapeau rouge', USER_REPORT_PROBLEM: 'Signaler un problème', etc. }` pour les 6 termes mappés dans le doc design. FR-only, pas vrai i18n.

- [x] **#10 — Étendre `lib/email/templates.ts` avec 8 nouveaux templates David-voice (drafts)**
  Ajouter 8 templates suivant le pattern `templateOrHtml` existant : `MAGIC_LINK_AMBASSADEUR_BIENVENUE`, `PRE_VALIDATION_ACCORDEE`, `VALIDATION_FINALE`, `CAMPAIGN_AMBASSADORS`, `CAMPAIGN_VISITORS`, `ACCEPTATION_VISITEUR` (mail unique avec adresse), `REFUS_VISITEUR`, `FEEDBACK_POST_LIVE`. Drafts en voix David pastorale guidant. David validera post-démo.

- [x] **#11 — `lib/homepage-data.ts` (Server Component data fetching pour 3 directions preview)**
  `getHomepageData()` qui fetch en parallèle : `nextEvent`, `lastEvent`, `liveInProgress`, `totalAmbassadors` (count active), `totalCountries` (count distinct), `topTestimonials` (5 par length DESC). Cache server 60s. Utilisé par les 3 routes `/preview/homepage-*` + page d'accueil entre lives.

---

## Ordre 3 — APIs et endpoints (Backend)

- [ ] **#12 — POST `/api/visit-requests` (création + consentement)**
  Route handler qui crée une demande visiteur. Body : `{ event_id, host_profile_id, first_name, email, phone, nb_personnes, message, consent }`. Validation Zod stricte. Vérifie blacklist (email/phone). Vérifie event est dans la fenêtre opt-in. INSERT `contact_requests` avec `status='pending'`. Retourne `action_token` pour le visiteur.

- [ ] **#13 — POST `/api/visit-requests/[id]/accept` + `/decline`**
  Endpoints d'acceptation/refus côté hôte, accessibles via le token de la demande. Accept : UPDATE `contact_requests` `status='accepted'`, INSERT trigger qui décrémente capacité, déclenche envoi mail acceptation au visiteur (avec adresse + tel hôte). Decline : `status='declined'`, mail visiteur "pas cette fois".

- [ ] **#14 — POST `/api/host-activations/[event_id]/activate` (opt-in par live)**
  Route handler invoquée depuis le mail invitation ambassadeur. Auth via cookie session host. Body : `{ capacity }`. UPDATE atomique `host_activations SET is_active=TRUE, capacity=$1 WHERE host_profile_id=$2 AND event_id=$3`. Idempotent (clic 2x = no-op). Retourne 200 si OK, 404 si event passé, 403 si pas validated.

- [ ] **#15 — POST `/api/feedbacks` (notation 1-5 post-live)**
  Route handler pour le form feedback post-live. Body : `{ event_id, host_profile_id, contact_request_id, ratings: {welcome, friendliness, listening, prayer}, free_text, reported, report_reason, direction }`. Validation 1-5. UNIQUE constraint évite doublons. Si `reported=true`, INSERT `moderation_log` + déclenche Realtime channel 'reports' + mail Resend admin.

- [ ] **#16 — POST `/api/admin/feedbacks/[id]/handle` (workflow triage)**
  Endpoint admin pour traiter un signalement. Body : `{ action: 'reviewing'|'resolved'|'dismissed', resolution }`. UPDATE `live_feedbacks SET report_status=action, report_handled_by=admin.uid, report_handled_at=NOW(), report_resolution`. INSERT `moderation_log` entry append-only.

- [ ] **#17 — POST/DELETE `/api/admin/blacklist`**
  Endpoints admin pour gérer la blacklist email/téléphone. POST : INSERT `blacklist` + INSERT `moderation_log`. DELETE : retrait + log. Vérification `is_admin` via require-admin helper.

- [ ] **#18 — POST `/api/admin/ambassadeurs/[id]/{validate,reject,suspend}`**
  3 endpoints pour le cycle de statut ambassadeur. Validate : `pre_approved` → `enrichment_pending` (envoie mail vidéo+PDF). Validate finale : `enrichment_pending` → `validated` (mail bienvenue). Reject : → `rejected`. Suspend : `validated` → `suspended`. Tous loggés dans `moderation_log`.

- [ ] **#19 — POST/DELETE `/api/admin/team` (gestion modérateurs)**
  Endpoints super_admin only pour gérer `admin_users`. POST : INSERT `admin_users` avec `role='moderator'` + envoie magic-link au nouvel admin. DELETE : DELETE `admin_users` (sauf self pour super_admin). Vérification `is_super_admin` via helper.

- [ ] **#20 — POST `/api/cron/dispatch-campaigns` (invoqué par GH Actions)**
  Endpoint cron auth via header `X-Cron-Secret`. SELECT `scheduled_campaigns WHERE send_at <= NOW() AND status='pending' LIMIT 50`. Pour chaque campaign : `status='sending'`, SELECT recipients depuis `campaign_recipients` (pending uniquement), batch `Resend.batch.send` par 100, marque chaque recipient sent/bounced. Idempotent : retry safe via `attempts++`. Si fail 3x → `status='failed'` + alert admin.

- [ ] **#21 — GET `/api/unsubscribe/[token]` (désabo visiteur)**
  Endpoint qui valide le token (HMAC ou UUID stocké), UPDATE `contact_requests SET visitor_notifications_optin=FALSE WHERE visitor_email=X`. Affiche page de confirmation neutre. Pas d'info leak en cas de token invalide.

- [ ] **#22 — POST `/api/visitor-help-request` (signalement urgent visiteur)**
  Endpoint pour le bouton "Quelque chose ne va pas ? Contacter l'équipe" depuis mails + page confirmation. Body : `{ token, message }`. INSERT `moderation_log` avec `type='visitor_help'`. Déclenche Realtime channel admin + mail Resend équipe modération. Pas d'auth requise (token suffit).

- [ ] **#23 — Rate limiting Vercel Edge Middleware sur public writes**
  Créer `middleware.ts` (ou étendre existant) qui rate-limit par IP : `/api/visit-requests` (5/min), `/api/inscriptions` (3/min), `/api/temoignages` (3/min), `/api/feedbacks` (2/min), `/api/visitor-help-request` (3/min). Vercel KV ou simple in-memory pour le compteur. Codex Finding #14.

- [ ] **#24 — Honeypot field caché sur tous les forms public**
  Champ `<input type="text" name="website" tabIndex={-1} className="hidden" />` dans tous les forms public (visit-request, inscriptions, temoignages, feedbacks, visitor-help-request). Côté backend : si champ rempli, return 200 silencieusement (bot trap). Codex Finding #14.

- [ ] **#25 — Audit `event_id` mandatory end-to-end (Codex #2)**
  Auditer `app/admin/stats/page.tsx` (résolution event), `app/api/contact-requests/route.ts` (event sur INSERT), et toute route qui utilise "latest live <= now" comme fallback. Forcer `event_id` obligatoire dans l'URL ou le body partout. Tests : back-to-back lives ne mélangent pas les data.

---

## Ordre 4 — UI public (Frontend visiteur)

- [ ] **#26 — `/preview/homepage-poster` (Direction A — minimaliste typographique)**
  Route Next.js avec Server Component data-fetching via `getHomepageData`. Layout : hero typographique géant "AMBASSADES DE GUÉRISON" Geist Sans 7xl, sous-accroche countdown, 2 CTAs en bas (Devenir ambassadeur indigo + Être prévenu prochain live), compteur discret en pied de page. Pas de carte, pas de carrousel. Composition pure.

- [ ] **#27 — `/preview/homepage-storytelling` (Direction B — pastoral narratif)**
  Route Next.js avec layout storytelling. Hero : un témoignage en exergue (le plus long du seed), pas de titre. Scroll vertical : 1 témoignage par viewport avec transition douce. Compteur intercalé "X personnes ont prié ensemble". Section finale "Ouvrez votre maison" + countdown + CTA. Voix narrative pastorale.

- [ ] **#28 — `/preview/homepage-annuaire` (Direction C — data-forward institutionnel)**
  Route Next.js avec layout annuaire. Hero compteur : "7" en très grand (text-9xl) + "ambassades validées dans 6 pays" sous-titre. Tableau pays/nb/villes. Countdown discret en haut droite. 2 CTAs en bas (Devenir ambassadeur + Être prévenu). Calme, sérieux, institutionnel.

- [ ] **#29 — Layout `/preview/*` avec sticky selector A/B/C**
  `app/preview/layout.tsx` : sticky top header avec 3 boutons (Poster / Storytelling / Annuaire) qui linkent vers les 3 routes preview. Style cohérent DESIGN.md. Routes `/preview/*` non indexées (`robots.txt` + meta noindex). Sera supprimé après démo.

- [ ] **#30 — Page d'accueil pendant un live (refonte `app/page.tsx` + EventBanner étendu)**
  `app/page.tsx` adapté à la dichotomie "entre lives vs pendant live" via `liveInProgress`. Pendant un live : carte primary avec pins des ambassades activées (`is_active=TRUE`), EventBanner étendu avec bouton secondaire "Regarder sur YouTube" (Issue 1.5). Si `liveInProgress && 0 pin` : encart pastoral + 2 CTAs (Issue 2.1).

- [ ] **#31 — `/live/[event_id]/ambassade/[host_id]` (form visit-request)**
  Route Next.js du formulaire visiteur. Form avec ordre identité→logistique→message→consentement (Issue 1.2). Microcopy pastoral guidant (Issue 3.1, copy validée). Honeypot field. Validation Zod côté client + serveur. Submit POST `/api/visit-requests` → redirect vers page confirmation 3 étapes.

- [ ] **#32 — Page confirmation visiteur 3 étapes UI**
  Route `/visitor/[token]`. Barre 3 étapes en hero primary visual (Issue 1.3). Étape 1 ✅ envoyée, Étape 2 ⏳ Marie va répondre, Étape 3 📍 adresse à venir. Le contenu sous la barre s'adapte selon l'étape courante. Lien "Quelque chose ne va pas ?" en pied (Issue 7.2). `aria-current="step"` pour a11y.

- [ ] **#33 — Page `/accueillir/[token]` (acceptation hôte tokenisée)**
  Route Next.js symétrique au `/refuser/[token]` existant. Affiche la demande visiteur (prénom, nb personnes, message). 2 boutons full-width "J'accueille" / "Je ne peux pas". Pas de login. Gère states : loading, error (token invalide/expiré), success, partial (déjà accepté/refusé). Idempotent.

- [ ] **#34 — Form feedback post-live (4 critères × 5 étoiles indigo + signalement)**
  Route `/feedback/[token]` (visiteur ou hôte selon direction). Composant Étoiles maison indigo-600 (Issue 4.1). 4 critères : Accueil / Convivialité / Écoute / Temps de prière. Free-text + checkbox "Signaler un problème" qui révèle un input "raison". Mobile : étoiles 32px tap target 44px, 1 critère/ligne. `role="radiogroup"` + aria-label.

- [ ] **#35 — Refonte `/temoignages` public (suppression timing, ajout pays)**
  Adapter `app/temoignages/page.tsx` : retirer prop `timing` du SELECT et de `TemoignageCard`. Afficher pays à côté du prénom dans les métadonnées. Filtre par live conservé. Migration legacy témoignages anonymes → marqués `legacy_anonymous`.

- [ ] **#36 — Page `/faq` (10 Q/R minimum)**
  Nouvelle route `/faq` publique. 10 questions/réponses minimum couvrant les inquiétudes mamie 65 ans : "C'est quoi un live de guérison ?", "Comment je trouve une ambassade près de chez moi ?", "L'ambassadeur peut-il refuser ?", "Combien ça coûte ?", "Et si je n'ai pas internet chez moi ?", etc. Layout simple, accordéon shadcn. Lien dans footer global.

- [ ] **#37 — Suppression nette de `app/accueil-invite/[token]/`**
  `rm -rf app/accueil-invite/`. Suppression route + composants liés. Pas de redirection, pas de legacy 30j (phase de conception, pas de tokens vivants). Codex #13 sans objet. TODO-1 (rate limit acknowledge) devient sans objet.

- [ ] **#38 — Page `/contact-equipe` (form free-text signalement urgent)**
  Nouvelle route publique. Titre pastoral "Dis-nous ce qui se passe, on te recontacte rapidement". Form : token (caché, depuis URL params), message free-text, bouton submit. POST `/api/visitor-help-request`. Lien depuis mails acceptation+rappel + page confirmation 3 étapes.

---

## Ordre 5 — UI admin (Frontend modération)

- [ ] **#39 — Installation shadcn/ui via `vercel:shadcn` skill**
  `npx shadcn-ui@latest init` avec config alignée DESIGN.md (indigo-600 primary, slate neutral, Geist Sans). Installer composants : Dialog, Toast/Sonner, DropdownMenu, Tabs, Tooltip, Select, Combobox, Dropzone (custom car pas natif shadcn). Tous dans `components/ui/`. Vérifier compatibilité avec composants existants.

- [ ] **#40 — `/admin/team` (super_admin gestion modérateurs)**
  Route admin super_admin only. Liste des `admin_users` avec role + added_by + added_at. Bouton "Ajouter un modérateur" → form email + role. POST `/api/admin/team`. Bouton "Retirer" sur chaque ligne (sauf self). DELETE `/api/admin/team`. Filtre `is_super_admin` via require-admin helper.

- [ ] **#41 — `/admin/calendrier` (refonte `/admin/planning`)**
  Page de gestion des events + programmation des 2 campagnes mail (ambassadeurs, visiteurs). Form création event avec date+heure (timezone Réunion). Pour chaque event futur, encart "Programmer la campagne" avec champs `send_at` + `custom_message` (textarea simple). Décision CQ-1 : pas de markdown, juste textarea avec nl2br côté serveur.

- [ ] **#42 — `/admin/feedback` (workflow triage signalements + Realtime)**
  Page de modération signalements. Liste `live_feedbacks WHERE reported=TRUE` ordered by `report_status` (pending → reviewing → resolved/dismissed) + created_at. Toast Realtime via `supabase.channel('reports')` sur INSERT WHERE `reported=true` (Issue 4 eng review). Bouton par signalement : "Marquer en cours" → "Résoudre" / "Dismiss" via `/api/admin/feedbacks/[id]/handle`.

- [ ] **#43 — `/admin/ambassadeurs` étendu (3-status + photos + notes admin)**
  Étendre la page `admin/ambassadeurs` existante : afficher le nouveau cycle de statut (`pending_review`, `pre_approved`, `enrichment_pending`, `validated`, `suspended`, `rejected`). Boutons d'action selon statut courant. Vue détail avec photos profil + pièce (admin-only via RLS), questionnaire enrichi (`denomination`, `healing_challenge_done`, etc.), `admin_notes` éditables, drapeau rouge interne (badge red-50/red-700).

- [ ] **#44 — `/admin/settings/timing` (édition `event_timing_config`)**
  Page super_admin only. Form avec 6 champs INTEGER : `campaign_ambassadors_days_before`, `campaign_visitors_days_before`, `host_reminder_days_before`, `visitor_auto_decline_days_before`, `feedback_days_after`, `queue_aging_days`. Tooltips explicatifs. Submit UPDATE `event_timing_config WHERE id=1`. Cache server invalidé.

- [ ] **#45 — `/admin/blacklist`**
  Page admin pour gérer la blacklist. Liste des entrées (email, phone, reason, added_by, added_at). Form ajout (email OR phone, reason). Bouton retrait. Vocabulaire utilisateur côté UI : "Bloquer cet utilisateur" (pas "Blacklister" qui est interne admin).

- [ ] **#46 — Refonte `/dashboard` ambassadeur en 4 sections (Tabs shadcn)**
  Refonte complète du dashboard ambassadeur en 4 onglets : Mes lives (events à venir avec activation opt-in via "J'accueille"), Mes demandes (visit-requests pending, badge avec compteur), Mon profil (édition prénom/photo/questionnaire enrichi/lien WhatsApp), Mes ressources (vidéo + PDF charte téléchargeable). Tabs shadcn pour la navigation. Issue 1.4 résolu : section "Mes demandes" sert de rappel passif (entry point principal = mail tokenisé).

- [ ] **#47 — Photo upload Dropzone shadcn (profil + pièce)**
  Composant Dropzone (drag-drop ou click) avec preview thumbnail + crop carré pour photo profil. Multi-upload (max 5) pour photos pièce. Validation client max 5MB, formats jpg/png/webp. Upload Supabase Storage avec 2 buckets (`profile_photos` public, `room_photos` admin-only). RLS policies strictes. Issue 7.1.

- [ ] **#48 — Bell badge AdminLayout + Realtime channel global**
  Étendre `AdminLayout` avec un Bell icon (lucide-react) dans le header + dot rouge animate-pulse si signalements non traités. Click navigate vers `/admin/feedback`. `supabase.channel('reports')` subscribed dans AdminLayout, persistant tant que admin connecté. Cleanup useEffect.

- [ ] **#49 — Page acceptation hôte (encart "Demandes pending" sur dashboard)**
  Sur le dashboard ambassadeur (section "Mes demandes"), liste des `contact_requests` pending pour les events futurs. Card par demande : prénom + nb_personnes + message + 2 boutons "J'accueille" / "Je ne peux pas". Click POST `/api/visit-requests/[id]/accept` ou decline. Cohérent avec `/accueillir/[token]` tokenisé pour les hôtes qui viennent depuis le mail.

---

## Ordre 6 — Cron + jobs (Tâches programmées)

- [ ] **#50 — Workflow GH Actions `dispatch-campaigns.yml` (cron `*/5 * * * *`)**
  `.github/workflows/dispatch-campaigns.yml` avec schedule cron toutes les 5 min. Job qui invoque POST `/api/cron/dispatch-campaigns` avec `X-Cron-Secret` header. Cohérent avec pattern existant `host-activations-check.yml`.

- [ ] **#51 — Workflow GH Actions `auto-decline.yml` (J-1 visiteurs sans réponse)**
  `.github/workflows/auto-decline.yml`. Cron quotidien (`0 6 * * *`). Invoque POST `/api/cron/auto-decline` qui SELECT `contact_requests WHERE status='pending' AND event.event_date - INTERVAL X day <= NOW()` (X = `visitor_auto_decline_days_before` depuis `event_timing_config`). UPDATE `status='cancelled_no_response'`, mail visiteur "pas de place cette fois".

- [ ] **#52 — Workflow GH Actions `feedback-emails.yml` (J+1 post-live)**
  `.github/workflows/feedback-emails.yml`. Cron quotidien. Invoque POST `/api/cron/send-feedback-emails`. SELECT `events WHERE event_date + INTERVAL X day BETWEEN NOW()-1h AND NOW()` (X = `feedback_days_after`). Pour chaque event passé : mail à chaque visiteur accepté + chaque hôte ayant accueilli avec lien `/feedback/[token]`. Idempotent (`status='feedback_sent'` sur l'event).

---

## Ordre 7 — Tests (Validation)

- [ ] **#53 — Tests db (17 tests Supabase local)**
  `tests/db/` : `rls.test.ts` étendu (nouvelles policies via `is_admin`), `triggers.test.ts` (modifications `fn_auto_activate_*`), `is-admin.test.ts` (fonction SQL), `admin-users.test.ts` (insertion/suppression), `feedback-rls.test.ts`, `feedback-unique.test.ts` (UNIQUE constraint), `blacklist.test.ts` (refus contact_requests), `church-permanent.test.ts`, `host-status-cycle.test.ts` (transitions de statut), `schema.test.ts` (timing column absent), 7 tests additionnels selon test plan eng review.

- [ ] **#54 — Tests unit Vitest (29 tests)**
  `tests/unit/` : étendre tests existants (`inscription`, `onboarding-complete`, `admin-ambassadeur-action`, etc.) + nouveaux tests `host-activate.test.ts`, `dispatch-campaigns.test.ts`, `visitor-flow.test.ts`, `custom-message-render.test.ts`, `feedback-form.test.ts`, `photo-upload.test.ts`, `questionnaire.test.ts`, `dashboard-ambassadeur.test.ts`, `realtime-channel.test.ts`, `admin-blacklist.test.ts`, `calendrier-form.test.ts`, `event-banner.test.ts`, `visitor-unsub.test.ts`, `mamie-flow.test.ts`, etc.

- [ ] **#55 — Tests e2e Playwright (8 tests)**
  `e2e/` : étendre existants (`admin-stats-auth`, `opt-out-activation`, `rls-isolation`) + `activate-via-mail-link.spec.ts`, `host-accept-visitor.spec.ts`, `mamie-discovery.spec.ts`, `ambassadeur-activation.spec.ts`, `signalement-realtime.spec.ts`, `cron-dispatch.spec.ts`, `dashboard-flow.spec.ts`. Couvre les flows transverses critiques.

- [ ] **#56 — Régressions critiques REG-1 à REG-4**
  REG-1 : geocoding inscription doit capturer lat/lng (ambassade visible immédiatement). REG-2 : migration `is_active TRUE → FALSE` doit casser zero pin sur events existants sans clic explicite. REG-3 : DROP COLUMN `timing` ne doit pas casser les SELECT. REG-4 : nouvelle `is_admin()` doit autoriser les admins existants après migration seed. **Tests obligatoires (iron rule).**

---

## Démo finale

- [ ] **#57 — Démo finale à David (post-chantier)**
  Présentation à David quand les 7 ordres sont terminés. David teste : flux mamie de A à Z (carte allumée → clic pin → form visit-request → confirmation → mail acceptation → réception adresse), choisit une des 3 directions homepage preview, navigue dans `/admin/*`, signale ce qui ne va pas. Itérations post-démo selon retours David. La direction approuvée devient `app/page.tsx`, les 2 autres routes `/preview/*` sont supprimées.

---

## Légende

- `[ ]` — pending (à faire)
- `[~]` — in_progress (en cours)
- `[x]` — completed (fait)

## Cohérence avec le tracking gstack

Les 57 tâches sont aussi présentes dans le tracking gstack (`TaskList`, `TaskUpdate`). Si tu les utilises en parallèle :
- Cocher la case `[x]` ici quand la tâche est marquée `completed` côté gstack (ou inversement)
- TaskList côté gstack survit aux changements de session si tu fais `/checkpoint resume`

---

*Généré le 2026-05-01 depuis le doc `~/.gstack/projects/davidtheryapp/tagne-develop-design-20260501-013211-pivot-live-driven.md` et `gstack TaskList`. À mettre à jour au fur et à mesure du chantier.*
