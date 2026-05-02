import { Text } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  hostFirstName: string;
  actionUrl: string;
}

export default function ContactAccepted({ hostFirstName, actionUrl }: Props) {
  return (
    <EmailLayout preview={`Bonne nouvelle ! ${hostFirstName} a accepté votre demande`}>
      <Text style={p}>Bonjour,</Text>
      <Text style={p}>Bonne nouvelle ! <strong>{hostFirstName}</strong> a accepté votre demande de contact.</Text>
      <Text style={p}>Avant de vous rendre à l'ambassade, veuillez lire les consignes :</Text>
      <Btn href={actionUrl}>Voir les consignes et l'adresse</Btn>
      <Text style={muted}>Ce lien est valable 7 jours.</Text>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
const muted: React.CSSProperties = { fontSize: '13px', color: '#64748b', marginTop: '24px' };
