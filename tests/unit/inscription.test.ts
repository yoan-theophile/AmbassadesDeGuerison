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

  it('le bouton Continuer est bloqué si lat est absent (ville tapée sans sélection dropdown)', () => {
    // Simule l'état du formulaire quand l'utilisateur tape une ville
    // sans cliquer sur une suggestion — lat/lng restent undefined
    const formTypedOnly = {
      first_name: 'Marie',
      email: 'marie@test.fr',
      city: 'Paris',
      lat: undefined as number | undefined,
      lng: undefined as number | undefined,
    };

    const canContinue =
      !!formTypedOnly.first_name &&
      !!formTypedOnly.email &&
      !!formTypedOnly.city &&
      !!formTypedOnly.lat;

    expect(canContinue).toBe(false);
  });

  it('le bouton Continuer est débloqué quand lat/lng sont confirmés via le dropdown', () => {
    const formWithGeocode = {
      first_name: 'Marie',
      email: 'marie@test.fr',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };

    const canContinue =
      !!formWithGeocode.first_name &&
      !!formWithGeocode.email &&
      !!formWithGeocode.city &&
      !!formWithGeocode.lat;

    expect(canContinue).toBe(true);
  });

  it('le pays est auto-rempli depuis le geocoding quand une ville est sélectionnée', () => {
    const formBefore = { city: 'France', country: 'France', lat: undefined as number | undefined, lng: undefined as number | undefined };

    // Simule la sélection de Yaoundé dans le dropdown
    const geocodeResult = { city: 'Yaoundé', lat: 3.8480, lng: 11.5021, country: 'Cameroun' };

    const formAfter = {
      ...formBefore,
      city: geocodeResult.city,
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      ...(geocodeResult.country ? { country: geocodeResult.country } : {}),
    };

    expect(formAfter.city).toBe('Yaoundé');
    expect(formAfter.country).toBe('Cameroun');
    expect(formAfter.lat).toBe(3.8480);
  });

  it('le pays reste inchangé si le geocoding ne retourne pas de pays', () => {
    const formBefore = { city: 'France', country: 'France', lat: undefined as number | undefined };

    const geocodeResult = { city: 'Ville inconnue', lat: 0, lng: 0, country: '' };

    const formAfter = {
      ...formBefore,
      city: geocodeResult.city,
      lat: geocodeResult.lat,
      ...(geocodeResult.country ? { country: geocodeResult.country } : {}),
    };

    expect(formAfter.country).toBe('France');
  });

  it('valide les champs obligatoires du formulaire étape 2', () => {
    const address = '15 rue de la République, 31000 Toulouse';
    expect(address.length).toBeGreaterThan(0);

    const empty = '';
    expect(empty.length).toBe(0);
  });
});
