'use client';

import { useState } from 'react';
import { Share2, Check, Link2 } from 'lucide-react';

interface Props {
  url: string;
  whatsappText: string;
}

export default function TemoignageShareButtons({ url, whatsappText }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        WhatsApp
      </a>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            Copié
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Copier le lien
          </>
        )}
      </button>
    </div>
  );
}
