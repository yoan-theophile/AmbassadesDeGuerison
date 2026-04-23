import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import AmbassadeursTable from '@/components/AmbassadeursTable';

export const dynamic = 'force-dynamic';

async function getAmbassadeurs() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('host_profiles')
    .select('id, first_name, city, country, host_type, status, contact_mode, capacity, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function AdminAmbassadeursPage() {
  const ambassadeurs = await getAmbassadeurs();

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <h1 className="text-base font-semibold text-slate-800 mb-6">Ambassadeurs</h1>
        <AmbassadeursTable ambassadeurs={ambassadeurs} />
      </div>
    </AdminLayout>
  );
}
