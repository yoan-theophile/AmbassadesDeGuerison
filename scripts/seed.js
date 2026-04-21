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

async function del(endpoint) {
  const res = await fetch(`${BASE_URL}/rest/v1${endpoint}`, { method: 'DELETE', headers });
  if (!res.ok) {
    const t = await res.text();
    console.log(`  · DELETE ${endpoint} → ${t.slice(0, 100)}`);
  }
}

async function run() {
  console.log('🌱 Seed DavidTheryApp');
  console.log(`   ${BASE_URL}\n`);

  // ── Nettoyage ────────────────────────────────────────────────────────────
  console.log('→ Nettoyage...');
  await del('/live_signals?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/contact_requests?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/testimonials?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/host_activations?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/host_profiles?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/events?id=neq.00000000-0000-0000-0000-000000000000');
  console.log('  ✓ Tables vidées\n');

  // ── Hôtes ────────────────────────────────────────────────────────────────
  // On insère les hôtes EN PREMIER (avant les events), comme ça le trigger
  // fn_auto_activate_hosts_for_event aura des hôtes actifs à activer.
  console.log('→ Ambassadeurs...');
  const hostsData = [
    {
      first_name: 'Marie', email: 'marie.dubois@demo.fr',
      city: 'Paris', country: 'France',
      host_type: 'individual', contact_mode: 'form', capacity: 15,
      address_private: '12 rue de la Paix, 75001 Paris',
      consignes: 'Sonner à l\'interphone "Dubois". Ascenseur disponible. Parking Opéra à 200m.',
      lat: 48.8698, lng: 2.3315, status: 'active',
    },
    {
      first_name: 'Jean-Pierre', email: 'jp.martin@demo.fr',
      city: 'Lyon', country: 'France',
      host_type: 'church', contact_mode: 'public', capacity: 80,
      address_private: '5 place Bellecour, 69002 Lyon',
      consignes: 'Entrée principale sur la place. Grande salle au premier étage. Accessible PMR.',
      whatsapp_group_url: 'https://chat.whatsapp.com/DemoGroupLyon123',
      lat: 45.7578, lng: 4.8320, status: 'active',
    },
    {
      first_name: 'Fatou', email: 'fatou.diallo@demo.fr',
      city: 'Bruxelles', country: 'Belgique',
      host_type: 'individual', contact_mode: 'approval', capacity: 40,
      address_private: 'Avenue Louise 54, 1050 Bruxelles',
      consignes: 'Salle communautaire au rez-de-chaussée. Pas de parking sur place.',
      lat: 50.8503, lng: 4.3517, status: 'active',
    },
    {
      first_name: 'Samuel', email: 'samuel.eko@demo.fr',
      city: 'Montréal', country: 'Canada',
      host_type: 'individual', contact_mode: 'public', capacity: 12,
      address_private: '1420 rue Sherbrooke O, Montréal, QC H3G 1K4',
      consignes: 'Appartement 4B. Buzzer : SAMUEL. Métro Guy-Concordia à 5 min.',
      lat: 45.5017, lng: -73.5673, status: 'active',
    },
    {
      first_name: 'Claire', email: 'claire.bernard@demo.fr',
      city: 'Genève', country: 'Suisse',
      host_type: 'individual', contact_mode: 'form', capacity: 8,
      address_private: 'Rue du Rhône 10, 1204 Genève',
      consignes: 'Digicode : 4521. 3ème étage, porte droite.',
      lat: 46.2044, lng: 6.1432, status: 'active',
    },
    {
      first_name: 'Kofi', email: 'kofi.asante@demo.fr',
      city: 'Abidjan', country: "Côte d'Ivoire",
      host_type: 'church', contact_mode: 'public', capacity: 120,
      address_private: 'Carrefour Anono, Cocody, Abidjan',
      consignes: 'Temple évangélique Lumière. Grande salle climatisée.',
      lat: 5.3600, lng: -4.0083, status: 'active',
    },
    {
      first_name: 'Sophie', email: 'sophie.leroux@demo.fr',
      city: 'Bordeaux', country: 'France',
      host_type: 'individual', contact_mode: 'form', capacity: 10,
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
      console.log(`  ✓ ${h.first_name} (${h.city}, cap ${h.capacity}, ${h.status})`);
    } catch (e) {
      console.log(`  ✗ ${h.first_name}: ${e.message.slice(0, 120)}`);
    }
  }

  const activeHosts = hostsData.filter(h => h.status === 'active');

  // ── Events ───────────────────────────────────────────────────────────────
  // Insérés APRÈS les hôtes → le trigger active automatiquement les hôtes actifs
  // avec leur vraie capacité (trigger corrigé dans reset-db.sql).
  console.log('\n→ Événements...');
  const now = new Date();

  const [evtPasse] = await req('POST', '/events', {
    title: 'Live Guérison #14 — Brisez les chaînes',
    description: 'Live de prière et de guérison animé par David Thery. Diffusé depuis Paris.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    event_date: new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString(),
  });
  console.log(`  ✓ Event passé : ${evtPasse.title}`);

  const [evtFutur] = await req('POST', '/events', {
    title: "Live Guérison #15 — La puissance de l'Amour",
    description: "Rejoignez David Thery pour une soirée de prière collective depuis votre ambassade locale.",
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    live_link: 'https://youtube.com/live/example15',
    event_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  });
  console.log(`  ✓ Event futur  : ${evtFutur.title}`);

  // ── Activations event passé (manuel — le trigger n'est actif que sur INSERT) ──
  // Le trigger a créé des activations pour l'event futur avec la bonne capacité.
  // Pour l'event passé (il y a 21 jours), on crée les activations manuellement
  // avec les comptages réels simulés.
  console.log('\n→ Activations event passé (manuel)...');
  const passedAccepted = { Marie: 9, 'Jean-Pierre': 80, Fatou: 24, Samuel: 7, Claire: 4, Kofi: 72 };

  for (const h of activeHosts) {
    const hid = hostIds[h.email];
    if (!hid) continue;
    const accepted = passedAccepted[h.first_name] ?? 0;
    const isFull = accepted >= h.capacity;
    try {
      await req('POST', '/host_activations', {
        host_profile_id: hid,
        event_id: evtPasse.id,
        is_active: true,
        is_full: isFull,
        capacity: h.capacity,
        accepted_count: accepted,
      });
      console.log(`  ✓ ${h.first_name} — ${accepted}/${h.capacity}${isFull ? ' (COMPLET)' : ''}`);
    } catch (e) {
      console.log(`  ✗ ${h.first_name}: ${e.message.slice(0, 120)}`);
    }
  }

  // ── Vérification activations event futur (créées par le trigger) ─────────
  console.log('\n→ Vérification activations event futur (trigger)...');
  const futureActs = await req('GET', `/host_activations?event_id=eq.${evtFutur.id}&select=host_profile_id,capacity,accepted_count`);
  if (futureActs && futureActs.length > 0) {
    for (const act of futureActs) {
      const host = hostsData.find(h => hostIds[h.email] === act.host_profile_id);
      if (host) console.log(`  ✓ ${host.first_name} — 0/${act.capacity}`);
    }
  } else {
    console.log('  ⚠ Aucune activation créée par le trigger (schema non réinitialisé ?)');
    console.log('    → Exécuter scripts/reset-db.sql puis relancer ce script.');
  }

  // ── Demandes de contact ───────────────────────────────────────────────────
  console.log('\n→ Demandes de contact...');
  const activationsPasse = await req('GET',
    `/host_activations?event_id=eq.${evtPasse.id}&is_active=eq.true&select=id,host_profile_id`
  );
  const findAct = email => activationsPasse.find(a => a.host_profile_id === hostIds[email]);

  const contactData = [
    { email: 'marie.dubois@demo.fr', first: 'Pierre',    msg: 'Je serai avec ma femme, nous sommes deux.', status: 'accepted' },
    { email: 'marie.dubois@demo.fr', first: 'Nathalie',  msg: null, status: 'pending' },
    { email: 'jp.martin@demo.fr',    first: 'Ahmed',     msg: 'Merci pour cette initiative, je viens seul.', status: 'accepted' },
    { email: 'fatou.diallo@demo.fr', first: 'Laure',     msg: null, status: 'declined' },
    { email: 'samuel.eko@demo.fr',   first: 'Emmanuel',  msg: "J'habite à 10 minutes, avec plaisir !", status: 'accepted' },
  ];

  for (const c of contactData) {
    const act = findAct(c.email);
    if (!act) { console.log(`  · Activation manquante pour ${c.first}`); continue; }
    try {
      await req('POST', '/contact_requests', {
        host_activation_id: act.id,
        visitor_first_name: c.first,
        visitor_email: `${c.first.toLowerCase()}.demo@mail.com`,
        visitor_message: c.msg,
        status: c.status,
      });
      console.log(`  ✓ ${c.first} → ${c.email.split('.')[0]} (${c.status})`);
    } catch (e) {
      console.log(`  ✗ ${c.first}: ${e.message.slice(0, 120)}`);
    }
  }

  // ── Témoignages ───────────────────────────────────────────────────────────
  console.log('\n→ Témoignages...');
  const temoignages = [
    {
      email: 'marie.dubois@demo.fr', timing: 'after',
      content: "Ce live a été un moment de grâce extraordinaire. Nous étions 12 réunis dans la paix et la joie. Le message de David a touché nos cœurs. Merci !",
    },
    {
      email: 'jp.martin@demo.fr', timing: 'during',
      content: "Notre église a accueilli plus de 60 personnes pour ce live. Une atmosphère de ferveur et d'unité. Nous recommencerons avec joie au prochain live.",
    },
    {
      email: 'samuel.eko@demo.fr', timing: 'after',
      content: "Magnifique soirée ! La connexion entre les ambassades à travers le monde donne un sens profond à cette expérience de communauté.",
    },
  ];

  for (const t of temoignages) {
    const hid = hostIds[t.email];
    if (!hid) continue;
    try {
      await req('POST', '/testimonials', {
        host_profile_id: hid,
        event_id: evtPasse.id,
        content: t.content,
        timing: t.timing,
        is_visible: true,
      });
      console.log(`  ✓ Témoignage de ${t.email.split('.')[0]}`);
    } catch (e) {
      console.log(`  ✗ ${e.message.slice(0, 120)}`);
    }
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n📊 Résumé :');
  const tables = ['events', 'host_profiles', 'host_activations', 'contact_requests', 'testimonials'];
  for (const t of tables) {
    const res = await fetch(`${BASE_URL}/rest/v1/${t}?select=id`, {
      headers: { ...headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' },
    });
    const total = (res.headers.get('content-range') ?? '?/?').split('/')[1] ?? '?';
    console.log(`  ${t.padEnd(20)} ${total} lignes`);
  }

  console.log('\n✅ Seed terminé ! → npm run dev → http://localhost:3000');
}

run().catch(e => {
  console.error('\n❌ Erreur:', e.message);
  process.exit(1);
});
