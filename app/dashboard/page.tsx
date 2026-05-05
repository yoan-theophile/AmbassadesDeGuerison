'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Copy, Home, LogOut, Share2,
  MessageSquare, Send, ExternalLink, Play, UserCheck, UserX, Camera,
  Calendar, Loader2, ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import Dropzone from '@/components/ui/Dropzone';
import StatusTimeline from '@/components/dashboard/StatusTimeline';
import MissionDuMoment from '@/components/dashboard/MissionDuMoment';
import MesInfosSection from '@/app/dashboard/MesInfosSection';

const LIVE_WINDOW_HOURS = parseInt(process.env.NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS ?? '4');
import Link from 'next/link';
import { ONBOARDING } from '@/config/onboarding';
import { buildVideoUrl } from '@/lib/youtube';

interface HostProfile {
  id: string;
  first_name: string;
  city: string;
  country: string;
  status: string;
  email: string;
  profile_photo_url: string | null;
  room_photo_urls: string[] | null;
  address_private: string | null;
  consignes: string | null;
  phone: string | null;
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
  visitor_phone: string | null;
  visitor_message: string;
  nb_personnes: number | null;
  status: string;
  created_at: string;
  action_token: string;
  host_activation_id: string | null;
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
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialsSentCount, setTestimonialsSentCount] = useState(0);
  const [testimonialError, setTestimonialError] = useState('');

  // Accept/decline loading state
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

  // Photos upload
  const [photoUploading, setPhotoUploading] = useState<'profile' | 'room' | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [photoSignedUrls, setPhotoSignedUrls] = useState<Record<string, string>>({});
  const [showPhotosEdit, setShowPhotosEdit] = useState(false);

  // Formation (masquée par défaut pour les validés)
  const [showFormation, setShowFormation] = useState(false);

  // Gate onboarding (vidéo + PDF + accept) — uniquement pour pending_review
  const [videoStarted, setVideoStarted] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  // Event courant — uniquement dans la fenêtre live (±LIVE_WINDOW_HOURS autour de event_date)
  const [currentEvent, setCurrentEvent] = useState<{ id: string; live_link: string | null } | null>(null);

  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/auth'); return; }

    const { data: prof } = await supabase
      .from('host_profiles')
      .select('id, first_name, city, country, status, email, profile_photo_url, room_photo_urls, address_private, consignes, phone, quartier')
      .eq('user_id', user.id)
      .single();

    if (!prof) { router.replace('/auth'); return; }

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
          .select('id, visitor_first_name, visitor_email, visitor_phone, visitor_message, nb_personnes, status, created_at, action_token, host_activation_id')
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
      .maybeSingle();

    const event = activeEvent ? { id: activeEvent.id, live_link: activeEvent.live_link ?? null } : null;

    if (event) {
      const { data: approved } = await supabase
        .from('live_signals')
        .select('id')
        .eq('host_profile_id', prof.id)
        .eq('event_id', event.id)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();
      if (approved) setApprovedLiveLink(event.live_link);
    }

    setProfile(prof);
    setActivations((acts as unknown as Activation[]) ?? []);
    setContactRequests(reqs ?? []);
    setCurrentEvent(event);

    const paths = [prof.profile_photo_url, ...(prof.room_photo_urls ?? [])].filter(Boolean) as string[];
    if (paths.length > 0) {
      const entries = await Promise.all(
        paths.map(async (p) => {
          if (p.startsWith('http')) return [p, p] as const;
          const { data } = await supabase.storage.from('ambassador-photos').createSignedUrl(p, 900);
          return [p, data?.signedUrl ?? ''] as const;
        })
      );
      setPhotoSignedUrls(Object.fromEntries(entries.filter(([, url]) => url)));
    }

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
        .maybeSingle();
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

  // Détection du clic dans l'iframe YouTube — débloque la checkbox d'engagement
  useEffect(() => {
    if (profile?.status !== 'pending_review') return;
    function onBlur() {
      if (document.activeElement instanceof HTMLIFrameElement) {
        setVideoStarted(true);
      }
    }
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [profile?.status]);

  async function handleOnboardingComplete() {
    if (!onboardingChecked || onboardingSubmitting) return;
    setOnboardingSubmitting(true);
    setOnboardingError('');

    const res = await fetch('/api/onboarding/complete', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setOnboardingError(data.error ?? 'Une erreur est survenue. Réessayez.');
      setOnboardingSubmitting(false);
      return;
    }

    await load();
    setOnboardingSubmitting(false);
  }

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

  async function uploadPhoto(file: File, type: 'profile' | 'room') {
    setPhotoUploading(type);
    setPhotoError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    const res = await fetch('/api/upload/ambassador-photo', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      setPhotoError(data.error ?? 'Erreur lors de l\'upload.');
    } else {
      const { path, url } = data;
      setProfile((prev) => {
        if (!prev) return prev;
        if (type === 'profile') return { ...prev, profile_photo_url: path };
        return { ...prev, room_photo_urls: [...(prev.room_photo_urls ?? []), path] };
      });
      if (path && url) {
        setPhotoSignedUrls((prev) => ({ ...prev, [path]: url }));
      }
    }
    setPhotoUploading(null);
  }

  function removeRoomPhoto(url: string) {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, room_photo_urls: (prev.room_photo_urls ?? []).filter((u) => u !== url) };
    });
  }

  async function handleContactAction(token: string, action: 'accept' | 'decline') {
    setRequestActionLoading(token);
    const res = await fetch(`/api/visit-requests/${token}/${action}`, { method: 'POST' });
    if (res.ok) {
      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      setContactRequests((prev) =>
        prev.map((r) => (r.action_token === token ? { ...r, status: newStatus } : r))
      );
    }
    setRequestActionLoading(null);
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

  if (!profile) return null;

  const isValidated = profile.status === 'validated';
  const isOnboarding = ['pending_review', 'pre_approved', 'enrichment_pending'].includes(profile.status);

  const statusLabels: Record<string, string> = {
    pending_review:     'Candidature en cours',
    pre_approved:       'Conditions acceptées',
    enrichment_pending: 'En attente de validation',
    validated:          'Actif',
    suspended:          'Suspendu',
    rejected:           'Refusé',
    pending_onboarding: 'Inscription à finaliser',
  };
  const statusColors: Record<string, string> = {
    pending_review:     'bg-amber-50 text-amber-700',
    pre_approved:       'bg-blue-50 text-blue-700',
    enrichment_pending: 'bg-purple-50 text-purple-700',
    validated:          'bg-emerald-50 text-emerald-700',
    suspended:          'bg-red-50 text-red-700',
    rejected:           'bg-slate-100 text-slate-500',
    pending_onboarding: 'bg-amber-50 text-amber-700',
  };

  const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
    pending:               { label: 'En attente',  cls: 'bg-amber-50 text-amber-700'    },
    accepted:              { label: 'Acceptée',    cls: 'bg-emerald-50 text-emerald-700' },
    declined:              { label: 'Refusée',     cls: 'bg-red-50 text-red-700'         },
    cancelled_no_response: { label: 'Expirée',     cls: 'bg-slate-100 text-slate-500'    },
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

        {/* ─── PARCOURS EN COURS D'ONBOARDING ─── */}
        {isOnboarding && (
          <>
            {/* Stepper parcours — uniquement pour les non-validés */}
            <StatusTimeline status={profile.status} />

            {/* Encart candidature reçue — gate self-service vidéo + PDF + CGU */}
            {profile.status === 'pending_review' && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Bienvenue, {profile.first_name} !</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Pour rejoindre les Ambassades de Guérison, regarde la vidéo de formation ci-dessous,
                      télécharge le guide pratique, puis valide ton engagement pour débloquer le questionnaire.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Encart conditions acceptées — CTA questionnaire */}
            {profile.status === 'pre_approved' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Conditions acceptées</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Il reste une dernière étape avant de rejoindre la carte des ambassadeurs :
                      compléter ton profil enrichi pour que David puisse mieux te connaître.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/questionnaire"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Compléter mon profil →
                </Link>
              </div>
            )}

            {/* Encart enrichissement en attente */}
            {profile.status === 'enrichment_pending' && (
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Ton dossier est en cours d&apos;examen</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Merci d&apos;avoir complété ton profil. L&apos;équipe te contactera prochainement pour la validation finale.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Formation — visible en onboarding */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <Play className="w-4 h-4 text-indigo-500" />
                <h2 className="font-semibold text-slate-800 text-sm">Formation ambassadeur</h2>
              </div>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={buildVideoUrl(onboardingConfig.video_url)}
                  title="Formation ambassadeur — David Théry"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>

            {/* Gate onboarding — PDF + checkbox + bouton, uniquement pending_review */}
            {profile.status === 'pending_review' && (
              <>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Guide pratique de l&apos;ambassade</p>
                      <p className="text-slate-500 text-xs mt-0.5">Informations pratiques pour accueillir lors des lives</p>
                    </div>
                    <a
                      href={onboardingConfig.pdf_url}
                      download
                      className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-indigo-100 transition-colors shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                  {!videoStarted && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                      Regardez la vidéo ci-dessus pour débloquer cette étape.
                    </p>
                  )}
                  <label className={`flex items-start gap-3 ${videoStarted ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={onboardingChecked}
                        onChange={(e) => setOnboardingChecked(e.target.checked)}
                        disabled={!videoStarted}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                    <span className="text-sm text-slate-700">
                      J&apos;ai regardé la vidéo de formation et je m&apos;engage à accueillir les participants
                      dans l&apos;esprit de la charte des Ambassades de Guérison.
                    </span>
                  </label>

                  {onboardingError && (
                    <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{onboardingError}</p>
                  )}

                  <button
                    onClick={handleOnboardingComplete}
                    disabled={!onboardingChecked || onboardingSubmitting}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {onboardingSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Activation…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Activer mon onboarding
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ─── AMBASSADEUR VALIDÉ ─── */}
        {isValidated && (
          <>
            {/* Mission du moment — carte contextuelle (priorité décroissante) */}
            <MissionDuMoment
              currentEvent={currentEvent}
              approvedLiveLink={approvedLiveLink}
              signalSent={signalSent}
              signalDescription={signalDescription}
              signalLoading={signalLoading}
              onDescriptionChange={setSignalDescription}
              onSendSignal={sendLiveSignal}
              contactRequests={contactRequests}
              activations={activations}
            />

            {/* Mes lives */}
            {activations.length > 0 && (
              <section>
                <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Mes lives</h2>
                <div className="space-y-3">
                  {activations.map((a) => {
                    const ev = a.events;
                    const dateLabel = ev?.event_date
                      ? new Date(ev.event_date).toLocaleDateString('fr-FR', {
                          weekday: 'long', day: 'numeric', month: 'long',
                        })
                      : null;
                    const timeLabel = ev?.event_date
                      ? new Date(ev.event_date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit', minute: '2-digit',
                        })
                      : null;

                    return (
                      <div key={a.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 text-sm">
                              {ev?.title ?? `Live ${a.event_id.slice(0, 8)}`}
                            </p>
                            {dateLabel && (
                              <p className="text-slate-400 text-xs mt-0.5 capitalize">
                                {dateLabel}{timeLabel ? ` à ${timeLabel}` : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        {a.is_full ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 px-3 py-1.5 bg-slate-100 rounded-lg">
                              Votre ambassade est complète
                            </span>
                          </div>
                        ) : a.is_active ? (
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Vous participez à ce live
                            </span>
                            <button
                              onClick={() => toggleActivation(a.id, a.is_active)}
                              className="text-xs text-slate-400 hover:text-red-500 transition-colors underline-offset-2 hover:underline"
                            >
                              Annuler ma participation
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleActivation(a.id, a.is_active)}
                            className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
                          >
                            Je participe à ce live
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Mes demandes — remonté */}
            <section>
              <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Mes demandes</h2>
              {contactRequests.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune demande pour l&apos;instant.</p>
              ) : (
                <div className="space-y-3">
                  {contactRequests.map((r) => {
                    const s = REQUEST_STATUS[r.status] ?? { label: r.status, cls: 'bg-slate-100 text-slate-500' };
                    const isPending = r.status === 'pending';
                    const isActioning = requestActionLoading === r.action_token;
                    const liveTitle = r.host_activation_id
                      ? activations.find((a) => a.id === r.host_activation_id)?.events?.title
                      : null;
                    return (
                      <div key={r.id} className={`bg-white rounded-xl border p-4 shadow-sm ${r.status === 'declined' ? 'opacity-60' : 'border-slate-100'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 text-sm">{r.visitor_first_name}</p>
                            {liveTitle && (
                              <p className="text-indigo-600 text-xs mt-0.5">Pour le live : {liveTitle}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${s.cls}`}>
                            {s.label}
                          </span>
                        </div>

                        <div className="space-y-0.5 mb-2">
                          <p className="text-slate-500 text-xs">{r.visitor_email}</p>
                          {r.visitor_phone && (
                            <p className="text-slate-500 text-xs">Tél : {r.visitor_phone}</p>
                          )}
                          {r.nb_personnes && (
                            <p className="text-slate-500 text-xs">{r.nb_personnes} personne{r.nb_personnes > 1 ? 's' : ''}</p>
                          )}
                        </div>

                        {r.visitor_message && (
                          <p className="text-slate-600 text-sm italic mb-2">&quot;{r.visitor_message}&quot;</p>
                        )}

                        <p className="text-slate-400 text-xs mb-3">{relativeTime(r.created_at)}</p>

                        {isPending && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleContactAction(r.action_token, 'accept')}
                              disabled={isActioning}
                              className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-colors font-medium"
                            >
                              {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                              Accepter
                            </button>
                            <button
                              onClick={() => handleContactAction(r.action_token, 'decline')}
                              disabled={isActioning}
                              className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-colors font-medium"
                            >
                              {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Témoignage — visible pendant un live */}
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
                    Comment s&apos;est passé le live chez vous ?
                  </label>
                  <textarea
                    value={testimonialContent}
                    onChange={(e) => setTestimonialContent(e.target.value)}
                    rows={4}
                    placeholder="Partagez ce que vous avez vécu pendant ce live…"
                    className={inputCls}
                  />
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

            {/* Mon ambassade — partage */}
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

            {/* Photos — pendant enrichissement ou si l'ambassadeur veut modifier */}
            {(profile.status === 'enrichment_pending' || showPhotosEdit) && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-500" />
                  <h2 className="font-semibold text-slate-800 text-sm">Photos de votre ambassade</h2>
                </div>

                {photoError && (
                  <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{photoError}</p>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Photo de profil</p>
                  {photoUploading === 'profile' ? (
                    <div className="flex items-center justify-center h-32 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <Dropzone
                      onFile={(f) => uploadPhoto(f, 'profile')}
                      preview={profile.profile_photo_url ? (photoSignedUrls[profile.profile_photo_url] ?? null) : null}
                      onRemove={profile.profile_photo_url ? () => setProfile((p) => p ? { ...p, profile_photo_url: null } : p) : undefined}
                      label="Photo de profil — privée, vue uniquement par David pour valider votre ambassade"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Photos de la salle
                    <span className="font-normal text-slate-400 normal-case ml-1">({(profile.room_photo_urls ?? []).length}/5)</span>
                  </p>
                  {(profile.room_photo_urls ?? []).length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {(profile.room_photo_urls ?? []).map((path) => (
                        <div key={path} className="relative group rounded-lg overflow-hidden border border-slate-100">
                          <img src={photoSignedUrls[path] ?? ''} alt="Salle" className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => removeRoomPhoto(path)}
                            className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 shadow text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(profile.room_photo_urls ?? []).length < 5 && (
                    photoUploading === 'room' ? (
                      <div className="flex items-center justify-center h-24 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <Dropzone
                        onFile={(f) => uploadPhoto(f, 'room')}
                        label="Ajouter une photo de la salle de réunion"
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Modifier mes photos — bouton discret pour les ambassadeurs validés */}
            {!showPhotosEdit && (
              <button
                onClick={() => setShowPhotosEdit(true)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <Camera className="w-3 h-3" />
                Modifier mes photos
              </button>
            )}

            {/* Mes informations */}
            <MesInfosSection profile={profile} />

            {/* Formation — en bas, collapsée par défaut */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowFormation((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-800 text-sm">Formation ambassadeur</span>
                </div>
                {showFormation
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />
                }
              </button>
              {showFormation && (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={buildVideoUrl(onboardingConfig.video_url)}
                    title="Formation ambassadeur — David Théry"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </main>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return rtf.format(-mins, 'minute');
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(diff / 86_400_000);
  return rtf.format(-days, 'day');
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
