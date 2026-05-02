import { Text } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  firstName: string;
  liveLink: string;
}

export default function SignalApproved({ firstName, liveLink }: Props) {
  return (
    <EmailLayout preview="Vous avez été sélectionné pour témoigner en direct !">
      <Text style={p}>Bonjour {firstName},</Text>
      <Text style={p}>David a approuvé votre signal. Vous êtes invité à témoigner en direct !</Text>
      <Text style={p}>Rejoignez le live maintenant :</Text>
      <Btn href={liveLink} color="green">Rejoindre le live</Btn>
      <Text style={muted}>Préparez-vous à partager votre témoignage en quelques mots.</Text>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
const muted: React.CSSProperties = { fontSize: '13px', color: '#64748b', marginTop: '24px' };
