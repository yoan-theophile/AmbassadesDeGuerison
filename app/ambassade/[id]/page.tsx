import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ContactForm from './ContactForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AmbassadePage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: host, error } = await supabase
    .from('host_profiles_public')
    .select('id, first_name, city, country, type, capacity, contact_mode, consignes, whatsapp_group_url')
    .eq('id', id)
    .single();

  if (error || !host) notFound();

  const typeLabels: Record<string, string> = {
    domicile: 'Domicile',
    salle: 'Salle communautaire',
    eglise: 'Église / lieu de culte',
    autre: "Lieu d'accueil",
  };

  const contactLabels: Record<string, string> = {
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    telephone: 'Téléphone',
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-lg mx-auto">
        <a href="/" className="text-indigo-600 text-sm hover:underline mb-6 block">
          ← Retour à la carte
        </a>

        <div className="bg-indigo-50 rounded-2xl p-6 mb-6">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Ambassade de {host.first_name}
          </h1>
          <p className="text-gray-600">
            {host.city}, {host.country}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-white text-indigo-700 text-xs px-3 py-1 rounded-full border border-indigo-200">
              {typeLabels[host.type] ?? host.type}
            </span>
            <span className="bg-white text-indigo-700 text-xs px-3 py-1 rounded-full border border-indigo-200">
              Jusqu'à {host.capacity} personnes
            </span>
            <span className="bg-white text-indigo-700 text-xs px-3 py-1 rounded-full border border-indigo-200">
              Contact : {contactLabels[host.contact_mode] ?? host.contact_mode}
            </span>
          </div>
        </div>

        {host.consignes && (
          <div className="border border-gray-100 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-1">Informations pratiques</p>
            <p className="text-gray-600 text-sm whitespace-pre-line">{host.consignes}</p>
          </div>
        )}

        {host.whatsapp_group_url && (
          <a
            href={host.whatsapp_group_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-green-500 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-green-600 mb-6"
          >
            Rejoindre le groupe WhatsApp
          </a>
        )}

        <div className="border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Demander à rejoindre</h2>
          <ContactForm hostProfileId={host.id} hostName={host.first_name} />
        </div>
      </div>
    </main>
  );
}
