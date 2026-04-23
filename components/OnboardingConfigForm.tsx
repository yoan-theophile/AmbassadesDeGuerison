'use client';

import { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

interface Config {
  video_url: string;
  pdf_url: string;
}

interface Props {
  initialConfig: Config;
}

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white';

export default function OnboardingConfigForm({ initialConfig }: Props) {
  const [videoUrl, setVideoUrl] = useState(initialConfig.video_url);
  const [pdfUrl,   setPdfUrl]   = useState(initialConfig.pdf_url);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    const res = await fetch('/api/admin/settings/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl, pdf_url: pdfUrl }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error ?? 'Une erreur est survenue.');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-medium text-slate-800 text-sm mb-5">Onboarding ambassadeurs</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              URL vidéo YouTube (format embed)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/VIDEO_ID"
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">
              Remplacer <code className="font-mono">VIDEO_ID</code> par l'identifiant de la vidéo YouTube.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Lien vers le PDF guide
            </label>
            <input
              type="text"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">
              Lien Google Drive, Dropbox, ou tout autre lien public vers le PDF.
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Enregistré !
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
