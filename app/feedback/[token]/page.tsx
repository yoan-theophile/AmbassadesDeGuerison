import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import FeedbackForm from './FeedbackForm';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function FeedbackPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  // Le token identifie un contact_request (visiteur → hôte) ou un host_activation (hôte → visiteur)
  const { data: contact } = await supabase
    .from('contact_requests')
    .select(`
      id, status, visitor_email, visitor_first_name,
      host_activations!inner(
        event_id,
        host_profile_id,
        events!inner(id, title, event_date),
        host_profiles!inner(first_name)
      )
    `)
    .eq('action_token', token)
    .maybeSingle();

  if (!contact || contact.status !== 'accepted') notFound();

  const ha = Array.isArray(contact.host_activations) ? contact.host_activations[0] : contact.host_activations;
  const event = Array.isArray(ha?.events) ? ha.events[0] : ha?.events;
  const host = Array.isArray(ha?.host_profiles) ? ha.host_profiles[0] : ha?.host_profiles;

  const eventDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long',
      })
    : '';

  return (
    <>
      <AppHeader />
      <main className="bg-slate-50 px-4 py-5 flex-1">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Votre avis</p>
            <h1 className="text-lg font-semibold text-slate-800 mb-0.5">
              Live du {eventDate}
            </h1>
            <p className="text-slate-500 text-sm">Ambassade de {host?.first_name}</p>
          </div>

          <FeedbackForm
            eventId={ha?.event_id ?? ''}
            hostProfileId={ha?.host_profile_id ?? ''}
            contactRequestId={contact.id}
            visitorEmail={contact.visitor_email}
            direction="visitor_to_host"
          />
        </div>
      </main>
    </>
  );
}
