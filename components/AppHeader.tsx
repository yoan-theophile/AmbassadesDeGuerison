import Link from 'next/link';
import { Home, UserPlus, MessageSquare } from 'lucide-react';
import MonEspaceLink from '@/components/MonEspaceLink';

export default function AppHeader() {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 z-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
          <Home className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="font-semibold text-slate-800 text-sm">Ambassades de Guérison</span>
          <span className="text-slate-400 text-xs">Groupes de prière — lives de guérison</span>
        </div>
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/temoignages"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Témoignages</span>
        </Link>
        <Link
          href="/inscription"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Devenir ambassadeur</span>
        </Link>
        <MonEspaceLink />
      </nav>
    </header>
  );
}
