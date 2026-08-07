// Un dossier ambassadeur est "complet" quand la photo de profil et au moins
// une photo du lieu ont été uploadées via le questionnaire d'enrichissement.
// Source de vérité unique — cet invariant est revérifié à plusieurs endroits
// (API admin, dashboard, StatusTimeline) plutôt que de faire confiance au
// seul statut DB, car un profil créé hors du flux API (script, test) peut
// avoir enrichment_pending sans dossier complet.
export function isDossierComplet(
  profilePhotoUrl: string | null | undefined,
  roomPhotoUrls: string[] | null | undefined
): boolean {
  return !!profilePhotoUrl && (roomPhotoUrls?.length ?? 0) > 0;
}
