'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, Home, MapPin, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface WaitState {
  status: 'waiting';
  seconds_remaining: number;
  host_first_name: string | null;
  consignes: string | null;
}

interface ReadyState {
  status: 'ready';
  seconds_remaining: 0;
  host_first_name: string | null;
  consignes: string | null;
  already_acknowledged: boolean;
}

interface AddressData {
  address: string | null;
  whatsapp: string | null;
  consignes: string | null;
  host_first_name: string | null;
  event_id: string | null;
  contact_request_id: string | null;
}

type Step = 'loading' | 'waiting' | 'consignes' | 'address' | 'error';

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  if (m > 0) return `${m} min`;
  return 'quelques secondes';
}

export default function AccueilInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>('loading');
  const [waitData, setWaitData] = useState<WaitState | null>(null);
  const [consignesData, setConsignesData] = useState<ReadyState | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Témoignage visiteur
  const [testimonialContent, setTestimonialContent] = useState('');
  const [testimonialName, setTestimonialName] = useState('');
  const [testimonialSent, setTestimonialSent] = useState(false);
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/contact-requests/${token}/acknowledge`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) { setErrorMsg(d.error ?? 'Lien invalide ou expiré.'); setStep('error'); return; }
        if (d.status === 'waiting') {
          setWaitData(d as WaitState);
          setStep('waiting');
        } else {
          const ready = d as ReadyState;
          setConsignesData(ready);
          if (ready.already_acknowledged) {
            await acknowledge();
          } else {
            setStep('consignes');
          }
        }
      })
      .catch(() => { setErrorMsg('Erreur réseau.'); setStep('error'); });
  }, [token]);

  // Décompte toutes les 30s pour rafraîchir l'état
  useEffect(() => {
    if (step !== 'waiting') return;
    const id = setInterval(async () => {
      const r = await fetch(`/api/contact-requests/${token}/acknowledge`).catch(() => null);
      if (!r?.ok) return;
      const d = await r.json();
      if (d.status === 'ready') {
        setConsignesData(d as ReadyState);
        setStep('consignes');
      } else {
        setWaitData(d as WaitState);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [step, token]);

  async function submitTestimonial() {
    if (!testimonialContent.trim() || !address?.contact_request_id || !address?.event_id) return;
    setTestimonialSubmitting(true);
    try {
      await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_request_id: address.contact_request_id,
          visitor_name: testimonialName.trim() || null,
          event_id: address.event_id,
          timing: 'after',
          content: testimonialContent.trim(),
        }),
      });
      setTestimonialSent(true);
    } catch { /* silencieux */ }
    setTestimonialSubmitting(false);
  }

  async function acknowledge() {
    setSubmitting(true);
    const res = await fetch(`/api/contact-requests/${token}/acknowledge`, { method: 'POST' });
    const d = await res.json();
    if (!res.ok) { setErrorMsg(d.error ?? 'Erreur inattendue.'); setStep('error'); setSubmitting(false); return; }
    setAddress(d as AddressData);
    setStep('address');
    setSubmitting(false);
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          Chargement…
        </div>
      </main>
    );
  }

  if (step === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-2">Lien invalide ou expiré</h1>
          <p className="text-slate-500 text-sm mb-1">{errorMsg}</p>
          <p className="text-slate-400 text-xs mt-3">Ce lien est valable 7 jours.</p>
          <Link href="/" className="mt-5 inline-block text-xs text-indigo-600 hover:underline">Retour à la carte</Link>
        </div>
      </main>
    );
  }

  if (step === 'waiting' && waitData) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4 text-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-indigo-500" />
            </div>
            <h1 className="text-lg font-semibold text-slate-800 mb-1">
              Votre place est réservée chez {waitData.host_first_name}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              L'adresse sera disponible dans <strong className="text-slate-700">{formatCountdown(waitData.seconds_remaining)}</strong>.
            </p>
            <p className="text-slate-400 text-xs mt-3">
              Cette page se met à jour automatiquement. Vous recevrez aussi l'adresse par e-mail.
            </p>
          </div>

          {waitData.consignes && (
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide mb-2">
                En attendant — consignes de {waitData.host_first_name}
              </p>
              <p className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed">{waitData.consignes}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (step === 'consignes' && consignesData) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-800 mb-1">
              Bienvenue chez {consignesData.host_first_name}
            </h1>
            <p className="text-slate-500 text-sm">
              Lisez les informations ci-dessous avant de recevoir l'adresse.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Règles générales</p>
            <ul className="text-sm text-slate-600 space-y-2">
              {[
                "Soyez ponctuel — le live commence à l'heure indiquée",
                'Respectez le lieu et les autres participants',
                'Cette adresse est personnelle — ne la partagez pas',
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {consignesData.consignes && (
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5 mb-5">
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide mb-2">
                Consignes de {consignesData.host_first_name}
              </p>
              <p className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed">{consignesData.consignes}</p>
            </div>
          )}

          <button
            onClick={acknowledge}
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Chargement…' : "J'ai bien pris note — Voir l'adresse"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Adresse de l'ambassade</h1>
            <p className="text-slate-500 text-xs">Chez {address?.host_first_name}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Adresse
          </p>
          <p className="font-semibold text-slate-800">
            {address?.address ?? "Non renseignée — contactez l'hôte"}
          </p>
        </div>

        {address?.whatsapp && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Groupe WhatsApp</p>
            <a
              href={address.whatsapp}
              className="text-emerald-600 font-medium text-sm hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rejoindre le groupe
            </a>
          </div>
        )}

        {address?.consignes && (
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
            <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide mb-2">
              Consignes de {address.host_first_name}
            </p>
            <p className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed">{address.consignes}</p>
          </div>
        )}

        {/* Formulaire témoignage visiteur */}
        <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <p className="text-sm font-medium text-slate-700">Partagez votre témoignage</p>
          </div>

          {testimonialSent ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Merci ! Votre témoignage sera publié après validation.
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={testimonialContent}
                onChange={(e) => setTestimonialContent(e.target.value)}
                placeholder="Qu'est-ce que Dieu a fait lors de ce live ? (guérison, délivrance, conversion…)"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <input
                type="text"
                value={testimonialName}
                onChange={(e) => setTestimonialName(e.target.value)}
                placeholder="Votre prénom (optionnel)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={submitTestimonial}
                disabled={testimonialSubmitting || !testimonialContent.trim()}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {testimonialSubmitting ? 'Envoi…' : 'Envoyer mon témoignage'}
              </button>
            </div>
          )}
        </div>

        <Link href="/" className="mt-5 inline-block text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Retour à la carte
        </Link>
      </div>
    </main>
  );
}
