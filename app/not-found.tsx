import Link from 'next/link';
import { MapPin } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Page introuvable</h1>
        <p className="text-slate-500 text-sm mb-8">
          Cette ambassade n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
        >
          Retour à la carte
        </Link>
      </div>
    </main>
    </>
  );
}
