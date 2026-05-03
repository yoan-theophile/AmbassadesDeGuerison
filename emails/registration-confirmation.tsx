import { Text } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  firstName: string;
  dashboardUrl: string;
}

export default function RegistrationConfirmation({ firstName, dashboardUrl }: Props) {
  return (
    <EmailLayout preview="Bienvenue parmi les Ambassadeurs de Guérison !">
      <Text style={p}>Bonjour {firstName},</Text>
      <Text style={p}>Votre inscription est confirmée. Vous faites maintenant partie du réseau des Ambassades de Guérison.</Text>
      <Text style={p}>Votre ambassade apparaîtra sur la carte lors du prochain live de David Théry.</Text>
      <Btn href={dashboardUrl}>Accéder à mon espace</Btn>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
