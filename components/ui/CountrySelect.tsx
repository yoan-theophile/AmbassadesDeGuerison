'use client';

import { getCountries } from 'react-phone-number-input';
import fr from 'react-phone-number-input/locale/fr.json';

interface CountrySelectProps {
  value: string;
  onChange: (countryName: string) => void;
  id?: string;
  label?: string;
  required?: boolean;
}

const countries = getCountries()
  .map((code) => ({ code, name: (fr as Record<string, string>)[code] ?? code }))
  .filter((c) => c.name)
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

const PINNED = ['FR', 'BE', 'CH', 'CA', 'LU', 'MA', 'SN', 'CI', 'CM'];

const pinnedCountries = PINNED
  .map((code) => ({ code, name: (fr as Record<string, string>)[code] ?? code }))
  .filter((c) => c.name);

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';

export default function CountrySelect({ value, onChange, id = 'country-select', label, required }: CountrySelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        <optgroup label="Pays fréquents">
          {pinnedCountries.map((c) => (
            <option key={c.code} value={c.name}>{c.name}</option>
          ))}
        </optgroup>
        <optgroup label="Tous les pays">
          {countries.map((c) => (
            <option key={c.code} value={c.name}>{c.name}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
