'use client';

import { Home, MessageSquare, UserCircle, Play } from 'lucide-react';

export type DashboardTab = 'accueil' | 'demandes' | 'profil' | 'formation';

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  pendingCount: number;
}

const TABS: { id: DashboardTab; label: string; icon: typeof Home }[] = [
  { id: 'accueil', label: 'Accueil', icon: Home },
  { id: 'demandes', label: 'Demandes', icon: MessageSquare },
  { id: 'profil', label: 'Profil', icon: UserCircle },
  { id: 'formation', label: 'Formation', icon: Play },
];

export default function DashboardTabs({ activeTab, onTabChange, pendingCount }: Props) {
  return (
    <>
      {/* Mobile — barre fixe en bas, pattern natif des apps mobiles */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {id === 'demandes' && pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center bg-amber-500 text-white text-[10px] font-semibold rounded-full">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop — tabs horizontales sticky sous le header */}
      <nav className="hidden sm:flex sm:sticky sm:top-[52px] sm:z-20 sm:bg-white sm:border-b sm:border-slate-100 sm:gap-1 sm:px-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'demandes' && pendingCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-amber-500 text-white text-[10px] font-semibold rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
