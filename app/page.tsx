import MapWrapper from '@/components/MapWrapper';
import AppHeader from '@/components/AppHeader';
import { getHomepageData } from '@/lib/homepage-data';

export const revalidate = 60;

export default async function HomePage() {
  const { nextEvent, lastEvent, liveInProgress } = await getHomepageData();

  return (
    <div className="flex flex-col h-screen bg-white">
      <AppHeader />

      <div className="flex-1 relative">
        <MapWrapper
          nextEvent={nextEvent}
          lastEvent={lastEvent}
          liveInProgress={liveInProgress}
        />
      </div>

      <footer className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-500 text-center shrink-0">
        Ambassades de Guérison — rejoignez un groupe de prière lors des lives de David Théry
      </footer>
    </div>
  );
}
