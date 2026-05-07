import Link from 'next/link';
import { Quote, ChevronRight } from 'lucide-react';
import type { RecentFruit } from '@/lib/admin/stats-helpers';

type Props = {
  fruits: RecentFruit[];
};

export default function RecentFruits({ fruits }: Props) {
  if (fruits.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-slate-700">Témoignages récents</h2>
        </div>
        <Link
          href="/admin/temoignages"
          className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
        >
          Tous les témoignages <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <ul className="space-y-3">
        {fruits.map((f) => (
          <li key={f.id} className="border-l-2 border-emerald-100 pl-3">
            <p className="text-sm text-slate-700 leading-relaxed">{f.excerpt}</p>
            <p className="text-xs text-slate-400 mt-1">
              {f.authorFirstName}{f.city ? `, ${f.city}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
