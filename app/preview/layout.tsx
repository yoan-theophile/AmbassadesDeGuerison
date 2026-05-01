import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  robots: 'noindex, nofollow',
};

const DIRECTIONS = [
  { href: '/preview/homepage-poster',       label: 'Poster' },
  { href: '/preview/homepage-storytelling', label: 'Storytelling' },
  { href: '/preview/homepage-annuaire',     label: 'Annuaire' },
];

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-slate-400 mr-2 hidden sm:inline">Direction :</span>
        {DIRECTIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            {d.label}
          </Link>
        ))}
        <span className="ml-auto text-xs text-slate-300">Preview — non indexé</span>
      </header>
      {children}
    </>
  );
}
