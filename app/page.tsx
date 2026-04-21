import MapWrapper from '@/components/MapWrapper';
import AppHeader from '@/components/AppHeader';

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <AppHeader />

      <div className="flex-1 relative">
        <MapWrapper />
      </div>

      <footer className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-400 text-center shrink-0">
        Lives de guérison avec David Thery — Trouvez une ambassade près de chez vous
      </footer>
    </div>
  );
}
