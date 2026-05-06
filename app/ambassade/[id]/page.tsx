import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ContactForm from './ContactForm';
import AppHeader from '@/components/AppHeader';
import { Home, Users, MessageCircle, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AmbassadePage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: host, error } = await supabase
    .from('host_profiles')
    .select('id, first_name, city, country, quartier, host_type, capacity, contact_mode, consignes, whatsapp_group_url')
    .eq('id', id)
    .eq('status', 'validated')
    .single();

  if (error || !host) notFound();

  // Cherche le live actif dont la fenêtre d'inscription est ouverte
  const now = new Date().toISOString();
  const { data: activations } = await supabase
    .from('host_activations')
    .select('event_id, is_active, is_full, events!inner(event_date, registration_closes_at)')
    .eq('host_profile_id', host.id)
    .eq('is_active', true)
    .eq('is_full', false)
    .order('events(event_date)', { ascending: true });

  // Priorité : inscriptions encore ouvertes (registration_closes_at >= now)
  const activation = activations?.find((a) => {
    const ev = (a as any).events;
    const closes = ev?.registration_closes_at ?? ev?.event_date;
    return closes && closes >= now;
  }) ?? null;

  const activeEventId = activation?.event_id ?? null;

  // Compatibilité : host_type (schéma DB) ou type (schéma migré)
  const hostType = (host as any).type ?? (host as any).host_type ?? 'autre';

  const typeLabels: Record<string, string> = {
    domicile: 'Lieu de prière à domicile',
    salle: 'Salle communautaire',
    eglise: 'Lieu de prière en église',
    autre: "Lieu d'accueil",
    individual: 'Lieu de prière à domicile',
    church: 'Lieu de prière en église',
  };

  const contactLabels: Record<string, string> = {
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    telephone: 'Téléphone',
    public: 'Contact direct',
    form: 'Formulaire',
    approval: 'Sur approbation',
  };

  return (
    <>
      <AppHeader />
      <main className="bg-slate-50 px-4 py-5 flex-1">
      <div className="max-w-lg mx-auto">

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Ambassade de {host.first_name}
              </h1>
              <p className="text-slate-500 text-sm">{host.city}, {host.country}</p>
              {host.quartier && (
                <p className="text-slate-400 text-xs mt-0.5">{host.quartier}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
              {typeLabels[hostType] ?? hostType}
            </span>
            {host.capacity && (
              <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
                <Users className="w-3.5 h-3.5" />
                {host.capacity} places
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
              <MessageCircle className="w-3.5 h-3.5" />
              {contactLabels[host.contact_mode] ?? host.contact_mode}
            </span>
          </div>
        </div>

        {host.consignes && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Informations pratiques</p>
            <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{host.consignes}</p>
          </div>
        )}

        {host.whatsapp_group_url && (
          <a
            href={host.whatsapp_group_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-emerald-700 mb-4 transition-colors"
          >
            Rejoindre le groupe WhatsApp
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-medium text-slate-800 mb-4">Demander à rejoindre</p>
          <ContactForm hostProfileId={host.id} hostName={host.first_name} contactMode={host.contact_mode} eventId={activeEventId} />
        </div>
      </div>
    </main>
    </>
  );
}
