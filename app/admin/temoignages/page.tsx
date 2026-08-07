import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import AdminPage from '@/components/admin/AdminPage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import TemoignagesAdmin from '@/components/TemoignagesAdmin';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getTemoignages() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('testimonials')
    .select('id, content, is_visible, created_at, host_profile:host_profiles(first_name, city), event:events(title)')
    .order('created_at', { ascending: false });
  return (data ?? []).map((t) => ({
    ...t,
    host_profile: Array.isArray(t.host_profile) ? t.host_profile[0] ?? null : t.host_profile,
    event: Array.isArray(t.event) ? t.event[0] ?? null : t.event,
  }));
}

async function getEventTitle(eventId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('events')
    .select('title')
    .eq('id', eventId)
    .single();
  return data?.title ?? null;
}

export default async function AdminTemoignagesPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const { event_id } = await searchParams;
  const [temoignages, initialEventTitle] = await Promise.all([
    getTemoignages(),
    event_id ? getEventTitle(event_id) : Promise.resolve(null),
  ]);

  return (
    <AdminLayout>
      <AdminPage width="wide">
        <AdminPageHeader
          title="Témoignages"
          subtitle="Ce que les visiteurs racontent après un live. Seuls les témoignages publiés apparaissent sur le site."
          action={
            <Link
              // Audit 5.1 : le lien perdait le filtre par live, alors que la
              // page publique accepte le même paramètre.
              href={event_id ? `/temoignages?live=${event_id}` : '/temoignages'}
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Page publique
            </Link>
          }
        />
        <TemoignagesAdmin temoignages={temoignages} initialEventTitle={initialEventTitle} />
      </AdminPage>
    </AdminLayout>
  );
}
