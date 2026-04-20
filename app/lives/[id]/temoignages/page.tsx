import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TemoignagesPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [eventRes, testimonialsRes] = await Promise.all([
    supabase.from('events').select('id, title, event_date').eq('id', id).single(),
    supabase
      .from('testimonials')
      .select(`
        id, content, timing, created_at,
        host_profiles!inner (first_name, city, country)
      `)
      .eq('event_id', id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false }),
  ]);

  if (eventRes.error || !eventRes.data) notFound();
  const event = eventRes.data;
  const testimonials = testimonialsRes.data ?? [];

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(event.event_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-indigo-600 font-medium mt-1">
            {testimonials.length} témoignage{testimonials.length !== 1 ? 's' : ''}
          </p>
        </div>

        {testimonials.length === 0 ? (
          <p className="text-gray-400 text-center py-10">Aucun témoignage pour ce live.</p>
        ) : (
          <div className="space-y-4">
            {testimonials.map((t) => {
              const hp = t.host_profiles as any;
              return (
                <div key={t.id} className="border border-gray-100 rounded-xl p-5 shadow-sm">
                  <blockquote className="text-gray-800 italic mb-3">"{t.content}"</blockquote>
                  <footer className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{hp.first_name}</span>
                    {' — '}
                    {hp.city}, {hp.country}
                    {t.timing === 'during' && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Pendant le live
                      </span>
                    )}
                  </footer>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
