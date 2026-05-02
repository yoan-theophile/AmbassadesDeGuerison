import { Text, Link } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  firstName: string;
  questionnaireUrl: string;
  videoUrl: string;
  pdfUrl: string;
}

export default function PreValidationAccordee({ firstName, questionnaireUrl, videoUrl, pdfUrl }: Props) {
  return (
    <EmailLayout preview="Bonne nouvelle — votre candidature ambassadeur est pré-approuvée !">
      <Text style={p}>Bonjour {firstName},</Text>
      <Text style={p}>Bonne nouvelle ! Votre candidature pour devenir ambassadeur de guérison a été pré-approuvée. Merci pour votre disponibilité à ouvrir votre maison.</Text>
      <Text style={p}>Avant la validation finale, il reste une dernière étape : compléter votre profil enrichi. Cela prend moins de 5 minutes.</Text>
      <Btn href={questionnaireUrl}>Compléter mon profil →</Btn>
      <Text style={{ ...p, marginTop: '24px' }}>Vous pouvez aussi :</Text>
      <Text style={p}>
        <Link href={videoUrl} style={link}>Voir la vidéo de formation</Link>
        {' · '}
        <Link href={pdfUrl} style={link}>Lire la charte ambassadeur</Link>
      </Text>
      <Text style={muted}>Si vous avez des questions, répondez directement à cet e-mail.</Text>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
const muted: React.CSSProperties = { fontSize: '13px', color: '#64748b', marginTop: '24px' };
const link: React.CSSProperties = { color: '#4F46E5' };
