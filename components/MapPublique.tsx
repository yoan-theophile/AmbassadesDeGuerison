'use client';

import { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';

interface HostPin {
  id: string;
  first_name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  contact_mode: 'public' | 'form' | 'approval';
  is_full: boolean;
  accepted_count: number | null;
  capacity: number | null;
  whatsapp_group_url?: string;
  host_type: string;
}

function makeIcon(L: any, hostType: string, isFull: boolean) {
  const isChurch = hostType === 'eglise' || hostType === 'church';
  const bg = isFull ? '#ef4444' : isChurch ? '#7c3aed' : '#4f46e5';
  const symbol = isChurch
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M9 5h6M3 21h18M5 21V10l7-4 7 4v11M10 21v-5h4v5"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

  return L.divIcon({
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);display:flex;">${symbol}</span></div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -34],
  });
}

export default function MapPublique() {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hosts, setHosts] = useState<HostPin[]>([]);

  // Polling 30s pour les activations
  useEffect(() => {
    async function fetchHosts() {
      try {
        const res = await fetch('/api/host-activations');
        if (res.ok) {
          const data = await res.json();
          setHosts(data);
        }
      } catch {
        // réseau indisponible — on garde les données précédentes
      }
    }

    fetchHosts();
    const interval = setInterval(fetchHosts, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (cancelled || !containerRef.current) return;
      if ((containerRef.current as any)._leaflet_id) return;

      const map = L.map(containerRef.current).setView([20, 10], 3);
      if (cancelled) { map.remove(); return; }
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles by <a href="https://www.openstreetmap.fr" target="_blank">OSM France</a>',
        maxZoom: 20,
      }).addTo(map);
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Met à jour les pins quand les hosts changent
  useEffect(() => {
    async function updatePins() {
      if (!mapRef.current) return;
      const L = (await import('leaflet')).default;

      // Supprime les markers existants
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) mapRef.current!.removeLayer(layer);
      });

      // Ajoute les nouveaux
      hosts
        .filter((h) => h.lat && h.lng)
        .forEach((host) => {
          const fullBadge = host.is_full
            ? '<span class="inline-block bg-red-50 text-red-600 text-xs px-1.5 py-0.5 rounded font-medium ml-1">Complet</span>'
            : '';
          const popup = `
            <div style="min-width:190px;padding:2px 0">
              <p class="font-semibold text-slate-800 text-sm">${host.first_name}</p>
              <p class="text-xs text-slate-500 mt-0.5">${host.city}, ${host.country}</p>
              <p class="text-xs text-slate-500 mt-1">${host.accepted_count ?? 0}/${host.capacity ?? '?'} places${fullBadge}</p>
              ${host.whatsapp_group_url ? `<a href="${host.whatsapp_group_url}" target="_blank" class="text-emerald-600 text-xs mt-2 block hover:underline">Rejoindre le groupe WhatsApp</a>` : ''}
              ${!host.is_full ? `<a href="/ambassade/${host.id}" class="mt-2 inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-800">Contacter →</a>` : ''}
            </div>
          `;
          L.marker([host.lat, host.lng], { icon: makeIcon(L, host.host_type, host.is_full) })
            .addTo(mapRef.current!)
            .bindPopup(popup, { maxWidth: 240 });
        });
    }

    updatePins();
  }, [hosts]);

  return <div ref={containerRef} className="w-full h-full z-0" />;
}
