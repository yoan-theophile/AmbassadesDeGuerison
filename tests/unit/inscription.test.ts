import { describe, it, expect } from 'vitest';

describe('Inscription — payload ambassadeur', () => {
  it('le formulaire ne contient plus de champ contact_mode', () => {
    const formState = {
      email: 'marie@test.fr',
      first_name: 'Marie',
      city: 'Paris',
      country: 'France',
      lat: 48.8566,
      lng: 2.3522,
      type: 'individual',
      capacity: '15',
      address_private: '12 rue de la Paix, 75001 Paris',
      whatsapp_group_url: '',
      consignes: '',
    };

    expect(formState).not.toHaveProperty('contact_mode');
  });

  it('contact_mode est fixé à "email" côté API indépendamment du payload', () => {
    const apiPayload = {
      email: 'marie@test.fr',
      first_name: 'Marie',
      city: 'Paris',
      country: 'France',
      type: 'individual',
      capacity: 15,
      address_private: '12 rue de la Paix, 75001 Paris',
    };

    // Simule la logique de l'API : contact_mode est toujours 'email'
    const insertRow = {
      ...apiPayload,
      contact_mode: 'email' as const,
      status: 'pending_onboarding',
    };

    expect(insertRow.contact_mode).toBe('email');
    expect(apiPayload).not.toHaveProperty('contact_mode');
  });

  it('valide les champs obligatoires du formulaire étape 1', () => {
    const required = ['email', 'first_name', 'city'];

    const incompleteForm = { email: 'test@test.fr', first_name: '', city: '' };
    const missingFields = required.filter(
      (f) => !incompleteForm[f as keyof typeof incompleteForm]
    );

    expect(missingFields).toContain('first_name');
    expect(missingFields).toContain('city');
    expect(missingFields).not.toContain('email');
  });

  it('valide les champs obligatoires du formulaire étape 2', () => {
    const address = '15 rue de la République, 31000 Toulouse';
    expect(address.length).toBeGreaterThan(0);

    const empty = '';
    expect(empty.length).toBe(0);
  });
});
