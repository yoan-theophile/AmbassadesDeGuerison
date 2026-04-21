/**
 * Seed script — DavidTheryApp
 * Utilise l'API REST Supabase (service_role) pour bypasser RLS et seeder la base
 */
const fs = require('fs');
const path = require('path');

// Charger .env.local manuellement
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
}

const BASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!BASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function req(method, path, body) {
  const url = `${BASE_URL}/rest/v1${path}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function del(path) {
  const url = `${BASE_URL}/rest/v1${path}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) { const t = await res.text(); console.log(`  · DELETE ${path} → ${t.slice(0, 80)}`); }
}

async function run() {
  console.log('🌱 Démarrage du seed DavidTheryApp...');
  console.log(`   URL: ${BASE_URL}`);

  // ---- Nettoyage ----
  console.log('\n→ Nettoyage...');
  await del('/live_signals?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/contact_requests?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/testimonials?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/host_activations?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/host_profiles?id=neq.00000000-0000-0000-0000-000000000000');
  await del('/events?id=neq.00000000-0000-0000-0000-000000000000');
  console.log('  ✓ Tables vidées');

  // ---- Events ----
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

  // ---- Hôtes ----
  console.log('\n→ Ambassadeurs...');
  // Utilise les valeurs des contraintes CHECK du schéma DB réel :
  // host_type IN ('individual', 'church')
  // contact_mode IN ('public', 'form', 'approval')
  // status IN ('pending_onboarding', 'onboarding_complete', 'pending_charter', 'active', 'suspended')
  const hostsData = [
    { first_name: 'Marie', email: 'marie.dubois@demo.fr', city: 'Paris', country: 'France',
      host_type: 'individual', contact_mode: 'form',
      address_private: '12 rue de la Paix, 75001 Paris',
      consignes: "Sonner à l'interphone \"Dubois\". Ascenseur disponible. Parking Opéra à 200m.",
      lat: 48.8698, lng: 2.3315, status: 'active' },

    { first_name: 'Jean-Pierre', email: 'jp.martin@demo.fr', city: 'Lyon', country: 'France',
      host_type: 'church', contact_mode: 'public',
      address_private: '5 place Bellecour, 69002 Lyon',
      consignes: 'Entrée principale sur la place. Grande salle au premier étage. Accessible PMR.',
      whatsapp_group_url: 'https://chat.whatsapp.com/DemoGroupLyon123',
      lat: 45.7578, lng: 4.8320, status: 'active' },

    { first_name: 'Fatou', email: 'fatou.diallo@demo.fr', city: 'Bruxelles', country: 'Belgique',
      host_type: 'individual', contact_mode: 'approval',
      address_private: 'Avenue Louise 54, 1050 Bruxelles',
      consignes: 'Salle communautaire au rez-de-chaussée. Pas de parking sur place.',
      lat: 50.8503, lng: 4.3517, status: 'active' },

    { first_name: 'Samuel', email: 'samuel.eko@demo.fr', city: 'Montréal', country: 'Canada',
      host_type: 'individual', contact_mode: 'public',
      address_private: '1420 rue Sherbrooke O, Montréal, QC H3G 1K4',
      consignes: 'Appartement 4B. Buzzer : SAMUEL. Métro Guy-Concordia à 5 min.',
      lat: 45.5017, lng: -73.5673, status: 'active' },

    { first_name: 'Claire', email: 'claire.bernard@demo.fr', city: 'Genève', country: 'Suisse',
      host_type: 'individual', contact_mode: 'form',
      address_private: 'Rue du Rhône 10, 1204 Genève',
      consignes: 'Digicode : 4521. 3ème étage, porte droite.',
      lat: 46.2044, lng: 6.1432, status: 'active' },

    { first_name: 'Kofi', email: 'kofi.asante@demo.fr', city: 'Abidjan', country: "Côte d'Ivoire",
      host_type: 'church', contact_mode: 'public',
      address_private: 'Carrefour Anono, Cocody, Abidjan',
      consignes: "Temple évangélique Lumière. Grande salle climatisée.",
      lat: 5.3600, lng: -4.0083, status: 'active' },

    { first_name: 'Sophie', email: 'sophie.leroux@demo.fr', city: 'Bordeaux', country: 'France',
      host_type: 'individual', contact_mode: 'form',
      address_private: "8 cours de l'Intendance, 33000 Bordeaux",
      consignes: null, lat: 44.8378, lng: -0.5792,
      status: 'pending_onboarding' }, // pas visible sur la carte
  ];

  const hostIds = {};
  for (const h of hostsData) {
    try {
      const [row] = await req('POST', '/host_profiles', h);
      hostIds[h.email] = row.id;
      console.log(`  ✓ ${h.first_name} (${h.city}, ${h.status})`);
    } catch (e) {
      console.log(`  ✗ ${h.first_name}: ${e.message.slice(0, 100)}`);
    }
  }

  // ---- Activations (event passé) ----
  console.log('\n→ Activations event passé...');
  const activeHosts = hostsData.filter(h => h.status === 'active' || h.status === 'onboarding_complete');
  for (const h of activeHosts) {
    const hid = hostIds[h.email];
    if (!hid) continue;
    const capacities = { Marie: 15, 'Jean-Pierre': 80, Fatou: 40, Samuel: 12, Claire: 8, Kofi: 120, Sophie: 10 };
    const cap = capacities[h.first_name] ?? 10;
    const isFull = h.first_name === 'Jean-Pierre';
    const accepted = isFull ? cap : Math.floor(cap * 0.6);
    try {
      await req('POST', '/host_activations', {
        host_profile_id: hid,
        event_id: evtPasse.id,
        is_active: true,
        is_full: isFull,
        capacity: cap,
        accepted_count: accepted,
      });
      console.log(`  ✓ ${h.first_name} — ${accepted}/${cap} places${isFull ? ' (COMPLET)' : ''}`);
    } catch (e) {
      console.log(`  ✗ ${h.first_name}: ${e.message.slice(0, 100)}`);
    }
  }

  // ---- Activations (event futur) — déclenché par trigger normalement ----
  // Le trigger fn_auto_activate_hosts_for_event s'est déclenché à l'insertion de l'event.
  // Mais les host_profiles ont été insérés APRÈS. On crée manuellement.
  console.log('\n→ Activations event futur...');
  for (const h of activeHosts) {
    const hid = hostIds[h.email];
    if (!hid) continue;
    const capF = { Marie: 15, 'Jean-Pierre': 80, Fatou: 40, Samuel: 12, Claire: 8, Kofi: 120, Sophie: 10 };
    try {
      await req('POST', '/host_activations', {
        host_profile_id: hid,
        event_id: evtFutur.id,
        is_active: true,
        is_full: false,
        capacity: capF[h.first_name] ?? 10,
        accepted_count: 0,
      });
      console.log(`  ✓ ${h.first_name} activé pour ${evtFutur.title.slice(0, 30)}...`);
    } catch (e) {
      // Peut déjà exister si le trigger a fonctionné
      console.log(`  · ${h.first_name}: ${e.message.slice(0, 80)}`);
    }
  }

  // ---- Demandes de contact ----
  console.log('\n→ Demandes de contact...');

  // Récupérer les activation IDs pour l'event passé
  const activations = await req('GET', `/host_activations?event_id=eq.${evtPasse.id}&is_active=eq.true&select=id,host_profile_id`);

  const findAct = (email) => activations.find(a => a.host_profile_id === hostIds[email]);

  const contactData = [
    { act: findAct('marie.dubois@demo.fr'), first: 'Pierre', email: 'pierre.v@mail.com',
      msg: 'Bonjour, je serai avec ma femme. Est-il possible de venir à deux ?', status: 'accepted' },
    { act: findAct('marie.dubois@demo.fr'), first: 'Nathalie', email: 'nathalie.m@mail.com',
      msg: null, status: 'pending' },
    { act: findAct('jp.martin@demo.fr'), first: 'Ahmed', email: 'ahmed.k@mail.com',
      msg: 'Merci pour cette initiative, je viens seul.', status: 'accepted' },
    { act: findAct('fatou.diallo@demo.fr'), first: 'Laure', email: 'laure.s@mail.com',
      msg: null, status: 'declined' },
    { act: findAct('samuel.eko@demo.fr'), first: 'Emmanuel', email: 'emmanuel.b@mail.com',
      msg: "J'habite à 10 minutes, avec plaisir !", status: 'accepted' },
  ];

  for (const c of contactData) {
    if (!c.act) { console.log(`  · Activation manquante pour ${c.first}`); continue; }
    try {
      await req('POST', '/contact_requests', {
        host_activation_id: c.act.id,
        visitor_first_name: c.first,
        visitor_email: c.email,
        visitor_message: c.msg,
        status: c.status,
      });
      console.log(`  ✓ ${c.first} (${c.status})`);
    } catch (e) {
      console.log(`  ✗ ${c.first}: ${e.message.slice(0, 100)}`);
    }
  }

  // ---- Témoignages ----
  console.log('\n→ Témoignages...');
  const temoignages = [
    { email: 'marie.dubois@demo.fr', timing: 'after',
      content: "Ce live a été un moment de grâce extraordinaire. Nous étions 12 réunis dans la paix et la joie. Le message de David a touché nos cœurs. Merci !" },
    { email: 'jp.martin@demo.fr', timing: 'during',
      content: "Notre église a accueilli plus de 60 personnes pour ce live. Une atmosphère de ferveur et d'unité. Nous recommencerons avec joie au prochain live." },
    { email: 'samuel.eko@demo.fr', timing: 'after',
      content: "Magnifique soirée ! La connexion entre les ambassades à travers le monde donne un sens profond à cette expérience de communauté." },
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
      console.log(`  ✗ ${e.message.slice(0, 100)}`);
    }
  }

  // ---- Résumé ----
  console.log('\n📊 Résumé :');
  const tables = ['events', 'host_profiles', 'host_activations', 'contact_requests', 'testimonials'];
  for (const t of tables) {
    const res = await fetch(`${BASE_URL}/rest/v1/${t}?select=id`, {
      headers: { ...headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' },
    });
    const range = res.headers.get('content-range') ?? '?/?';
    const total = range.split('/')[1] ?? '?';
    console.log(`  ${t} : ${total} lignes`);
  }

  console.log('\n✅ Seed terminé !');
  console.log('\n   Démarrer l\'app : npm run dev → http://localhost:3000');
}

run().catch(e => { console.error('\n❌ Erreur:', e.message); process.exit(1); });
