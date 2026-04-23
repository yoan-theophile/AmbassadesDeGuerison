/**
 * Messages de partage WhatsApp / lien.
 * Centralise les textes pour éviter les divergences entre pages.
 * Pattern identique à lib/email/templates.ts.
 */

export function ambassadorShareText(origin: string): string {
  return `Je viens de m'inscrire comme ambassadeur des lives de guérison avec David Théry 🙏\nRejoignez la carte des ambassades : ${origin}`;
}

export function ambassadorWhatsAppUrl(origin: string): string {
  return `https://wa.me/?text=${encodeURIComponent(ambassadorShareText(origin))}`;
}

export function testimonialsShareText(eventTitle: string, count: number): string {
  return `${count} témoignage${count !== 1 ? 's' : ''} lors du live "${eventTitle}" avec David Théry 🙏`;
}

export function testimonialsWhatsAppUrl(eventTitle: string, count: number, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${testimonialsShareText(eventTitle, count)}\n${url}`)}`;
}
