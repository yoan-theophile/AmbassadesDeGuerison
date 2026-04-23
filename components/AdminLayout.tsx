'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Radio,
  Calendar,
  MessageSquare,
  Settings,
  ChevronLeft,
} from 'lucide-react';

const NAV = [
  { href: '/admin/stats',         label: 'Vue générale',  Icon: LayoutDashboard },
  { href: '/admin/ambassadeurs',  label: 'Ambassadeurs',  Icon: Users           },
  { href: '/admin/live',          label: 'Live en cours', Icon: Radio           },
  { href: '/admin/planning',      label: 'Planning',      Icon: Calendar        },
  { href: '/admin/temoignages',   label: 'Témoignages',   Icon: MessageSquare   },
  { href: '/admin/settings',      label: 'Paramètres',    Icon: Settings        },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 bg-slate-900 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-800">
          <p className="text-white text-sm font-semibold">✦ David Théry</p>
          <p className="text-slate-500 text-xs mt-0.5">Espace admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Carte publique
          </Link>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
