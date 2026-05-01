import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import VisitRequestForm from './VisitRequestForm';

interface Props {
  params: Promise<{ event_id: string; host_id: string }>;
}

export default async function VisitRequestPage({ params }: Props) {
  const { event_id, host_id } = await params;
  const supabase = createServiceClient();

  const [{ data: event }, { data: host }, { data: activation }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, event_date')
      .eq('id', event_id)
      .maybeSingle(),
    supabase
      .from('host_profiles')
      .select('id, first_name, city, country, capacity, contact_mode, consignes')
      .eq('id', host_id)
      .eq('status', 'validated')
      .maybeSingle(),
    supabase
      .from('host_activations')
      .select('is_active, is_full, capacity')
      .eq('host_profile_id', host_id)
      .eq('event_id', event_id)
      .maybeSingle(),
  ]);

  if (!event || !host) notFound();

  const isAvailable = activation?.is_active && !activation?.is_full;

  const eventDate = new Date(event.event_date).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <AppHeader />
      <main className="bg-slate-50 px-4 py-5 flex-1">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Live · {eventDate}</p>
            <h1 className="text-lg font-semibold text-slate-800 mb-0.5">
              Ambassade de {host.first_name}
            </h1>
            <p className="text-slate-500 text-sm">{host.city}, {host.country}</p>
          </div>

          {host.consignes && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Infos pratiques</p>
              <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{host.consignes}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            {isAvailable ? (
              <>
                <p className="text-sm font-medium text-slate-800 mb-4">Rejoindre cette ambassade</p>
                <VisitRequestForm
                  eventId={event_id}
                  hostProfileId={host_id}
                  hostName={host.first_name}
                  contactMode={host.contact_mode}
                />
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm">
                  {!activation?.is_active
                    ? 'Cette ambassade n'accueille pas pour ce live.'
                    : 'Cette ambassade est complète pour ce live.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
