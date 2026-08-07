import type { ReactNode } from 'react';

// Container commun aux écrans admin — cf. AdminPageHeader pour la motivation.
//
// `width` reflète la densité réelle de chaque écran :
//   'wide'   → tableaux et listes denses (Ambassadeurs, Témoignages)
//   'normal' → écrans de lecture (Vue générale, Calendrier, Signalements)
//   'narrow' → formulaires (Équipe, Blocages, Paramètres, Timing)

const WIDTHS = {
  wide: 'max-w-6xl',
  normal: 'max-w-3xl',
  narrow: 'max-w-2xl',
} as const;

export default function AdminPage({
  children,
  width = 'normal',
}: {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
}) {
  return <div className={`${WIDTHS[width]} mx-auto px-4 sm:px-6 py-8`}>{children}</div>;
}
