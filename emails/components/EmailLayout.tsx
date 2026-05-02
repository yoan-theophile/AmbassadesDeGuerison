import { Body, Container, Head, Html, Preview } from 'react-email';
import * as React from 'react';

interface Props {
  preview?: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: Props) {
  return (
    <Html lang="fr">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={{ backgroundColor: '#ffffff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </Container>
      </Body>
    </Html>
  );
}
