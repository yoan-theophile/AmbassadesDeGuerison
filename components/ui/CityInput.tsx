'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface CityResult {
  label: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

interface CityInputProps {
  value: string;
  onChange: (city: string, lat?: number, lng?: number) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function CityInput({
  value,
  onChange,
  id = 'city-input',
  label,
  placeholder = 'Lyon, Paris…',
  required,
}: CityInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync si value change de l'extérieur
  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`).catch(() => null);
      const data: CityResult[] = res?.ok ? await res.json() : [];
      setResults(data);
      setOpen(data.length > 0);
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Ferme le dropdown en cliquant ailleurs
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect(r: CityResult) {
    setQuery(r.city);
    setOpen(false);
    setResults([]);
    onChange(r.city, r.lat, r.lng);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v); // sans coordonnées — l'utilisateur tape librement
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
        <input
          id={id}
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
        />
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <li key={`${r.lat}-${r.lng}`}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 flex items-center gap-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
