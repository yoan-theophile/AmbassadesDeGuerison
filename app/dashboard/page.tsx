'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

interface HostProfile {
  id: string;
  first_name: string;
  city: string;
  country: string;
  status: string;
  email: string;
}

interface Activation {
  id: string;
  is_active: boolean;
  is_full: boolean;
  event_id: string;
  events: { title: string; event_date: string } | null;
}

interface ContactRequest {
  id: string;
  visitor_name: string;
  visitor_email: string;
  message: string;
  status: string;
  created_at: string;
  action_token: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [signalSent, setSignalSent] = useState(false);
  const [signalLoading, setSignalLoading] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const [{ data: prof }, { data: acts }, { data: reqs }] = await Promise.all([
      supabase.from('host_profiles').select('id, first_name, city, country, status, email').eq('user_id', user.id).single(),
      supabase
        .from('host_activations')
        .select('id, is_active, is_full, event_id, events(title, event_date)')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('contact_requests')
        .select('id, visitor_name, visitor_email, message, status, created_at, action_token')
        .eq('host_profile_id', (await supabase.from('host_profiles').select('id').eq('user_id', user.id).single()).data?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setProfile(prof);
    setActivations((acts as unknown as Activation[]) ?? []);
    setContactRequests(reqs ?? []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { load(); }, [load]);

  async function toggleActivation(id: string, currentValue: boolean) {
    await fetch(`/api/host-activations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentValue }),
    });
    setActivations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !currentValue } : a))
    );
  }

  async function toggleFull(id: string, currentValue: boolean) {
    await fetch(`/api/host-activations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_full: !currentValue }),
    });
    setActivations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_full: !currentValue } : a))
    );
  }

  async function sendModule7Signal() {
    setSignalLoading(true);
    await fetch('/api/live-signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'module7', host_profile_id: profile?.id }),
    });
    setSignalSent(true);
    setSignalLoading(false);
    setTimeout(() => setSignalSent(false), 10000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Chargement…</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Aucun profil ambassadeur trouvé pour ce compte.</p>
          <a href="/inscription" className="text-indigo-600 underline text-sm">S'inscrire</a>
        </div>
      </main>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: 'En attente de validation',
    active: 'Actif',
    inactive: 'Inactif',
    rejected: 'Refusé',
  };
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bonjour, {profile.first_name}</h1>
            <p className="text-gray-500 text-sm">{profile.city}, {profile.country}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[profile.status] ?? 'bg-gray-100'}`}>
              {statusLabels[profile.status] ?? profile.status}
            </span>
            <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-600">
              Déconnexion
            </button>
          </div>
        </div>

        {profile.status === 'active' && (
          <div className="bg-indigo-600 text-white rounded-2xl p-5">
            <p className="font-semibold mb-1">Module 7 — Signal de présence</p>
            <p className="text-indigo-200 text-sm mb-4">
              Envoyez un signal pour indiquer que vous êtes présent pendant le live en cours.
            </p>
            <button
              onClick={sendModule7Signal}
              disabled={signalLoading || signalSent}
              className="bg-white text-indigo-700 px-5 py-2 rounded-full text-sm font-medium disabled:opacity-60"
            >
              {signalSent ? '✓ Signal envoyé !' : signalLoading ? 'Envoi…' : 'Je suis présent'}
            </button>
          </div>
        )}

        {activations.length > 0 && (
          <section>
            <h2 className="font-semibold text-gray-800 mb-3">Mes lives</h2>
            <div className="space-y-3">
              {activations.map((a) => {
                const ev = a.events;
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {ev?.title ?? `Live ${a.event_id.slice(0, 8)}`}
                        </p>
                        {ev?.event_date && (
                          <p className="text-gray-400 text-xs mt-0.5">
                            {new Date(ev.event_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <Toggle
                            value={a.is_active}
                            onChange={() => toggleActivation(a.id, a.is_active)}
                          />
                          {a.is_active ? "J'accueille" : 'Inactif'}
                        </label>
                        {a.is_active && (
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <Toggle
                              value={a.is_full}
                              onChange={() => toggleFull(a.id, a.is_full)}
                            />
                            Complet
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold text-gray-800 mb-3">Demandes de contact</h2>
          {contactRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune demande pour l'instant.</p>
          ) : (
            <div className="space-y-3">
              {contactRequests.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{r.visitor_name}</p>
                      <p className="text-gray-500 text-xs">{r.visitor_email}</p>
                      {r.message && (
                        <p className="text-gray-600 text-sm mt-1 italic">"{r.message}"</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                        r.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : r.status === 'declined'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {r.status === 'accepted' ? 'Acceptée' : r.status === 'declined' ? 'Refusée' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
        value ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
