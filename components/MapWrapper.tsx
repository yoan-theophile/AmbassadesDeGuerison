'use client';

import dynamic from 'next/dynamic';
import EventBanner from './EventBanner';

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  live_link: string | null;
}

interface Props {
  nextEvent: EventInfo | null;
  lastEvent: EventInfo | null;
  liveInProgress: boolean;
  totalAmbassadors: number;
  totalCountries: number;
  soonThresholdDays: number;
}

const MapPublique = dynamic(() => import('./MapPublique'), { ssr: false });

export default function MapWrapper({ nextEvent, lastEvent, liveInProgress, totalAmbassadors, totalCountries, soonThresholdDays }: Props) {
  return (
    <div className="relative w-full h-full">
      <EventBanner nextEvent={nextEvent} lastEvent={lastEvent} liveInProgress={liveInProgress} />
      <MapPublique
        nextEvent={nextEvent}
        lastEvent={lastEvent}
        liveInProgress={liveInProgress}
        totalAmbassadors={totalAmbassadors}
        totalCountries={totalCountries}
        soonThresholdDays={soonThresholdDays}
      />
    </div>
  );
}
