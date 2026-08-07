import { AlertCircle } from 'lucide-react';

// Affichage uniforme des erreurs d'API dans l'admin — pendant visuel de
// `lib/admin/api-call.ts`. Voir la motivation dans ce fichier (audit T.2).

export default function ErrorMessage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={`flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg ${className}`}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
