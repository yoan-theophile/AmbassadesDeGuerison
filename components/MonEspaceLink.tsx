'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function MonEspaceLink() {
  const [href, setHref] = useState('/dashboard');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.role === 'admin') {
        setHref('/admin/stats');
      }
    });
  }, []);

  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
    >
      <LayoutDashboard className="w-4 h-4" />
      <span className="hidden sm:inline">Mon espace</span>
    </Link>
  );
}
