'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, UserCircle } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import PhoneInput from '@/components/ui/PhoneInput';
import { createClient } from '@/lib/supabase/browser';

// Espace visiteur minimal (Phase 2bis) — pas un espace visiteur complet
// (Phase 5, fermée sine die : pas de "mes demandes", pas de dashboard).
// Seul but : confirmer la connexion et permettre de mettre à jour le
// téléphone réutilisé automatiquement sur la prochaine demande de visite.
export default function MonEspacePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/auth'); return; }

    const res = await fetch('/api/visitor/profile');
    if (!res.ok) { router.replace('/'); return; }
    const data = await res.json();
    setEmail(data.email ?? user.email ?? '');
    setPhone((data.phone ?? '').replace(/\s+/g, ''));
    if (data.photo_url) {
      const { data: signed } = await supabase.storage.from('visitor-photos').createSignedUrl(data.photo_url, 900);
      setPhotoUrl(signed?.signedUrl ?? null);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/visitor/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Une erreur est survenue.');
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) {
    return (
      <>
        <AppHeader />
        <main className="flex-1 flex items-center justify-center bg-slate-50">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à la carte
          </Link>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <UserCircle className="w-5 h-5 text-indigo-500" />
              )}
              <h1 className="font-semibold text-slate-800 text-sm">Mon espace</h1>
            </div>
            <p className="text-sm text-slate-500">
              Connecté avec <span className="font-medium text-slate-700">{email}</span>. Ton téléphone sera pré-rempli automatiquement sur ta prochaine demande de visite.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <PhoneInput
                label="Téléphone"
                id="visitor-phone"
                value={phone}
                onChange={setPhone}
              />

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              {saved && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Informations enregistrées !
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </button>
            </form>

            <button
              onClick={handleLogout}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
