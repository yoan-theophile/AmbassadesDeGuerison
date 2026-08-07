import type { ReactNode } from 'react';

// Container commun aux écrans admin — cf. AdminPageHeader pour la motivation.
//
// `width` reflète la densité réelle de chaque écran :
//   'full'   → tableaux larges qui doivent utiliser tout l'espace disponible
//              (Ambassadeurs : 9 colonnes, dont « Action » en dernière position
//              — une largeur maximale la poussait hors écran sur un portable,
//              exactement le défaut que le mode carte corrige déjà en mobile)
//   'wide'   → listes denses (Témoignages)
//   'normal' → écrans de lecture (Vue générale, Calendrier, Retours post-live)
//   'narrow' → formulaires (Équipe, Blocages, Paramètres, Timing)

const WIDTHS = {
  full: 'w-full',
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
