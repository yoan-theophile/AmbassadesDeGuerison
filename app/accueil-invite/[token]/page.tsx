'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ConsignesData {
  host_first_name: string;
  consignes: string | null;
  already_acknowledged: boolean;
}

interface AddressData {
  address: string | null;
  whatsapp: string | null;
  consignes: string | null;
  host_first_name: string | null;
}

export default function AccueilInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<'loading' | 'consignes' | 'address' | 'error'>('loading');
  const [consignes, setConsignes] = useState<ConsignesData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadConsignes() {
      const res = await fetch(`/api/contact-requests/${token}/acknowledge`);
      if (!res.ok) {
        const { error } = await res.json();
        setErrorMsg(error ?? 'Lien invalide ou expiré.');
        setStep('error');
        return;
      }
      const data: ConsignesData = await res.json();
      setConsignes(data);
      if (data.already_acknowledged) {
        // Déjà lu — on redemande l'adresse directement
        await acknowledge();
      } else {
        setStep('consignes');
      }
    }
    loadConsignes();
  }, [token]);

  async function acknowledge() {
    const res = await fetch(`/api/contact-requests/${token}/acknowledge`, { method: 'POST' });
    if (!res.ok) {
      const { error } = await res.json();
      setErrorMsg(error ?? 'Erreur inattendue.');
      setStep('error');
      return;
    }
    const data: AddressData = await res.json();
    setAddress(data);
    setStep('address');
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement…</p>
      </main>
    );
  }

  if (step === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide ou expiré</h1>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
          <p className="text-gray-400 text-xs mt-4">
            Si vous avez reçu ce lien par email, il est valable 7 jours. Contactez l'organisateur si le problème persiste.
          </p>
        </div>
      </main>
    );
  }

  if (step === 'consignes') {
    return (
      <main className="min-h-screen bg-indigo-50 px-4 py-10">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">
            Bienvenue chez {consignes?.host_first_name} 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Votre demande a été acceptée. Avant de recevoir l'adresse, veuillez lire les informations ci-dessous.
          </p>

          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-2">Informations générales</h2>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Soyez ponctuel — le live commence à l'heure indiquée</li>
              <li>Respectez le lieu d'accueil et les autres participants</li>
              <li>Cette adresse est personnelle — ne la partagez pas publiquement</li>
            </ul>
          </div>

          {consignes?.consignes && (
            <div className="bg-indigo-100 rounded-xl p-5 mb-6">
              <h2 className="font-semibold text-indigo-900 mb-2">
                Consignes de {consignes.host_first_name}
              </h2>
              <p className="text-sm text-indigo-800 whitespace-pre-wrap">{consignes.consignes}</p>
            </div>
          )}

          <button
            onClick={acknowledge}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors"
          >
            J'ai bien pris note → Voir l'adresse
          </button>
        </div>
      </main>
    );
  }

  // step === 'address'
  return (
    <main className="min-h-screen bg-green-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏠</div>
          <h1 className="text-2xl font-bold text-green-900">
            Adresse de l'ambassade
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Adresse</h2>
          <p className="font-semibold text-gray-800 text-lg">
            {address?.address ?? "Non renseignée — contactez l'hôte"}
          </p>
        </div>

        {address?.whatsapp && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <h2 className="text-sm font-medium text-gray-500 mb-1">WhatsApp</h2>
            <a
              href={`https://wa.me/${address.whatsapp.replace(/\D/g, '')}`}
              className="text-green-600 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {address.whatsapp}
            </a>
          </div>
        )}

        {address?.consignes && (
          <div className="bg-green-100 rounded-xl p-5">
            <h2 className="font-semibold text-green-900 mb-2">Consignes de {address.host_first_name}</h2>
            <p className="text-sm text-green-800 whitespace-pre-wrap">{address.consignes}</p>
          </div>
        )}
      </div>
    </main>
  );
}
