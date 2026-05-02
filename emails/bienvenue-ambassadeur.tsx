import { Text, Link } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  firstName: string;
  dashboardUrl: string;
  carteUrl: string;
}

export default function BienvenueAmbassadeur({ firstName, dashboardUrl, carteUrl }: Props) {
  return (
    <EmailLayout preview={`Bienvenue dans les Ambassades de Guérison !`}>
      <Text style={p}>Bonjour {firstName},</Text>
      <Text style={p}>Votre ambassade est maintenant active ! Vous apparaissez sur la carte des Ambassades de Guérison.</Text>
      <Text style={p}>Lors des prochains lives de David Théry, vous pourrez accueillir des participants chez vous.</Text>
      <Btn href={dashboardUrl}>Accéder à mon espace</Btn>
      <Text style={{ marginTop: '16px' }}>
        <Link href={carteUrl} style={link}>Voir ma position sur la carte</Link>
      </Text>
      <Text style={signature}>— David Théry</Text>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
const signature: React.CSSProperties = { fontSize: '15px', color: '#334155', fontStyle: 'italic', marginTop: '8px' };
const link: React.CSSProperties = { color: '#4F46E5' };
