'use client';

import PhoneInputLib, { type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  label,
  id = 'phone-input',
  placeholder = '+33 6 12 34 56 78',
  required,
}: PhoneInputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <PhoneInputLib
        id={id}
        international
        defaultCountry="FR"
        value={value as Value}
        onChange={(v) => onChange(v ?? '')}
        placeholder={placeholder}
        required={required}
        className="phone-input"
      />
    </div>
  );
}
