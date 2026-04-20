'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">Vérifiez votre messagerie</h1>
          <p className="text-gray-600">
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Cliquez dessus pour accéder à votre espace.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900">Espace ambassadeur</h1>
          <p className="text-gray-500 text-sm mt-1">Connexion par lien magique</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Envoi en cours…' : 'Recevoir le lien de connexion'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Pas encore ambassadeur ?{' '}
          <a href="/inscription" className="text-indigo-600 hover:underline">
            S'inscrire
          </a>
        </p>
      </div>
    </main>
  );
}
