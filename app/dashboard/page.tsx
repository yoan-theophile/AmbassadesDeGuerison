'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Home, LogOut, Radio } from 'lucide-react';
import Link from 'next/link';

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
  visitor_first_name: string;
  visitor_email: string;
  visitor_message: string;
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
        .select('id, visitor_first_name, visitor_email, visitor_message, status, created_at, action_token')
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
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          Chargement…
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Aucun profil ambassadeur trouvé pour ce compte.</p>
          <Link href="/inscription" className="text-indigo-600 underline text-sm">S'inscrire</Link>
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
    pending: 'bg-amber-50 text-amber-700',
    active: 'bg-emerald-50 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-500',
    rejected: 'bg-red-50 text-red-700',
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm hidden sm:block">Ambassades de Guérison</span>
        </Link>
        <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Bonjour, {profile.first_name}</h1>
            <p className="text-slate-500 text-sm">{profile.city}, {profile.country}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[profile.status] ?? 'bg-slate-100'}`}>
            {statusLabels[profile.status] ?? profile.status}
          </span>
        </div>

        {profile.status === 'active' && (
          <div className="bg-indigo-600 text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-indigo-300" />
              <p className="font-semibold">Signal de présence</p>
            </div>
            <p className="text-indigo-200 text-sm mb-4 ml-6">
              Indiquez que vous êtes présent pendant le live en cours.
            </p>
            <button
              onClick={sendModule7Signal}
              disabled={signalLoading || signalSent}
              className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-2 rounded-full text-sm font-medium disabled:opacity-60 hover:bg-indigo-50 transition-colors"
            >
              {signalSent ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Signal envoyé !</>
              ) : signalLoading ? 'Envoi…' : 'Je suis présent'}
            </button>
          </div>
        )}

        {activations.length > 0 && (
          <section>
            <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Mes lives</h2>
            <div className="space-y-3">
              {activations.map((a) => {
                const ev = a.events;
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {ev?.title ?? `Live ${a.event_id.slice(0, 8)}`}
                        </p>
                        {ev?.event_date && (
                          <p className="text-slate-400 text-xs mt-0.5">
                            {new Date(ev.event_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <Toggle
                            value={a.is_active}
                            onChange={() => toggleActivation(a.id, a.is_active)}
                          />
                          {a.is_active ? "J'accueille" : 'Inactif'}
                        </label>
                        {a.is_active && (
                          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
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
          <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Demandes de contact</h2>
          {contactRequests.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune demande pour l'instant.</p>
          ) : (
            <div className="space-y-3">
              {contactRequests.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{r.visitor_first_name}</p>
                      <p className="text-slate-500 text-xs">{r.visitor_email}</p>
                      {r.visitor_message && (
                        <p className="text-slate-600 text-sm mt-1 italic">"{r.visitor_message}"</p>
                      )}
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full shrink-0 font-medium ${
                        r.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.status === 'declined'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
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
        value ? 'bg-indigo-600' : 'bg-slate-200'
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
