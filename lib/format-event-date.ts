export function formatEventDateDual(isoDate: string): string {
  const d = new Date(isoDate);
  const reunionTime = d.toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Indian/Reunion',
  });
  const parisTime = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
  return `${reunionTime} (La Réunion) · ${parisTime} (Paris)`;
}
