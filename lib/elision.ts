// Voyelles + h muet. On ne distingue pas h muet et h aspiré : les prénoms à h
// aspiré sont rares (Hugo → « d'Hugo » est la forme usuelle en français
// contemporain), et se tromper dans ce sens reste plus discret que « de Hugo ».
const ELIDE_RE = /^[aàâäeéèêëiîïoôöuùûüyhAÀÂÄEÉÈÊËIÎÏOÔÖUÙÛÜYH]/;

/**
 * Rend « de X » / « d'X » selon l'initiale du nom.
 *
 * Sans ça, l'app affichait « Ambassade de Alpha », « de Antoine », « de Étienne »
 * — visible sur la fiche publique d'un ambassadeur, la page de feedback et la
 * modération admin (trouvé en QA le 2026-08-07). Le prénom vient de la saisie
 * libre d'un ambassadeur : on ne peut pas figer la forme dans le texte.
 *
 * Retourne juste « de » si le nom est vide, pour ne pas produire « d' » orphelin.
 */
export function de(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'de';
  return ELIDE_RE.test(trimmed) ? `d'${trimmed}` : `de ${trimmed}`;
}
