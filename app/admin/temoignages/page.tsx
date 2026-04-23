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
    .select('id, content, timing, is_visible, created_at, host_profile:host_profiles(first_name, city), event:events(title)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function AdminTemoignagesPage() {
  const temoignages = await getTemoignages();

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
        <TemoignagesAdmin temoignages={temoignages} />
      </div>
    </AdminLayout>
  );
}
