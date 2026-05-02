import { Text } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  firstName: string;
  magicLinkUrl: string;
}

export default function MagicLinkBienvenue({ firstName, magicLinkUrl }: Props) {
  return (
    <EmailLayout preview={`Votre lien de connexion — Ambassades de Guérison`}>
      <Text style={p}>Bonjour {firstName},</Text>
      <Text style={p}>Merci de vouloir ouvrir votre maison pour les lives de guérison de David Théry.</Text>
      <Text style={p}>Cliquez sur le lien ci-dessous pour accéder à votre espace et finaliser votre inscription :</Text>
      <Btn href={magicLinkUrl}>Accéder à mon espace</Btn>
      <Text style={muted}>Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet e-mail.</Text>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
const muted: React.CSSProperties = { fontSize: '13px', color: '#64748b', marginTop: '24px' };
