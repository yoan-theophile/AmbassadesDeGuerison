import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
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
  return data ?? [];
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
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-semibold text-slate-800">Témoignages</h1>
          <Link
            href="/temoignages"
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Page publique
          </Link>
        </div>
        <TemoignagesAdmin temoignages={temoignages} initialEventTitle={initialEventTitle} />
      </div>
    </AdminLayout>
  );
}
