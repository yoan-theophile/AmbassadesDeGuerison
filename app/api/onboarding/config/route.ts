import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ONBOARDING } from '@/config/onboarding';

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('onboarding_config')
    .select('video_url, pdf_url')
    .eq('id', 1)
    .single();

  return NextResponse.json({
    video_url: data?.video_url || ONBOARDING.VIDEO_URL,
    pdf_url:   data?.pdf_url   || ONBOARDING.PDF_PATH,
  });
}
