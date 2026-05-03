import { Text, Link } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { Btn } from './components/Btn';

interface Props {
  visitorFirstName: string;
  hostFirstName: string;
  hostCity: string;
  hostEmail: string;
  hostWhatsappGroupUrl?: string | null;
  accueilUrl: string;
  availableAt: Date;
}

export default function ContactReserved({
  visitorFirstName, hostFirstName, hostCity, hostEmail, hostWhatsappGroupUrl, accueilUrl, availableAt,
}: Props) {
  const dateStr = availableAt.toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  return (
    <EmailLayout preview={`Votre place est réservée — Ambassade de ${hostFirstName}`}>
      <Text style={p}>Bonjour {visitorFirstName},</Text>
      <Text style={p}>Votre demande pour rejoindre l'ambassade de <strong>{hostFirstName}</strong> ({hostCity}) est bien enregistrée.</Text>
      <Text style={p}>Pour contacter directement l'ambassadeur :</Text>
      <Text style={p}>✉️ E-mail : <Link href={`mailto:${hostEmail}`} style={link}>{hostEmail}</Link></Text>
      {hostWhatsappGroupUrl && (
        <Text style={p}>💬 Groupe WhatsApp de l'ambassade : <Link href={hostWhatsappGroupUrl} style={link}>Rejoindre le groupe</Link></Text>
      )}
      <Text style={{ ...p, marginTop: '16px' }}>Votre lien d'accès à l'adresse sera disponible le <strong>{dateStr}</strong>.</Text>
      <Btn href={accueilUrl}>Accéder à mon lien</Btn>
      <Text style={muted}>Si vous ne pouvez finalement pas venir, vous n'avez rien à faire — votre place sera libérée automatiquement.</Text>
      <Text style={muted}>Ambassades de Guérison — <Link href={accueilUrl.split('/accueil')[0]} style={link}>Voir la carte</Link></Text>
    </EmailLayout>
  );
}

const p: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#1e293b', margin: '0 0 16px' };
const muted: React.CSSProperties = { fontSize: '13px', color: '#64748b', marginTop: '12px' };
const link: React.CSSProperties = { color: '#4F46E5' };
