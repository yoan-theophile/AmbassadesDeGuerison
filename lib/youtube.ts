export function buildVideoUrl(url: string): string {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}enablejsapi=1`;
}

// Extrait l'identifiant d'une vidéo depuis les formats d'URL YouTube courants.
// Retourne null si l'URL n'est pas reconnue.
export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Un ID nu collé directement (11 caractères, alphabet YouTube).
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /youtube\.com\/embed\/([\w-]{11})/,     // déjà au bon format
    /youtube\.com\/live\/([\w-]{11})/,      // page de live
    /youtube\.com\/shorts\/([\w-]{11})/,    // short
    /[?&]v=([\w-]{11})/,                    // watch?v=
    /youtu\.be\/([\w-]{11})/,               // lien court
  ];

  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  return null;
}

// Normalise une URL saisie par l'admin vers la forme embed.
//
// Audit admin 2026-08-07 (9.5) : le champ exigeait un format embed mais
// acceptait silencieusement une URL `watch?v=` classique — celle qu'on obtient
// en copiant la barre d'adresse. L'iframe du dashboard candidat refuse ce
// format : la vidéo ne s'affichait pas, et comme la video gate conditionne la
// checkbox d'engagement, le candidat restait bloqué sans explication.
//
// Retourne null si l'URL n'est pas une URL YouTube reconnaissable, pour que
// l'appelant puisse refuser la saisie plutôt que d'enregistrer un lien mort.
export function normalizeYoutubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
