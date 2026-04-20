import Link from 'next/link';
import MapWrapper from '@/components/MapWrapper';

export default function HomePage() {
  return (
    <main className="flex flex-col h-screen">
      <header className="bg-indigo-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <h1 className="text-lg font-semibold">Ambassades de Guérison</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/inscription" className="bg-white text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-50">
            Devenir hôte
          </Link>
          <Link href="/dashboard" className="text-indigo-100 hover:text-white">
            Mon espace
          </Link>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapWrapper />
      </div>

      <footer className="bg-white border-t px-4 py-2 text-xs text-gray-500 text-center">
        Lives de guérison avec David Thery — Trouvez une ambassade près de chez vous
      </footer>
    </main>
  );
}
