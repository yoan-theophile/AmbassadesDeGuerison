'use client';

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-semibold text-indigo-900 mb-2">Pas de connexion</h1>
        <p className="text-gray-600 mb-6">
          Vous êtes hors ligne. La carte des ambassades n'est pas disponible pour le moment.
        </p>
        <p className="text-sm text-gray-500">
          Si vous avez déjà visité la carte, elle peut être disponible en cache.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-indigo-700"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
