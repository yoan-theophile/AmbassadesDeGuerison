// Mapping vocabulaire interne admin ↔ vocabulaire côté utilisateur.
// Interne = ce que les admins se disent entre eux.
// Utilisateur = ce qu'on affiche à l'ambassadeur ou au visiteur.

export const ADMIN_LABELS = {
  // Modération
  RED_FLAG:      'Drapeau rouge',
  REPORT:        'Signalement',
  BLACKLIST:     'Bloquer',
  MODERATION:    'Vérification',

  // Statuts ambassadeur (côté utilisateur)
  STATUS_PENDING_REVIEW:      'Candidature reçue',
  STATUS_PRE_APPROVED:        'Candidature en cours d\'examen',
  STATUS_ENRICHMENT_PENDING:  'Informations complémentaires demandées',
  STATUS_VALIDATED:           'Ambassadeur actif',
  STATUS_SUSPENDED:           'Ambassade en pause',
  STATUS_REJECTED:            'Candidature non retenue',
} as const;

// Côté utilisateur (interface publique)
export const USER_LABELS = {
  REPORT_PROBLEM:  'Signaler un problème',
  BLOCK_USER:      'Bloquer cet utilisateur',
  DEACTIVATE:      'Mettre en pause',
  VERIFICATION:    'Vérification',
  PRE_APPROVED:    'Candidature reçue',
  VALIDATED:       'Bienvenue dans la famille des ambassadeurs',
} as const;
