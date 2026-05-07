import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import AccueillirClient from './AccueillirClient';
import { formatEventDateDual } from '@/lib/format-event-date';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function AccueillirPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: contact } = await supabase
    .from('contact_requests')
    .select(`
      id, status, visitor_first_name, nb_personnes, visitor_message,
      host_activations!inner(
        events!inner(title, event_date),
        host_profiles!inner(first_name)
      )
    `)
    .eq('action_token', token)
    .maybeSingle();

  if (!contact) notFound();

  const ha = Array.isArray(contact.host_activations) ? contact.host_activations[0] : contact.host_activations;
  const event = Array.isArray(ha?.events) ? ha.events[0] : ha?.events;
  const host = Array.isArray(ha?.host_profiles) ? ha.host_profiles[0] : ha?.host_profiles;

  const eventDate = event?.event_date ? formatEventDateDual(event.event_date) : '';

  return (
    <>
      <AppHeader />
      <main className="bg-slate-50 px-4 py-5 flex-1 flex items-center justify-center">
        <AccueillirClient
          token={token}
          status={contact.status}
          visitorName={contact.visitor_first_name}
          nbPersonnes={contact.nb_personnes}
          message={contact.visitor_message}
          hostName={host?.first_name ?? ''}
          eventTitle={event?.title ?? ''}
          eventDate={eventDate}
        />
      </main>
    </>
  );
}
