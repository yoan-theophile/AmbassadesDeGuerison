'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function MonEspaceLink() {
  // null = pas encore résolu (rien affiché) ; '' = pas de session, aucun
  // espace personnel à proposer → lien masqué. Sans cette distinction, le
  // lien pointait par défaut vers /dashboard pour un visiteur anonyme, qui
  // atterrissait sur l'écran de connexion générique /auth sans jamais être
  // guidé vers /mon-espace/creer — un clic qui ne menait nulle part d'utile
  // pour l'immense majorité des visiteurs de la carte publique.
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const role = data.user?.user_metadata?.role;
      if (role === 'admin') {
        setHref('/admin/stats');
      } else if (role === 'visitor') {
        setHref('/mon-espace');
      } else if (data.user) {
        setHref('/dashboard');
      } else {
        setHref('');
      }
    });
  }, []);

  if (!href) return null;

  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm px-3 py-2.5 sm:py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
    >
      <LayoutDashboard className="w-4 h-4" />
      <span className="hidden sm:inline">Mon espace</span>
    </Link>
  );
}
