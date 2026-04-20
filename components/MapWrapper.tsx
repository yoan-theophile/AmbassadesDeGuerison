'use client';

import dynamic from 'next/dynamic';

// Client Component wrapper — ssr: false autorisé uniquement ici
const MapPublique = dynamic(() => import('./MapPublique'), { ssr: false });

export default function MapWrapper() {
  return <MapPublique />;
}
