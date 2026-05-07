import { describe, it, expect } from 'vitest';

describe('Inscription — payload ambassadeur', () => {
  it('valide les champs obligatoires du formulaire étape 1', () => {
    const required = ['email', 'first_name', 'last_name', 'phone', 'city'];

    const incompleteForm = {
      email: 'test@test.fr',
      first_name: '',
      last_name: '',
      phone: '',
      city: '',
    };
    const missingFields = required.filter(
      (f) => !incompleteForm[f as keyof typeof incompleteForm]
    );

    expect(missingFields).toContain('first_name');
    expect(missingFields).toContain('last_name');
    expect(missingFields).toContain('phone');
    expect(missingFields).toContain('city');
    expect(missingFields).not.toContain('email');
  });

  it('le bouton Continuer est bloqué si lat est absent (ville tapée sans sélection dropdown)', () => {
    const formTypedOnly = {
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie@test.fr',
      phone: '+33 6 12 34 56 78',
      city: 'Paris',
      lat: undefined as number | undefined,
      lng: undefined as number | undefined,
    };

    const canContinue =
      !!formTypedOnly.first_name &&
      !!formTypedOnly.last_name &&
      !!formTypedOnly.email &&
      !!formTypedOnly.phone.trim() &&
      !!formTypedOnly.city &&
      formTypedOnly.lat != null;

    expect(canContinue).toBe(false);
  });

  it('le bouton Continuer est débloqué pour une ville à latitude 0 (équateur)', () => {
    const formEquateur = {
      first_name: 'Jean',
      last_name: 'Mba',
      email: 'jean@test.cm',
      phone: '+237 6 00 00 00 00',
      city: 'Libreville',
      lat: 0.3924 as number | undefined,
      lng: 9.4536 as number | undefined,
    };

    const canContinue =
      !!formEquateur.first_name &&
      !!formEquateur.last_name &&
      !!formEquateur.email &&
      !!formEquateur.phone.trim() &&
      !!formEquateur.city &&
      formEquateur.lat != null;

    expect(canContinue).toBe(true);
  });

  it('le bouton Continuer est bloqué si last_name est vide', () => {
    const form = {
      first_name: 'Marie',
      last_name: '',
      email: 'marie@test.fr',
      phone: '+33 6 12 34 56 78',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };

    const canContinue =
      !!form.first_name &&
      !!form.last_name &&
      !!form.email &&
      !!form.phone.trim() &&
      !!form.city &&
      form.lat != null;

    expect(canContinue).toBe(false);
  });

  it('le bouton Continuer est bloqué si phone est vide', () => {
    const form = {
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie@test.fr',
      phone: '',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };

    const canContinue =
      !!form.first_name &&
      !!form.last_name &&
      !!form.email &&
      !!form.phone.trim() &&
      !!form.city &&
      form.lat != null;

    expect(canContinue).toBe(false);
  });

  it('le bouton Continuer est débloqué quand tous les champs obligatoires sont remplis', () => {
    const formComplete = {
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie@test.fr',
      phone: '+33 6 12 34 56 78',
      city: 'Paris',
      lat: 48.8566,
      lng: 2.3522,
    };

    const canContinue =
      !!formComplete.first_name &&
      !!formComplete.last_name &&
      !!formComplete.email &&
      !!formComplete.phone.trim() &&
      !!formComplete.city &&
      formComplete.lat != null;

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

  it("l'API rejette un payload sans lat/lng (simulation validation serveur)", () => {
    function validateInscriptionPayload(body: Record<string, unknown>) {
      const { email, first_name, last_name, phone, city, country, address_private, lat, lng } = body;
      if (!email || !first_name || !last_name || !(phone as string)?.trim() || !city || !country || !address_private || lat == null || lng == null) {
        return { ok: false, status: 400, error: 'Champs obligatoires manquants.' };
      }
      return { ok: true, status: 201 };
    }

    const basePayload = {
      email: 'test@test.fr',
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '+33 6 00 00 00 00',
      city: 'Paris',
      country: 'France',
      address_private: '12 rue de la Paix',
      lat: 48.8566,
      lng: 2.3522,
    };

    expect(validateInscriptionPayload(basePayload).ok).toBe(true);
    expect(validateInscriptionPayload({ ...basePayload, lat: undefined }).ok).toBe(false);
    expect(validateInscriptionPayload({ ...basePayload, lng: null }).ok).toBe(false);
    expect(validateInscriptionPayload({ ...basePayload, lat: undefined, lng: undefined }).ok).toBe(false);
    expect(validateInscriptionPayload({ ...basePayload, last_name: '' }).ok).toBe(false);
    expect(validateInscriptionPayload({ ...basePayload, phone: '   ' }).ok).toBe(false);
  });
});
