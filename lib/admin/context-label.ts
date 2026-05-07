// ┌──────────────────────────────────────────────────────────────────┐
// │  Calcule le label de contexte pour "Ambassades à vérifier"       │
// │                                                                   │
// │  Règle : PREMIER MATCH WINS. L'ordre des conditions ci-dessous   │
// │  est l'ordre de priorité descendant. Une fois qu'une condition   │
// │  matche, on retourne ce label et on ignore les suivantes.        │
// │                                                                   │
// │  Priorité 1 : profile_incomplete                                  │
// │  Priorité 2 : never_activated                                     │
// │  Priorité 3 : inactive_2_lives                                    │
// │  Priorité 4 : city_no_demand                                      │
// │  Priorité 5 : old_no_welcome                                      │
// │                                                                   │
// │  Si aucune condition ne matche → null (le host n'apparaît pas    │
// │  dans la liste).                                                  │
// └──────────────────────────────────────────────────────────────────┘

export type ContextLabel =
  | 'profile_incomplete'
  | 'never_activated'
  | 'inactive_2_lives'
  | 'city_no_demand'
  | 'old_no_welcome';

export type HostFacts = {
  profilePhotoUrl: string | null;
  hasEverBeenActive: boolean;
  activationsLast2Events: number;
  cityDemandCountLastEvent: number;
  monthsSinceValidation: number;
  hasEverWelcomed: boolean;
};

export function computeContextLabel(facts: HostFacts): ContextLabel | null {
  if (!facts.profilePhotoUrl) return 'profile_incomplete';
  if (!facts.hasEverBeenActive) return 'never_activated';
  if (facts.activationsLast2Events === 0) return 'inactive_2_lives';
  if (facts.cityDemandCountLastEvent === 0) return 'city_no_demand';
  if (facts.monthsSinceValidation >= 3 && !facts.hasEverWelcomed) return 'old_no_welcome';
  return null;
}

// Mapping FR pour le rendu UI. Cohérent avec convention codebase
// (cf STATUS_TO_STEP dans components/dashboard/StatusTimeline.tsx).
export const CONTEXT_LABEL_FR: Record<ContextLabel, string> = {
  profile_incomplete: 'Profil incomplet',
  never_activated: 'Validée mais jamais activée',
  inactive_2_lives: 'Inactive depuis 2 lives',
  city_no_demand: 'Ville sans demande visiteur ce live',
  old_no_welcome: 'Validée il y a ≥ 3 mois, 0 accueil',
};
