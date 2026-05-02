export const MOCKS = {
  marie:   { firstName: 'Marie',       email: 'marie.dubois@demo.fr',  city: 'Lyon',  country: 'France' },
  jp:      { firstName: 'Jean-Pierre', email: 'jp.martin@demo.fr',     city: 'Paris', country: 'France' },
  sophie:  { firstName: 'Sophie',      email: 'sophie.leroux@demo.fr', city: 'Nantes', country: 'France' },
  visitor: { firstName: 'Lucas',       email: 'lucas@demo.fr',         city: 'Bordeaux', whatsapp: '+33612345678' },

  appUrl:          'https://ambassades-guerison.vercel.app',
  magicLink:       'https://ambassades-guerison.vercel.app/auth?token=mock-token-preview',
  dashboardUrl:    'https://ambassades-guerison.vercel.app/dashboard',
  carteUrl:        'https://ambassades-guerison.vercel.app',
  declineUrl:      'https://ambassades-guerison.vercel.app/api/decline?token=mock',
  actionUrl:       'https://ambassades-guerison.vercel.app/accueil-invite/mock-token',
  accueilUrl:      'https://ambassades-guerison.vercel.app/accueil-invite/mock-token',
  activateUrl:     'https://ambassades-guerison.vercel.app/dashboard?activate=true',
  unsubscribeUrl:  'https://ambassades-guerison.vercel.app/api/unsubscribe?token=mock',
  feedbackUrl:     'https://ambassades-guerison.vercel.app/feedback?token=mock',
  contactEquipeUrl:'https://ambassades-guerison.vercel.app/contact',
  adminUrl:        'https://ambassades-guerison.vercel.app/admin/ambassadeurs',
  questionnaireUrl:'https://ambassades-guerison.vercel.app/dashboard/questionnaire',
  liveLink:        'https://youtube.com/watch?v=mock-live',
  videoUrl:        'https://youtube.com/watch?v=mock-formation',
  pdfUrl:          'https://ambassades-guerison.vercel.app/charte-ambassadeur.pdf',

  liveTitle: 'Live de guérison — Juin 2026',
  liveDate:  'Samedi 14 juin 2026 à 20h',

  host: {
    firstName:       'Jean-Pierre',
    address:         '12 rue des Lilas, 75011 Paris',
    phone:           '+33 6 12 34 56 78',
    whatsappGroupUrl:'https://chat.whatsapp.com/mock',
    email:           'jp.martin@demo.fr',
  },

  visitorMessage: "J'aimerais beaucoup participer au prochain live depuis chez vous.",
  customMessage:  'Ce live est spécial — David priera personnellement pour les malades.',
  availableAt:    new Date('2026-06-14T18:00:00Z'),
};
