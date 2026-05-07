import { describe, it, expect } from 'vitest';
import { computeContextLabel, CONTEXT_LABEL_FR, type HostFacts } from '@/lib/admin/context-label';

const baseFacts: HostFacts = {
  profilePhotoUrl: '/path/photo.jpg',
  hasEverBeenActive: true,
  activationsLast2Events: 1,
  cityDemandCountLastEvent: 1,
  monthsSinceValidation: 1,
  hasEverWelcomed: true,
};

describe('computeContextLabel — premier match wins', () => {
  it('priorité 1 : profile_incomplete si profile_photo_url manquant', () => {
    const facts = { ...baseFacts, profilePhotoUrl: null };
    expect(computeContextLabel(facts)).toBe('profile_incomplete');
  });

  it('priorité 2 : never_activated si jamais actif', () => {
    const facts = { ...baseFacts, hasEverBeenActive: false };
    expect(computeContextLabel(facts)).toBe('never_activated');
  });

  it('priorité 3 : inactive_2_lives si 0 activation sur 2 derniers events', () => {
    const facts = { ...baseFacts, activationsLast2Events: 0 };
    expect(computeContextLabel(facts)).toBe('inactive_2_lives');
  });

  it('priorité 4 : city_no_demand si ville sans demande au dernier live', () => {
    const facts = { ...baseFacts, cityDemandCountLastEvent: 0 };
    expect(computeContextLabel(facts)).toBe('city_no_demand');
  });

  it('priorité 5 : old_no_welcome si validé ≥3 mois ET jamais accueilli', () => {
    const facts = { ...baseFacts, monthsSinceValidation: 4, hasEverWelcomed: false };
    expect(computeContextLabel(facts)).toBe('old_no_welcome');
  });

  it('multi-match : retourne la priorité la plus haute (premier match wins)', () => {
    // facts : profil incomplet ET jamais activé ET vieux sans accueil
    const facts: HostFacts = {
      profilePhotoUrl: null,
      hasEverBeenActive: false,
      activationsLast2Events: 0,
      cityDemandCountLastEvent: 0,
      monthsSinceValidation: 6,
      hasEverWelcomed: false,
    };
    expect(computeContextLabel(facts)).toBe('profile_incomplete');
  });

  it('null si aucune condition ne matche (host actif et fertile)', () => {
    expect(computeContextLabel(baseFacts)).toBeNull();
  });

  it('old_no_welcome ignoré si hasEverWelcomed=true', () => {
    const facts = { ...baseFacts, monthsSinceValidation: 12, hasEverWelcomed: true };
    expect(computeContextLabel(facts)).toBeNull();
  });

  it('CONTEXT_LABEL_FR couvre les 5 labels', () => {
    expect(CONTEXT_LABEL_FR.profile_incomplete).toBe('Profil incomplet');
    expect(CONTEXT_LABEL_FR.never_activated).toBe('Validée mais jamais activée');
    expect(CONTEXT_LABEL_FR.inactive_2_lives).toBe('Inactive depuis 2 lives');
    expect(CONTEXT_LABEL_FR.city_no_demand).toBe('Ville sans demande visiteur ce live');
    expect(CONTEXT_LABEL_FR.old_no_welcome).toBe('Validée il y a ≥ 3 mois, 0 accueil');
  });
});
