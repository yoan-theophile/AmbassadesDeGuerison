'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Copy, Home, LogOut, Radio, Share2,
  MessageSquare, Send, ExternalLink, Play,
} from 'lucide-react';

const LIVE_WINDOW_HOURS = parseInt(process.env.NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS ?? '4');
import Link from 'next/link';
import { ONBOARDING } from '@/config/onboarding';

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
  visitor_whatsapp: string | null;
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

  const [onboardingConfig, setOnboardingConfig] = useState({
    video_url: ONBOARDING.VIDEO_URL,
    pdf_url:   ONBOARDING.PDF_PATH,
  });

  // Live signal
  const [signalDescription, setSignalDescription] = useState('');
  const [signalSent, setSignalSent] = useState(false);
  const [signalLoading, setSignalLoading] = useState(false);
  const [approvedLiveLink, setApprovedLiveLink] = useState<string | null>(null);

  // Share ambassade
  const [linkCopied, setLinkCopied] = useState(false);

  // Testimonial
  const [testimonialContent, setTestimonialContent] = useState('');
  const [testimonialTiming, setTestimonialTiming] = useState<'during' | 'after'>('after');
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialsSentCount, setTestimonialsSentCount] = useState(0);
  const [testimonialError, setTestimonialError] = useState('');

  // Event courant — uniquement dans la fenêtre live (±LIVE_WINDOW_HOURS autour de event_date)
  const [currentEvent, setCurrentEvent] = useState<{ id: string; live_link: string | null } | null>(null);

  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/auth'); return; }

    const { data: prof } = await supabase
      .from('host_profiles')
      .select('id, first_name, city, country, status, email')
      .eq('user_id', user.id)
      .single();

    if (!prof) { router.replace('/inscription'); return; }
    if (prof.status === 'pending_onboarding') { router.replace('/onboarding'); return; }

    const { data: acts } = await supabase
      .from('host_activations')
      .select('id, is_active, is_full, event_id, events(title, event_date)')
      .eq('host_profile_id', prof.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const activationIds = (acts ?? []).map((a) => a.id);
    const { data: reqs } = activationIds.length > 0
      ? await supabase
          .from('contact_requests')
          .select('id, visitor_first_name, visitor_email, visitor_whatsapp, visitor_message, status, created_at, action_token')
          .in('host_activation_id', activationIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : { data: [] };

    const windowMs = LIVE_WINDOW_HOURS * 60 * 60 * 1000;
    const now = new Date();
    const { data: activeEvent } = await supabase
      .from('events')
      .select('id, live_link')
      .gte('event_date', new Date(now.getTime() - windowMs).toISOString())
      .lte('event_date', new Date(now.getTime() + windowMs).toISOString())
      .order('event_date', { ascending: false })
      .limit(1)
      .single();

    const event = activeEvent ? { id: activeEvent.id, live_link: activeEvent.live_link ?? null } : null;

    // Vérifie si un signal de cet ambassadeur a déjà été approuvé pour ce live
    if (event) {
      const { data: approved } = await supabase
        .from('live_signals')
        .select('id')
        .eq('host_profile_id', prof.id)
        .eq('event_id', event.id)
        .eq('status', 'approved')
        .limit(1)
        .single();
      if (approved) setApprovedLiveLink(event.live_link);
    }

    setProfile(prof);
    setActivations((acts as unknown as Activation[]) ?? []);
    setContactRequests(reqs ?? []);
    setCurrentEvent(event);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { load(); }, [load]);

  // Poll toutes les 5s pour détecter l'approbation de David quand un signal est en attente
  useEffect(() => {
    if (!signalSent || !profile || !currentEvent) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('live_signals')
        .select('id')
        .eq('host_profile_id', profile.id)
        .eq('event_id', currentEvent.id)
        .eq('status', 'approved')
        .limit(1)
        .single();
      if (data) {
        setApprovedLiveLink(currentEvent.live_link);
        setSignalSent(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [signalSent, profile, currentEvent, supabase]);

  useEffect(() => {
    fetch('/api/onboarding/config')
      .then((r) => r.json())
      .then((d) => setOnboardingConfig({ video_url: d.video_url, pdf_url: d.pdf_url }))
      .catch(() => {});
  }, []);


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

  async function sendLiveSignal() {
    if (!signalDescription.trim() || !profile || !currentEvent) return;
    setSignalLoading(true);
    await fetch('/api/live-signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host_profile_id: profile.id,
        event_id: currentEvent.id,
        description: signalDescription.trim(),
      }),
    });
    setSignalSent(true);
    setSignalDescription('');
    setSignalLoading(false);
  }

  async function copyAmbassadeLink() {
    if (!profile) return;
    const url = `${window.location.origin}/ambassade/${profile.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* fallback ignored */ }
  }

  function shareOnWhatsApp() {
    if (!profile) return;
    const url = `${window.location.origin}/ambassade/${profile.id}`;
    const text = encodeURIComponent(
      `Je suis ambassadeur des lives de guérison avec David Théry 🙏\nRejoignez-nous à ${profile.city} !\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  async function submitTestimonial() {
    if (!testimonialContent.trim() || !profile || !currentEvent) return;
    setTestimonialSubmitting(true);
    setTestimonialError('');
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_profile_id: profile.id,
          event_id: currentEvent.id,
          timing: testimonialTiming,
          content: testimonialContent.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setTestimonialError(d.error ?? 'Erreur lors de l\'envoi.');
      } else {
        setTestimonialsSentCount((n) => n + 1);
        setTestimonialContent('');
      }
    } catch {
      setTestimonialError('Erreur réseau.');
    }
    setTestimonialSubmitting(false);
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

  const statusLabels: Record<string, string> = {
    pending_onboarding: 'Inscription à finaliser',
    active: 'Actif',
    suspended: 'Suspendu',
  };
  const statusColors: Record<string, string> = {
    pending_onboarding: 'bg-amber-50 text-amber-700',
    active: 'bg-emerald-50 text-emerald-700',
    suspended: 'bg-red-50 text-red-700',
  };

  const ambassadeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ambassade/${profile.id}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm hidden sm:block">Ambassades de Guérison</span>
        </Link>
        <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Bonjour, {profile.first_name}</h1>
            <p className="text-slate-500 text-sm">{profile.city}, {profile.country}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[profile.status] ?? 'bg-slate-100 text-slate-600'}`}>
            {statusLabels[profile.status] ?? profile.status}
          </span>
        </div>

        {/* Formation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <Play className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Formation ambassadeur</h2>
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={onboardingConfig.video_url}
              title="Formation ambassadeur — David Théry"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>

        {/* [4] Partager mon ambassade */}
        {profile.status === 'active' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Votre ambassade</h2>
            </div>

            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-400 mb-0.5">Lien public</p>
              <p className="text-xs text-indigo-600 font-mono break-all">{ambassadeUrl}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyAmbassadeLink}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {linkCopied ? 'Copié !' : 'Copier le lien'}
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                WhatsApp
              </button>
            </div>

            <a
              href={`/ambassade/${profile.id}/badge`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Voir mon badge ambassade
            </a>
          </div>
        )}

        {/* Signal live — visible uniquement pendant la fenêtre du live (±LIVE_WINDOW_HOURS) */}
        {profile.status === 'active' && currentEvent && (
          approvedLiveLink ? (
            /* État 3 : David a accepté → afficher le lien */
            <div className="bg-emerald-600 text-white rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
                <p className="font-semibold">David vous invite à témoigner !</p>
              </div>
              <p className="text-emerald-100 text-sm">
                Rejoignez le live maintenant et partagez ce que Dieu a fait dans votre ambassade.
              </p>
              <a
                href={approvedLiveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Rejoindre le live
              </a>
            </div>
          ) : signalSent ? (
            /* État 2 : signal envoyé, en attente de l'approbation */
            <div className="bg-indigo-600 text-white rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" />
                <p className="font-semibold text-sm">Signal envoyé — en attente de David…</p>
              </div>
              <p className="text-indigo-200 text-sm">
                Si David vous accepte, le lien pour rejoindre le live apparaîtra ici automatiquement.
              </p>
            </div>
          ) : (
            /* État 1 : formulaire */
            <div className="bg-indigo-600 text-white rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-300" />
                <p className="font-semibold">Témoigner en live</p>
              </div>
              <p className="text-indigo-200 text-sm">
                Décrivez ce qui s'est passé dans votre ambassade — guérison, transformation, moment fort.
                David lira votre message et pourra vous inviter à partager en direct.
              </p>
              <textarea
                value={signalDescription}
                onChange={(e) => setSignalDescription(e.target.value)}
                rows={3}
                placeholder="Ex : Marie a été guérie d'une douleur chronique pendant la prière…"
                className="w-full bg-indigo-700 text-white placeholder-indigo-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
              <button
                onClick={sendLiveSignal}
                disabled={signalLoading || !signalDescription.trim()}
                className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-2 rounded-full text-sm font-medium disabled:opacity-60 hover:bg-indigo-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                {signalLoading ? 'Envoi…' : 'Lever la main pour témoigner'}
              </button>
            </div>
          )
        )}

        {/* Mes lives */}
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
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <Toggle value={a.is_active} onChange={() => toggleActivation(a.id, a.is_active)} />
                          {a.is_active ? "J'accueille" : 'Inactif'}
                        </label>
                        {a.is_active && (
                          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <Toggle value={a.is_full} onChange={() => toggleFull(a.id, a.is_full)} />
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

        {/* [5] Formulaire témoignage */}
        {currentEvent && (
          <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Partager un témoignage</h2>
            </div>

            {testimonialsSentCount > 0 && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {testimonialsSentCount} témoignage{testimonialsSentCount > 1 ? 's' : ''} envoyé{testimonialsSentCount > 1 ? 's' : ''} — merci !
              </div>
            )}

            <p className="text-slate-500 text-xs">
              Chaque personne de votre ambassade peut partager son témoignage. Soumissions multiples acceptées.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Comment s'est passé le live chez vous ?
              </label>
              <textarea
                value={testimonialContent}
                onChange={(e) => setTestimonialContent(e.target.value)}
                rows={4}
                placeholder="Partagez ce que vous avez vécu pendant ce live…"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Moment</label>
              <div className="flex gap-2">
                {(['during', 'after'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTestimonialTiming(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      testimonialTiming === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'during' ? 'Pendant le live' : 'Après le live'}
                  </button>
                ))}
              </div>
            </div>

            {testimonialError && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{testimonialError}</p>
            )}

            <button
              onClick={submitTestimonial}
              disabled={testimonialSubmitting || !testimonialContent.trim()}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {testimonialSubmitting ? 'Envoi…' : 'Envoyer le témoignage'}
            </button>
          </section>
        )}

        {/* Demandes de contact */}
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
                      {r.visitor_whatsapp && (
                        <p className="text-slate-500 text-xs">WhatsApp : {r.visitor_whatsapp}</p>
                      )}
                      {r.visitor_message && (
                        <p className="text-slate-600 text-sm mt-1 italic">"{r.visitor_message}"</p>
                      )}
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full shrink-0 font-medium ${
                        r.status === 'declined'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {r.status === 'declined' ? 'Refusée' : 'Confirmée'}
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
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
