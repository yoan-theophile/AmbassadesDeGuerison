'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Radio,
  Calendar,
  MessageSquare,
  Settings,
  ChevronLeft,
  LogOut,
  AlertTriangle,
  Ban,
  Shield,
  Bell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const NAV = [
  { href: '/admin/stats',         label: 'Vue générale',  Icon: LayoutDashboard },
  { href: '/admin/ambassadeurs',  label: 'Ambassadeurs',  Icon: Users           },
  { href: '/admin/live',          label: 'Live en cours', Icon: Radio           },
  { href: '/admin/calendrier',    label: 'Calendrier',    Icon: Calendar        },
  { href: '/admin/temoignages',   label: 'Témoignages',   Icon: MessageSquare   },
  { href: '/admin/feedback',      label: 'Signalements',  Icon: AlertTriangle   },
  { href: '/admin/blacklist',     label: 'Blocages',      Icon: Ban             },
  { href: '/admin/team',          label: 'Équipe',        Icon: Shield          },
  { href: '/admin/settings',      label: 'Paramètres',    Icon: Settings        },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasNewReport, setHasNewReport] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-reports-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_feedbacks',
        filter: 'reported=eq.true',
      }, () => {
        setHasNewReport(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin/feedback')) {
      setHasNewReport(false);
    }
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-14 sm:w-52 shrink-0 bg-slate-900 flex flex-col sticky top-0 h-screen self-start">
        <div className="px-4 py-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="hidden sm:block text-white text-sm font-semibold">✦ David Théry</p>
              <p className="hidden sm:block text-slate-500 text-xs mt-0.5">Espace admin</p>
              <p className="sm:hidden text-white text-sm font-semibold">✦</p>
            </div>
            <Link
              href="/admin/feedback"
              className="relative text-slate-500 hover:text-white transition-colors"
              title="Signalements"
            >
              <Bell className="w-4 h-4" />
              {hasNewReport && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Link>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t border-slate-800 space-y-1">
          <Link
            href="/"
            className="flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-3 py-2 text-slate-500 hover:text-slate-300 text-xs transition-colors rounded-lg"
          >
            <ChevronLeft className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Carte publique</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-3 py-2 text-slate-500 hover:text-red-400 text-xs transition-colors rounded-lg"
          >
            <LogOut className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Se déconnecter</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
