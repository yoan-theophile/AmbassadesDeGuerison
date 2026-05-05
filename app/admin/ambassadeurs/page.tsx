import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import AmbassadeursTable from '@/components/AmbassadeursTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

async function getAmbassadeurs(page: number, q: string, status: string) {
  const supabase = createServiceClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('host_profiles')
    .select(
      'id, first_name, last_name, email, city, country, host_type, status, contact_mode, capacity, created_at, phone, healing_challenge_done, conferences_assistees, church_attendance, denomination, parcours_spirituel, livres_lus',
      { count: 'exact' }
    );

  if (q) query = (query as any).or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,city.ilike.%${q}%`);
  if (status !== 'all') query = (query as any).eq('status', status);

  const { data, count } = await (query as any)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  return { ambassadeurs: data ?? [], total: count ?? 0 };
}

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}

export default async function AdminAmbassadeursPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const q = sp.q ?? '';
  const filterStatus = sp.status ?? 'all';

  const { ambassadeurs, total } = await getAmbassadeurs(page, q, filterStatus);

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <h1 className="text-base font-semibold text-slate-800 mb-6">Ambassadeurs</h1>
        <AmbassadeursTable
          ambassadeurs={ambassadeurs}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          searchQ={q}
          filterStatus={filterStatus}
        />
      </div>
    </AdminLayout>
  );
}
