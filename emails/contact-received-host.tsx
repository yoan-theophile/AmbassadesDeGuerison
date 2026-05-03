import { Text, Link } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  hostFirstName: string;
  visitorFirstName: string;
  visitorEmail: string;
  visitorWhatsapp?: string | null;
  visitorMessage?: string | null;
  declineUrl: string;
}

export default function ContactReceivedHost({
  hostFirstName, visitorFirstName, visitorEmail, visitorWhatsapp, visitorMessage, declineUrl,
}: Props) {
  return (
    <EmailLayout preview={`${visitorFirstName} souhaite rejoindre votre ambassade`}>
      <Text style={p}>Bonjour {hostFirstName},</Text>
      <Text style={p}><strong>{visitorFirstName}</strong> souhaite rejoindre votre ambassade.</Text>
      <Text style={p}>✉️ E-mail : <Link href={`mailto:${visitorEmail}`} style={link}>{visitorEmail}</Link></Text>
      {visitorWhatsapp && (
        <Text style={p}>📱 WhatsApp : <Link href={`https://wa.me/${visitorWhatsapp.replace(/\D/g, '')}`} style={link}>{visitorWhatsapp}</Link></Text>
      )}
      {visitorMessage && (
        <Text style={p}>Message : <em>"{visitorMessage}"</em></Text>
      )}
      <Text style={muted}>Sa place sera confirmée automatiquement dans 24 heures. Si vous n'êtes pas en mesure de l'accueillir, cliquez ici :</Text>
      <Btn href={declineUrl} color="red">Refuser cette demande</Btn>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
const muted: React.CSSProperties = { fontSize: '13px', color: '#64748b', margin: '24px 0 12px' };
const link: React.CSSProperties = { color: '#4F46E5' };
