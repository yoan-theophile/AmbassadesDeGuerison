import { createServiceClient } from '@/lib/supabase/server';

export type LiveEvent = {
  id: string;
  title: string;
  event_date: string;
};

export type PublicTestimonial = {
  id: string;
  content: string;
  visitor_name: string | null;
  submitter_city: string | null;
  host_profile_id: string | null;
  host_profiles: { first_name: string; city: string } | null;
};

export type HomepageData = {
  nextEvent: LiveEvent | null;
  lastEvent: LiveEvent | null;
  liveInProgress: boolean;
  totalAmbassadors: number;
  totalCountries: number;
  topTestimonials: PublicTestimonial[];
};

// Fonction plain async — le cache est géré par export const revalidate au niveau page (Next.js 16)
export async function getHomepageData(): Promise<HomepageData> {
  const supabase = createServiceClient();
  const now = new Date();
  const nowISO = now.toISOString();
  const windowHours = Number(process.env.NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS ?? 4);
  const windowStart = new Date(now.getTime() - windowHours * 3600 * 1000).toISOString();

  const [
    nextEventRes,
    lastEventRes,
    ambassadeursRes,
    countriesRes,
    testimonialsRes,
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, event_date')
      .gt('event_date', nowISO)
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('events')
      .select('id, title, event_date')
      .lte('event_date', nowISO)
      .order('event_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('host_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'validated'),
    supabase
      .from('host_profiles')
      .select('country')
      .eq('status', 'validated'),
    supabase
      .from('testimonials')
      .select(`
        id, content, visitor_name, submitter_city, host_profile_id,
        host_profiles(first_name, city)
      `)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const nextEvent = (nextEventRes.data as LiveEvent | null) ?? null;
  const lastEvent = (lastEventRes.data as LiveEvent | null) ?? null;
  const liveInProgress = !!lastEvent && lastEvent.event_date >= windowStart;
  const totalAmbassadors = ambassadeursRes.count ?? 0;
  const countries = countriesRes.data ?? [];
  const totalCountries = new Set(countries.map(h => h.country)).size;

  const allTestimonials = (testimonialsRes.data ?? []) as unknown as PublicTestimonial[];
  const topTestimonials = [...allTestimonials]
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 5);

  return { nextEvent, lastEvent, liveInProgress, totalAmbassadors, totalCountries, topTestimonials };
}
