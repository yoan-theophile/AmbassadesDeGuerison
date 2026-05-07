import Link from 'next/link';
import type { SnapshotTotals } from '@/lib/admin/stats-helpers';

type Props = {
  totals: SnapshotTotals;
};

export default function SnapshotFooter({ totals }: Props) {
  return (
    <Link
      href="/admin/ambassadeurs"
      className="block text-center text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
    >
      {totals.ambassadors} ambassade{totals.ambassadors > 1 ? 's' : ''}
      {' · '}
      {totals.countries} pays
      {' · '}
      {totals.testimonials} témoignage{totals.testimonials > 1 ? 's' : ''}
      {' · '}
      {totals.visitorsAccepted} visiteur{totals.visitorsAccepted > 1 ? 's' : ''} accueilli{totals.visitorsAccepted > 1 ? 's' : ''}
    </Link>
  );
}
