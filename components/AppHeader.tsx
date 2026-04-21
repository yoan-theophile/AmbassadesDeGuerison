import Link from 'next/link';
import { Home, UserPlus, LayoutDashboard } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 z-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-800 text-sm hidden sm:block">Ambassades de Guérison</span>
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/inscription"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Devenir hôte</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:inline">Mon espace</span>
        </Link>
      </nav>
    </header>
  );
}
