import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import OnboardingConfigForm from '@/components/OnboardingConfigForm';
import { ONBOARDING } from '@/config/onboarding';
import Link from 'next/link';
import { Timer } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('onboarding_config')
    .select('video_url, pdf_url')
    .eq('id', 1)
    .single();

  const config = {
    video_url: data?.video_url || ONBOARDING.VIDEO_URL,
    pdf_url:   data?.pdf_url   || ONBOARDING.PDF_PATH,
  };

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <h1 className="text-base font-semibold text-slate-800 mb-6">Paramètres</h1>
        <OnboardingConfigForm initialConfig={config} />
        <div className="mt-8 pt-6 border-t border-slate-100">
          <Link
            href="/admin/settings/timing"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <Timer className="w-4 h-4" />
            Configurer les délais (campagnes, feedback, rappels)
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
