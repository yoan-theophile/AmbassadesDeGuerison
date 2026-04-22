'use client';

import dynamic from 'next/dynamic';
import EventBanner from './EventBanner';

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
}

interface Props {
  nextEvent: EventInfo | null;
  lastEvent: EventInfo | null;
}

const MapPublique = dynamic(() => import('./MapPublique'), { ssr: false });

export default function MapWrapper({ nextEvent, lastEvent }: Props) {
  return (
    <div className="relative w-full h-full">
      <EventBanner nextEvent={nextEvent} lastEvent={lastEvent} />
      <MapPublique />
    </div>
  );
}
