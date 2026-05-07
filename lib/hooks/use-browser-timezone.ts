'use client';

import { useState, useEffect } from 'react';

function buildLabel(city: string): string {
  const prep = /^[AEIOUaeiouÀÂÈÉÊËÎÏÔÙÛ]/i.test(city) ? "d'" : 'de ';
  return `heure ${prep}${city}`;
}

export function useBrowserTimezone(): string {
  const [label, setLabel] = useState('heure locale');

  useEffect(() => {
    try {
      const cached = localStorage.getItem('tz-city');
      if (cached && /^[A-Za-zÀ-ÿ\s-]+$/.test(cached)) {
        setLabel(buildLabel(cached));
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz.includes('/')) return; // "UTC", "GMT" n'ont pas de ville
      const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? null;
      if (!city || !/^[A-Za-zÀ-ÿ\s-]+$/.test(city)) return;
      setLabel(buildLabel(city));
      localStorage.setItem('tz-city', city);
    } catch {
      // localStorage indisponible (Safari privé) ou Intl absent
    }
  }, []);

  return label;
}
