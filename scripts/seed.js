/**
 * Seed script — DavidTheryApp
 * Prérequis : avoir exécuté scripts/reset-db.sql dans Supabase SQL Editor
 * Lance : node scripts/seed.js
 */
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
}

const BASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!BASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function req(method, endpoint, body) {
  const res = await fetch(`${BASE_URL}/rest/v1${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${endpoint} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function patch(endpoint, body) {
  const res = await fetch(`${BASE_URL}/rest/v1${endpoint}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PATCH ${endpoint} → ${res.status}: ${t.slice(0, 120)}`);
  }
}

async function authReq(method, path, body) {
  const res = await fetch(`${BASE_URL}/auth/v1${path}`, {
    method,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

async function run() {
  console.log('🌱 Seed DavidTheryApp');
  console.log(`   ${BASE_URL}\n`);

  // ── 1. Nettoyage ─────────────────────────────────────────────────────────
  console.log('→ Nettoyage...');
  const noop = '?id=neq.00000000-0000-0000-0000-000000000000';
  for (const table of ['live_signals', 'testimonials', 'contact_requests', 'host_activations', 'host_profiles', 'events']) {
    const res = await fetch(`${BASE_URL}/rest/v1/${table}${noop}`, { method: 'DELETE', headers });
    if (!res.ok) console.log(`  · ${table}: ${(await res.text()).slice(0, 80)}`);
  }
  console.log('  ✓ Tables vidées\n');

  // ── 2. Ambassadeurs ───────────────────────────────────────────────────────
  // Insérés AVANT les events → trigger auto-activate peut les trouver.
  console.log('→ Ambassadeurs...');
  const hostsData = [
    {
      first_name: 'Marie', email: 'marie.dubois@demo.fr',
      city: 'Paris', country: 'France',
      host_type: 'individual', contact_mode: 'email', capacity: 15,
      address_private: '12 rue de la Paix, 75001 Paris',
      consignes: 'Sonner à l\'interphone "Dubois". Ascenseur disponible. Parking Opéra à 200m.',
      lat: 48.8698, lng: 2.3315, status: 'active',
    },
    {
      first_name: 'Jean-Pierre', email: 'jp.martin@demo.fr',
      city: 'Lyon', country: 'France',
      host_type: 'church', contact_mode: 'whatsapp', capacity: 80,
      address_private: '5 place Bellecour, 69002 Lyon',
      consignes: 'Entrée principale sur la place. Grande salle au premier étage. Accessible PMR.',
      whatsapp_group_url: 'https://chat.whatsapp.com/DemoGroupLyon123',
      lat: 45.7578, lng: 4.8320, status: 'active',
    },
    {
      first_name: 'Fatou', email: 'fatou.diallo@demo.fr',
      city: 'Bruxelles', country: 'Belgique',
      host_type: 'individual', contact_mode: 'telephone', capacity: 40,
      address_private: 'Avenue Louise 54, 1050 Bruxelles',
      consignes: 'Salle communautaire au rez-de-chaussée. Pas de parking sur place.',
      lat: 50.8503, lng: 4.3517, status: 'active',
    },
    {
      first_name: 'Samuel', email: 'samuel.eko@demo.fr',
      city: 'Montréal', country: 'Canada',
      host_type: 'individual', contact_mode: 'whatsapp', capacity: 12,
      address_private: '1420 rue Sherbrooke O, Montréal, QC H3G 1K4',
      consignes: 'Appartement 4B. Buzzer : SAMUEL. Métro Guy-Concordia à 5 min.',
      lat: 45.5017, lng: -73.5673, status: 'active',
    },
    {
      first_name: 'Claire', email: 'claire.bernard@demo.fr',
      city: 'Genève', country: 'Suisse',
      host_type: 'individual', contact_mode: 'email', capacity: 8,
      address_private: 'Rue du Rhône 10, 1204 Genève',
      consignes: 'Digicode : 4521. 3ème étage, porte droite.',
      lat: 46.2044, lng: 6.1432, status: 'active',
    },
    {
      first_name: 'Kofi', email: 'kofi.asante@demo.fr',
      city: 'Abidjan', country: "Côte d'Ivoire",
      host_type: 'church', contact_mode: 'whatsapp', capacity: 120,
      address_private: 'Carrefour Anono, Cocody, Abidjan',
      consignes: 'Temple évangélique Lumière. Grande salle climatisée.',
      whatsapp_group_url: 'https://chat.whatsapp.com/DemoGroupAbidjan456',
      lat: 5.3600, lng: -4.0083, status: 'active',
    },
    {
      first_name: 'Aminata', email: 'aminata.sow@demo.fr',
      city: 'Dakar', country: 'Sénégal',
      host_type: 'church', contact_mode: 'whatsapp', capacity: 60,
      address_private: 'Quartier Almadies, Dakar',
      consignes: 'Centre communautaire Foi & Vie. Salle principale, rez-de-chaussée.',
      lat: 14.7645, lng: -17.3660, status: 'active',
    },
    {
      first_name: 'Sophie', email: 'sophie.leroux@demo.fr',
      city: 'Bordeaux', country: 'France',
      host_type: 'individual', contact_mode: 'email', capacity: 10,
      address_private: "8 cours de l'Intendance, 33000 Bordeaux",
      consignes: null,
      lat: 44.8378, lng: -0.5792, status: 'pending_onboarding',
    },
  ];

  const hostIds = {};
  for (const h of hostsData) {
    try {
      const [row] = await req('POST', '/host_profiles', h);
      hostIds[h.email] = row.id;
      console.log(`  ✓ ${h.first_name.padEnd(12)} ${h.city}, ${h.country} — cap ${h.capacity} — ${h.status}`);
    } catch (e) {
      console.log(`  ✗ ${h.first_name}: ${e.message.slice(0, 120)}`);
    }
  }

  const activeHosts = hostsData.filter(h => h.status === 'active');

  // ── 3. Événements ─────────────────────────────────────────────────────────
  // Insérés APRÈS les hôtes → trigger active automatiquement les hôtes actifs.
  console.log('\n→ Événements...');

  const [evtOld] = await req('POST', '/events', {
    title: 'Live Guérison — Foi sans frontières',
    description: 'Live de guérison et de délivrance animé depuis La Réunion.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    event_date: daysAgo(60),
  });
  console.log(`  ✓ [J-60] ${evtOld.title}`);

  const [evtMid] = await req('POST', '/events', {
    title: 'Live Guérison — Touché par la grâce',
    description: 'Une soirée de prière et de guérisons avec David Théry.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    event_date: daysAgo(30),
  });
  console.log(`  ✓ [J-30] ${evtMid.title}`);

  const [evtRecent] = await req('POST', '/events', {
    title: 'Nuit de Prière — Souffle nouveau',
    description: 'Nuit de prière collective depuis les ambassades du monde entier.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    event_date: daysAgo(7),
  });
  console.log(`  ✓ [J-7]  ${evtRecent.title}  ← event principal (admin/live, modération)`);

  const [evtFutur] = await req('POST', '/events', {
    title: "Live Guérison — La puissance de l'Amour",
    description: "Rejoignez David Théry pour une soirée de prière collective depuis votre ambassade locale.",
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    live_link: 'https://youtube.com/live/example15',
    event_date: daysFromNow(10),
  });
  console.log(`  ✓ [J+10] ${evtFutur.title}`);

  // ── 4. Accepted_count events passés (simulation) ──────────────────────────
  // Patch direct — remplace la valeur initiale 0 par un compte réaliste.
  console.log('\n→ Comptages participations (events passés)...');

  const countsOld    = { Marie: 12, 'Jean-Pierre': 65, Fatou: 30, Samuel: 8, Claire: 6, Kofi: 90, Aminata: 45 };
  const countsMid    = { Marie: 14, 'Jean-Pierre': 78, Fatou: 35, Samuel: 11, Claire: 7, Kofi: 110, Aminata: 52 };
  const countsRecent = { Marie: 15, 'Jean-Pierre': 80, Fatou: 38, Samuel: 10, Claire: 8, Kofi: 118, Aminata: 58 };

  for (const [evtId, counts, label] of [
    [evtOld.id, countsOld, 'J-60'],
    [evtMid.id, countsMid, 'J-30'],
    [evtRecent.id, countsRecent, 'J-7'],
  ]) {
    for (const h of activeHosts) {
      const hid = hostIds[h.email];
      if (!hid) continue;
      const accepted = counts[h.first_name] ?? 0;
      const isFull = accepted >= h.capacity;
      try {
        await patch(
          `/host_activations?host_profile_id=eq.${hid}&event_id=eq.${evtId}`,
          { accepted_count: accepted, is_full: isFull }
        );
      } catch (e) {
        console.log(`  ✗ [${label}] ${h.first_name}: ${e.message.slice(0, 80)}`);
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`  ✓ [${label}] ${total} participants au total`);
  }

  // ── 5. Demandes de contact (event récent) ─────────────────────────────────
  console.log('\n→ Demandes de contact...');
  const activationsRecent = await req('GET',
    `/host_activations?event_id=eq.${evtRecent.id}&is_active=eq.true&select=id,host_profile_id`
  );
  const actBy = email => activationsRecent.find(a => a.host_profile_id === hostIds[email]);

  const contactsData = [
    { host: 'marie.dubois@demo.fr', first: 'Pierre',    email: 'pierre.moreau@mail.com',   whatsapp: '+33612345678', msg: 'Je viens avec ma femme, nous sommes deux.', status: 'pending', onboarded: true  },
    { host: 'marie.dubois@demo.fr', first: 'Nathalie',  email: 'nathalie.v@mail.com',       whatsapp: null,           msg: null,                                         status: 'pending', onboarded: false },
    { host: 'marie.dubois@demo.fr', first: 'Luc',       email: 'luc.fontaine@mail.com',     whatsapp: '+33688112233', msg: 'Premier live pour moi, hâte d\'y être !',     status: 'pending', onboarded: true  },
    { host: 'jp.martin@demo.fr',    first: 'Ahmed',     email: 'ahmed.mansour@mail.com',    whatsapp: '+33698765432', msg: 'Merci pour cette initiative, je viens seul.', status: 'pending', onboarded: true  },
    { host: 'jp.martin@demo.fr',    first: 'Isabelle',  email: 'isabelle.r@mail.com',       whatsapp: null,           msg: 'Ma famille sera là aussi, 5 personnes.',      status: 'pending', onboarded: false },
    { host: 'fatou.diallo@demo.fr', first: 'Laure',     email: 'laure.d@mail.com',          whatsapp: null,           msg: null,                                         status: 'declined',onboarded: false },
    { host: 'fatou.diallo@demo.fr', first: 'Thomas',    email: 'thomas.b@mail.com',         whatsapp: '+32478001122', msg: 'Je suis en déplacement à Bruxelles ce soir.', status: 'pending', onboarded: true  },
    { host: 'samuel.eko@demo.fr',   first: 'Emmanuel',  email: 'emmanuel.b@mail.com',       whatsapp: '+15141234567', msg: "J'habite à 10 minutes, avec plaisir !",        status: 'pending', onboarded: true  },
    { host: 'kofi.asante@demo.fr',  first: 'Bénédicte', email: 'benedicte.k@mail.com',      whatsapp: '+2250701234567', msg: 'Notre groupe viendra en bus depuis Yopougon.', status: 'pending', onboarded: true },
    { host: 'aminata.sow@demo.fr',  first: 'Oumar',     email: 'oumar.dia@mail.com',        whatsapp: '+221771234567', msg: 'Présent avec ma communauté.',                status: 'pending', onboarded: true  },
  ];

  let contactCreated = 0;
  for (const c of contactsData) {
    const act = actBy(c.host);
    if (!act) { console.log(`  · Activation manquante pour ${c.first} (${c.host})`); continue; }
    try {
      await req('POST', '/contact_requests', {
        host_activation_id: act.id,
        visitor_first_name: c.first,
        visitor_email: c.email,
        visitor_whatsapp: c.whatsapp,
        visitor_message: c.msg,
        status: c.status,
        onboarding_completed: c.onboarded,
      });
      contactCreated++;
    } catch (e) {
      console.log(`  ✗ ${c.first}: ${e.message.slice(0, 120)}`);
    }
  }
  console.log(`  ✓ ${contactCreated} demandes créées (trigger accepted_count actif)`);

  // ── 6. Témoignages ────────────────────────────────────────────────────────
  console.log('\n→ Témoignages...');

  // Ambassadeurs — event J-60 (2 témoignages)
  const tOld = [
    { email: 'kofi.asante@demo.fr', timing: 'during', visible: true,
      content: "Abidjan était en feu. Les gens priaient debout, les bras levés. Un homme qui boitait depuis des années a recommencé à marcher normalement pendant la prière. Nous avons vu de nos yeux." },
    { email: 'samuel.eko@demo.fr', timing: 'after', visible: true,
      content: "Un frère de Montréal qui traversait une dépression profonde depuis six mois m'a dit après le live : 'Pour la première fois depuis longtemps, j'ai envie de me lever.' Dieu est là." },
  ];

  // Ambassadeurs — event J-30 (3 témoignages)
  const tMid = [
    { email: 'marie.dubois@demo.fr', timing: 'after', visible: true,
      content: "Nous étions 14 ce soir dans mon salon. À un moment de prière intense, une sœur qui souffrait de migraines chroniques a senti sa tête se libérer complètement. Elle pleurait de joie." },
    { email: 'fatou.diallo@demo.fr', timing: 'during', visible: true,
      content: "Mon mari était sceptique. Il est venu par amour pour moi. À la fin du live il priait les mains levées, les yeux fermés. Il m'a dit : 'Je ne sais pas ce que j'ai ressenti, mais je veux revenir.'" },
    { email: 'claire.bernard@demo.fr', timing: 'after', visible: true,
      content: "7 personnes dans mon appartement. Ambiance intime mais présence forte. Une amie souffrant d'insomnies chroniques a dormi d'un trait cette nuit-là — première fois depuis des mois." },
  ];

  // Ambassadeurs — event récent J-7 (4 témoignages visibles + 1 en attente)
  const tRecent = [
    { email: 'jp.martin@demo.fr', timing: 'during', visible: true,
      content: "Plus de 78 personnes réunies dans notre église. Pendant la prière des mains levées, des gens témoignaient de douleurs qui disparaissaient en temps réel. Une atmosphère de ferveur comme rarement vécue depuis des années." },
    { email: 'aminata.sow@demo.fr', timing: 'during', visible: true,
      content: "Dakar était connecté ! 58 frères et sœurs chez nous. Quand David a déclaré la guérison pour les maladies de dos, trois personnes ont immédiatement témoigné que la douleur avait quitté. Nous avons chanté jusqu'à minuit." },
    { email: 'kofi.asante@demo.fr', timing: 'during', visible: true,
      content: "Le Seigneur a visité Abidjan cette nuit. 118 présents. Un homme sourd d'une oreille depuis l'enfance a commencé à entendre pendant la prière de David. Nous avons tous pleuré. Que son nom soit béni." },
    { email: 'marie.dubois@demo.fr', timing: 'after', visible: true,
      content: "15 présents à Paris. La soirée était puissante. Une participante qui n'avait pas pu travailler depuis 3 semaines à cause de douleurs dorsales s'est levée et a dit : 'C'est parti.' On attendait déjà le prochain live." },
    // En attente de modération (ambassador)
    { email: 'samuel.eko@demo.fr', timing: 'after', visible: false,
      content: "Live intense à Montréal. Petite assemblée mais Dieu était là. Un ami qui luttait contre l'anxiété depuis des mois est reparti avec une paix inexplicable. Il m'a texté le lendemain : 'Je vais bien.' C'est tout." },
  ];

  // Témoignages anonymes (formulaire public) — event J-7 (3 visibles + 1 en attente)
  const tAnon = [
    { event_id: evtRecent.id, timing: 'during', visible: true,
      visitor_name: 'Grâce', submitter_city: 'Nantes',
      content: "Je regardais seule chez moi. Quand David a prié pour les genoux, les miens brûlaient et puis d'un coup, plus rien. Je n'osais pas y croire. J'ai recommencé à monter les escaliers sans m'arrêter." },
    { event_id: evtRecent.id, timing: 'after', visible: true,
      visitor_name: 'Patrick', submitter_city: 'Marseille',
      content: "C'est ma première fois sur un live de David. Ma sœur m'avait dit de regarder. Je suis athée. Ce que j'ai ressenti pendant la prière, je ne peux pas l'expliquer. Je cherche des réponses." },
    { event_id: evtMid.id, timing: 'after', visible: true,
      visitor_name: 'Christelle', submitter_city: 'Douala',
      content: "Nous regardions à plusieurs dans un appartement à Douala. L'atmosphère était lourde et tout d'un coup une paix est descendue. Ma voisine qui avait des problèmes aux yeux depuis longtemps a pleuré et dit : 'Je vois mieux.'" },
    // En attente de modération (anonyme)
    { event_id: evtRecent.id, timing: 'during', visible: false,
      visitor_name: null, submitter_city: null,
      content: "J'ai suivi le live depuis mon téléphone dans le métro. Ce n'est pas le meilleur endroit pour prier mais j'ai quand même senti quelque chose. Je reviendrai depuis chez moi la prochaine fois." },
  ];

  let tCreated = 0;

  for (const t of [...tOld, ...tMid, ...tRecent]) {
    const hid = hostIds[t.email];
    if (!hid) continue;
    let eventId;
    if (tOld.includes(t)) eventId = evtOld.id;
    else if (tMid.includes(t)) eventId = evtMid.id;
    else eventId = evtRecent.id;
    try {
      await req('POST', '/testimonials', {
        host_profile_id: hid,
        event_id: eventId,
        content: t.content,
        timing: t.timing,
        is_visible: t.visible,
      });
      tCreated++;
    } catch (e) {
      console.log(`  ✗ Ambassador ${t.email}: ${e.message.slice(0, 80)}`);
    }
  }

  for (const t of tAnon) {
    try {
      await req('POST', '/testimonials', {
        host_profile_id: null,
        contact_request_id: null,
        visitor_name: t.visitor_name,
        submitter_city: t.submitter_city,
        event_id: t.event_id,
        content: t.content,
        timing: t.timing,
        is_visible: t.visible,
      });
      tCreated++;
    } catch (e) {
      console.log(`  ✗ Anonyme ${t.visitor_name ?? '(sans nom)'}: ${e.message.slice(0, 80)}`);
    }
  }

  const visibleCount = [...tOld, ...tMid, ...tRecent, ...tAnon].filter(t => t.visible).length;
  const pendingCount = [...tOld, ...tMid, ...tRecent, ...tAnon].filter(t => !t.visible).length;
  console.log(`  ✓ ${tCreated} témoignages — ${visibleCount} publiés, ${pendingCount} en attente de modération`);

  // ── 7. Signaux live (event récent) ────────────────────────────────────────
  console.log('\n→ Signaux live...');

  const signalsData = [
    { email: 'jp.martin@demo.fr',   status: 'approved', link_shared: true,
      description: 'Salle pleine. Les gens prient debout, les bras levés. Ambiance de ferveur exceptionnelle.' },
    { email: 'kofi.asante@demo.fr', status: 'approved', link_shared: true,
      description: 'Abidjan en feu ! 118 présents. Guérison témoignée en direct — homme sourd qui entend. Gloire à Dieu.' },
    { email: 'aminata.sow@demo.fr', status: 'pending', link_shared: false,
      description: '58 frères et sœurs à Dakar. Trois témoignages de guérison de dos pendant la prière.' },
    { email: 'marie.dubois@demo.fr', status: 'used', link_shared: true,
      description: 'Paris, 15 présents. Atmosphère de paix. Une sœur libérée de migraines chroniques.' },
    { email: 'fatou.diallo@demo.fr', status: 'declined', link_shared: false,
      description: 'Bruxelles — live difficile à suivre ce soir, connexion instable. On revient au prochain.' },
  ];

  let sigCreated = 0;
  for (const s of signalsData) {
    const hid = hostIds[s.email];
    if (!hid) continue;
    try {
      await req('POST', '/live_signals', {
        host_profile_id: hid,
        event_id: evtRecent.id,
        description: s.description,
        status: s.status,
        link_shared: s.link_shared,
      });
      sigCreated++;
      const host = hostsData.find(h => h.email === s.email);
      console.log(`  ✓ ${host.first_name.padEnd(12)} [${s.status}] ${s.description.slice(0, 55)}…`);
    } catch (e) {
      console.log(`  ✗ ${s.email}: ${e.message.slice(0, 80)}`);
    }
  }

  // ── 8. Comptes admin ──────────────────────────────────────────────────────
  console.log('\n→ Comptes admin...');

  const admins = [
    { email: 'david.thery@demo.fr',     label: 'David Théry (démo)' },
    { email: 'theo.nelson.ia@gmail.com', label: 'Théophile (dev)'    },
  ];

  let existingAuthUsers = [];
  try {
    const res = await authReq('GET', '/admin/users?per_page=1000');
    existingAuthUsers = res?.users ?? [];
  } catch (e) {
    console.log(`  ⚠ Impossible de lister les utilisateurs Auth: ${e.message.slice(0, 80)}`);
  }

  for (const admin of admins) {
    const existing = existingAuthUsers.find(u => u.email === admin.email);
    try {
      if (existing) {
        await authReq('PUT', `/admin/users/${existing.id}`, {
          user_metadata: { ...(existing.user_metadata ?? {}), role: 'admin' },
        });
        console.log(`  ✓ ${admin.label} — rôle admin confirmé`);
      } else {
        await authReq('POST', '/admin/users', {
          email: admin.email,
          email_confirm: true,
          user_metadata: { role: 'admin' },
        });
        console.log(`  ✓ ${admin.label} — créé`);
      }
    } catch (e) {
      console.log(`  ✗ ${admin.label}: ${e.message.slice(0, 100)}`);
    }
  }
  console.log('  → node scripts/magic-link.js <email> pour se connecter\n');

  // ── 9. Config onboarding ──────────────────────────────────────────────────
  console.log('→ Config onboarding...');
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/onboarding_config`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: 1, video_url: '', pdf_url: '/docs/guide-ambassade.pdf' }),
    });
    if (res.ok) {
      console.log('  ✓ Config initialisée (video_url vide → fallback config/onboarding.ts)');
    } else {
      console.log(`  ✗ ${(await res.text()).slice(0, 80)}`);
    }
  } catch (e) {
    console.log(`  ✗ ${e.message.slice(0, 80)}`);
  }

  // ── 10. Résumé ────────────────────────────────────────────────────────────
  console.log('\n📊 Résumé :');
  const tables = [
    ['events', 'events'],
    ['host_profiles', 'host_profiles'],
    ['host_activations', 'host_activations'],
    ['contact_requests', 'contact_requests'],
    ['testimonials', 'testimonials'],
    ['live_signals', 'live_signals'],
  ];
  for (const [label, table] of tables) {
    const res = await fetch(`${BASE_URL}/rest/v1/${table}?select=id`, {
      headers: { ...headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' },
    });
    const total = (res.headers.get('content-range') ?? '?/?').split('/')[1] ?? '?';
    console.log(`  ${label.padEnd(22)} ${total} lignes`);
  }

  console.log('\n✅ Seed terminé !');
  console.log('   → npm run dev → http://localhost:3000');
  console.log('   → /admin/live    : 5 signaux (approved/pending/declined/used)');
  console.log('   → /admin/temoignages : 2 témoignages en attente de modération');
  console.log('   → /temoignages   : 10 publiés (ambassadeurs + anonymes), filtre 3 events');
}

run().catch(e => {
  console.error('\n❌ Erreur:', e.message);
  process.exit(1);
});
