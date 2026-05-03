'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type DevState = 'live' | 'live-zero' | 'soon' | 'soon-confirmed' | 'upcoming' | 'upcoming-confirmed' | 'past' | 'closed' | 'blank';

const QUICK_EMAILS = [
  'david.thery@demo.fr',
  'theo.nelson.ia@gmail.com',
  'marie.dubois@demo.fr',
];

const STATE_LABELS: Record<DevState, string> = {
  live: '🔴 Live',
  'live-zero': '🔴 Live (0 confirm.)',
  soon: '⏱ Soon 3j',
  'soon-confirmed': '⏱ Soon 3j ✓ pins',
  upcoming: '📅 Upcoming',
  'upcoming-confirmed': '📅 Upcoming ✓ pins',
  past: '⏪ Past',
  closed: '🔚 Closed',
  blank: '🫙 Blank 0 confirm.',
};

export default function DevOverlay() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentState, setCurrentState] = useState<DevState | null>(null);
  const [stateLoading, setStateLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [stateError, setStateError] = useState('');

  const applyState = useCallback(
    async (state: DevState) => {
      setStateLoading(true);
      setStateError('');
      try {
        const res = await fetch('/api/dev/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setStateError(body.error ?? `Erreur ${res.status}`);
          return;
        }
        setCurrentState(state);
        router.refresh();
      } catch {
        setStateError('Erreur réseau.');
      } finally {
        setStateLoading(false);
      }
    },
    [router],
  );

  const generateLink = useCallback(async () => {
    if (!email) return;
    setLinkLoading(true);
    setLink('');
    setLinkError('');
    try {
      const res = await fetch('/api/dev/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) {
        setLinkError(body.error ?? `Erreur ${res.status}`);
        return;
      }
      setLink(body.link);
    } catch {
      setLinkError('Erreur réseau.');
    } finally {
      setLinkLoading(false);
    }
  }, [email]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-black/80 px-3 py-2 text-white shadow-lg hover:bg-black"
          title="Ouvrir le panneau dev"
        >
          <span className="rounded bg-red-600 px-1 py-0.5 text-[10px] font-bold leading-none">
            DEV
          </span>
          <span>🔧</span>
        </button>
      ) : (
        <div className="w-72 rounded-lg bg-black/90 p-3 text-white shadow-2xl ring-1 ring-white/10">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-600 px-1 py-0.5 text-[10px] font-bold leading-none">
                DEV
              </span>
              <span className="text-white/70">DevOverlay</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* État */}
          <section className="mb-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40">
              État de l&apos;app
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(STATE_LABELS) as DevState[]).map((s) => (
                <button
                  key={s}
                  onClick={() => applyState(s)}
                  disabled={stateLoading}
                  className={[
                    'rounded px-2 py-1.5 text-left transition-colors',
                    currentState === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20',
                    stateLoading ? 'opacity-50 cursor-not-allowed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {STATE_LABELS[s]}
                </button>
              ))}
            </div>
            {stateLoading && (
              <p className="mt-1 text-[10px] text-white/40">Modification en cours…</p>
            )}
            {stateError && (
              <p className="mt-1 text-[10px] text-red-400">{stateError}</p>
            )}
            {currentState && !stateLoading && (
              <p className="mt-1 text-[10px] text-green-400">
                → État {currentState} actif. Rafraîchissez si nécessaire.
              </p>
            )}
          </section>

          <div className="mb-3 border-t border-white/10" />

          {/* Magic Link */}
          <section>
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40">
              Magic Link
            </div>
            {/* Boutons rapides */}
            <div className="mb-2 flex flex-wrap gap-1">
              {QUICK_EMAILS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setEmail(e);
                    setLink('');
                    setLinkError('');
                  }}
                  className="rounded bg-white/10 px-1.5 py-0.5 text-white/70 hover:bg-white/20 hover:text-white"
                >
                  {e.split('@')[0]}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLink('');
                  setLinkError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && generateLink()}
                placeholder="email@demo.fr"
                className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1.5 text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={generateLink}
                disabled={!email || linkLoading}
                className="rounded bg-indigo-600 px-2 py-1.5 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {linkLoading ? '…' : '→'}
              </button>
            </div>
            {linkError && (
              <p className="mt-1 text-[10px] text-red-400">{linkError}</p>
            )}
            {link && (
              <div className="mt-2 rounded bg-white/5 p-2">
                <p className="mb-1.5 break-all text-[10px] text-green-400 leading-relaxed">
                  {link.slice(0, 60)}…
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(link)}
                    className="flex-1 rounded bg-white/10 py-1 text-white/70 hover:bg-white/20"
                  >
                    Copier
                  </button>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded bg-green-700 py-1 text-center text-white hover:bg-green-600"
                  >
                    Ouvrir →
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
