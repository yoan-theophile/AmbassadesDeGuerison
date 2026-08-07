import type { ReactNode } from 'react';

// En-tête commun aux écrans admin.
//
// Motivation (audit admin 2026-08-07, T.4) : deux systèmes de mise en page
// coexistaient — `px-6 py-8` + `text-base` (Vue générale, Ambassadeurs,
// Témoignages, Paramètres) contre `max-w-2xl mx-auto` + `text-2xl` (Calendrier,
// Équipe, Blocages, Timing). La cause était structurelle : certaines pages
// mettaient leur titre dans le composant client, d'autres dans la page serveur.
// L'écart était visible en passant d'un onglet à l'autre.

export default function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
