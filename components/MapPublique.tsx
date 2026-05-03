'use client';

import { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';

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
  const bg = isFull ? '#ef4444' : isChurch ? '#4338ca' : '#4f46e5';
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

function formatEventDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatEventTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}

function StatsLine({ totalAmbassadors, totalCountries }: { totalAmbassadors: number; totalCountries: number }) {
  if (totalAmbassadors === 0) return null;
  return (
    <p className="text-slate-400 text-xs mt-3">
      {totalAmbassadors} ambassadeur{totalAmbassadors > 1 ? 's' : ''} · {totalCountries} pays
    </p>
  );
}

function EmptyMapContent({ nextEvent, lastEvent, liveInProgress, totalAmbassadors, totalCountries, soonThresholdDays }: Props) {
  const daysUntilNext = nextEvent
    ? Math.ceil((new Date(nextEvent.event_date).getTime() - Date.now()) / 86_400_000)
    : null;

  // Live en cours mais aucun hôte confirmé (cas rare)
  if (liveInProgress) {
    return (
      <>
        <p className="text-slate-700 text-sm font-medium">Live en cours</p>
        <p className="text-slate-400 text-xs mt-1">Les ambassades confirment leur participation...</p>
        <StatsLine totalAmbassadors={totalAmbassadors} totalCountries={totalCountries} />
        {lastEvent?.live_link && (
          <a
            href={lastEvent.live_link}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-indigo-600 text-xs font-medium hover:text-indigo-800 transition-colors"
          >
            Regarder le live →
          </a>
        )}
      </>
    );
  }

  // Prochain live dans ≤ soonThresholdDays jours (état "soon" — confirmations en cours)
  if (nextEvent && daysUntilNext !== null && daysUntilNext <= soonThresholdDays) {
    const label = daysUntilNext <= 0 ? "aujourd'hui" : `dans ${daysUntilNext} jour${daysUntilNext > 1 ? 's' : ''}`;
    return (
      <>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-medium mb-1">Prochain live</p>
        <p className="text-slate-800 text-sm font-semibold capitalize">{formatEventDate(nextEvent.event_date)}</p>
        <p className="text-slate-500 text-xs mt-0.5">à {formatEventTime(nextEvent.event_date)} · {label}</p>
        <p className="text-slate-400 text-xs mt-2.5">Les ambassades confirment leur participation...</p>
        <StatsLine totalAmbassadors={totalAmbassadors} totalCountries={totalCountries} />
        <a href="/temoignages" className="mt-3 inline-flex items-center gap-1 text-indigo-600 text-xs font-medium hover:text-indigo-800 transition-colors">
          Voir les témoignages →
        </a>
      </>
    );
  }

  // Prochain live dans > 2 jours (état "upcoming")
  if (nextEvent && daysUntilNext !== null) {
    return (
      <>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-medium mb-1">Prochain live</p>
        <p className="text-slate-800 text-sm font-semibold capitalize">{formatEventDate(nextEvent.event_date)}</p>
        <p className="text-slate-500 text-xs mt-0.5">à {formatEventTime(nextEvent.event_date)} · dans {daysUntilNext} jours</p>
        <p className="text-slate-400 text-xs mt-2.5">
          Les ambassades s&apos;afficheront dès qu&apos;elles confirmeront leur participation.
        </p>
        <StatsLine totalAmbassadors={totalAmbassadors} totalCountries={totalCountries} />
        <a href="/temoignages" className="mt-3 inline-flex items-center gap-1 text-indigo-600 text-xs font-medium hover:text-indigo-800 transition-colors">
          Voir les témoignages →
        </a>
      </>
    );
  }

  // Live terminé, pas de prochain live annoncé (état "closed" ou "past")
  if (lastEvent) {
    return (
      <>
        <p className="text-slate-700 text-sm font-medium">Dernier live</p>
        <p className="text-slate-500 text-xs mt-0.5 capitalize">{formatEventDate(lastEvent.event_date)}</p>
        <p className="text-slate-400 text-xs mt-2.5">Prochain live annoncé prochainement.</p>
        <StatsLine totalAmbassadors={totalAmbassadors} totalCountries={totalCountries} />
        <a href="/temoignages/nouveau" className="mt-3 inline-flex items-center gap-1 text-indigo-600 text-xs font-medium hover:text-indigo-800 transition-colors">
          Partager un témoignage →
        </a>
      </>
    );
  }

  // Aucun event — vrai état vide
  return (
    <>
      <p className="text-slate-700 text-sm font-medium">Pas encore de live prévu</p>
      <p className="text-slate-400 text-xs mt-1">Rejoignez la communauté des groupes de prière.</p>
      <a
        href="/inscription"
        className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Devenir ambassadeur
      </a>
    </>
  );
}

export default function MapPublique({ nextEvent, lastEvent, liveInProgress, totalAmbassadors, totalCountries, soonThresholdDays }: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hosts, setHosts] = useState<HostPin[]>([]);
  const hostsRef = useRef<HostPin[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [mapZoom, setMapZoom] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ lat: string; lon: string; display_name: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling 30s pour les activations
  useEffect(() => {
    async function fetchHosts() {
      setRefreshing(true);
      try {
        const res = await fetch('/api/host-activations');
        if (res.ok) {
          const data = await res.json();
          hostsRef.current = data;
          setHosts(data);
        }
      } catch {
        // réseau indisponible — on garde les données précédentes
      } finally {
        setRefreshing(false);
        setLoaded(true);
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

      const map = L.map(containerRef.current, { zoomControl: false }).setView([20, 10], 3);
      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      if (cancelled) { map.remove(); return; }
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles by <a href="https://www.openstreetmap.fr" target="_blank">OSM France</a>',
        maxZoom: 20,
      }).addTo(map);

      const LocateControl = L.Control.extend({
        onAdd() {
          const btn = L.DomUtil.create('button') as HTMLButtonElement;
          btn.title = 'Me localiser';
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" stroke-opacity=".3"/></svg>`;
          btn.style.cssText = 'background:white;border:none;border-radius:8px;padding:8px;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;';
          L.DomEvent.on(btn, 'click', () => map.locate({ setView: true, maxZoom: 7 }));
          return btn;
        },
      });
      new LocateControl({ position: 'bottomright' }).addTo(map);
      map.on('locationerror', () => { /* permission refusée — silencieux */ });

      function updateViewport() {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const visible = hostsRef.current.filter(
          (h) => h.lat && h.lng && bounds.contains([h.lat, h.lng] as [number, number])
        );
        setVisibleCount(visible.length);
        setMapZoom(zoom);
      }
      map.on('moveend zoomend', updateViewport);
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
              <p class="text-xs text-indigo-500 mt-1">Lieu de prière — lives de guérison</p>
              <p class="text-xs text-slate-500 mt-0.5">${host.accepted_count ?? 0}/${host.capacity ?? '?'} places${fullBadge}</p>
              ${host.whatsapp_group_url ? `<a href="${host.whatsapp_group_url}" target="_blank" class="text-emerald-600 text-xs mt-2 block hover:underline">Rejoindre le groupe WhatsApp</a>` : ''}
              ${!host.is_full ? `<a href="/ambassade/${host.id}" class="mt-2 inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-800">Contacter →</a>` : ''}
            </div>
          `;
          L.marker([host.lat, host.lng], { icon: makeIcon(L, host.host_type, host.is_full) })
            .addTo(mapRef.current!)
            .bindPopup(popup, { maxWidth: 280 });
        });
    }

    updatePins();

    // Recalcule les pins visibles après chaque mise à jour des hosts
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const zoom = mapRef.current.getZoom();
      const visible = hosts.filter(
        (h) => h.lat && h.lng && bounds.contains([h.lat, h.lng] as [number, number])
      );
      setVisibleCount(visible.length);
      setMapZoom(zoom);
    }
  }, [hosts]);

  // Nominatim (OSM) : politique d'usage = 1 req/s par IP.
  // Le debounce 400ms est suffisant pour un usage normal (< ~50 req/min par utilisateur).
  // TODO: migrer vers Photon (Komoot) ou Mapbox Geocoding si la base d'ambassadeurs
  // dépasse ~200 actifs et que le trafic simultané devient significatif (>50 users).
  // Photon est self-hostable et gratuit ; Mapbox nécessite une clé API.
  async function searchCity(query: string) {
    if (query.length < 2) { setSearchResults([]); setSearchOpen(false); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=fr`
      );
      if (!res.ok) return;
      const data = await res.json();
      setSearchResults(data);
      setSearchOpen(data.length > 0);
    } catch {
      // réseau indisponible
    }
  }

  function handleResultClick(lat: string, lon: string) {
    mapRef.current?.flyTo([parseFloat(lat), parseFloat(lon)], 10);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full z-0" />
      {/* Barre de recherche par ville */}
      <div className="absolute top-3 left-3 z-[1000] w-56 sm:w-64 pointer-events-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const q = e.target.value;
            setSearchQuery(q);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => searchCity(q), 400);
          }}
          onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          placeholder="Rechercher une ville…"
          className="w-full bg-white/95 backdrop-blur-sm border border-slate-100 rounded-xl shadow-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-shadow"
        />
        {searchOpen && searchResults.length > 0 && (
          <ul className="absolute top-full mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((r, i) => {
              const parts = r.display_name.split(', ');
              const city = parts[0];
              const country = parts[parts.length - 1];
              return (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => handleResultClick(r.lat, r.lon)}
                    className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-800">{city}</span>
                    {country !== city && <span className="text-slate-400 text-xs ml-1.5">{country}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* Carte vide — overlay contextuel selon l'état de l'app */}
      {loaded && hosts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-lg px-6 py-5 text-center max-w-xs pointer-events-auto">
            <EmptyMapContent
              nextEvent={nextEvent}
              lastEvent={lastEvent}
              liveInProgress={liveInProgress}
              totalAmbassadors={totalAmbassadors}
              totalCountries={totalCountries}
              soonThresholdDays={soonThresholdDays}
            />
          </div>
        </div>
      )}
      {/* Ambassadeurs existent ailleurs mais pas dans le viewport actuel */}
      {loaded && hosts.length > 0 && mapZoom >= 5 && (mapZoom < 8 || visibleCount === 0) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 shadow-md px-4 py-3 text-center pointer-events-auto">
            <p className="text-slate-600 text-xs">Pas d&apos;ambassade dans ta ville&nbsp;?</p>
            <a
              href="/inscription"
              className="mt-1.5 inline-flex items-center gap-1 text-indigo-600 text-xs font-medium hover:text-indigo-800 transition-colors"
            >
              Sois le premier ambassadeur ici →
            </a>
          </div>
        </div>
      )}
      {refreshing && (
        <div className="absolute top-3 right-12 z-[1000] bg-white/80 rounded-full p-1.5 shadow-sm">
          <svg className="animate-spin w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
