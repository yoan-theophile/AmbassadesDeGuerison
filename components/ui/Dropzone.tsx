'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  accept?: string;
  maxSizeMb?: number;
  preview?: string | null;
  onRemove?: () => void;
  label?: string;
  disabled?: boolean;
}

export default function Dropzone({
  onFile,
  accept = 'image/*',
  maxSizeMb = 5,
  preview,
  onRemove,
  label = 'Glissez une photo ou cliquez pour choisir',
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function validate(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées.');
      return false;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Taille max : ${maxSizeMb} Mo.`);
      return false;
    }
    setError('');
    return true;
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && validate(file)) onFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && validate(file)) onFile(file);
    e.target.value = '';
  }

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
        <img src={preview} alt="Aperçu" className="w-full h-40 object-cover" />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-slate-600 hover:text-red-600 shadow transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`
          flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors
          ${disabled ? 'cursor-not-allowed opacity-50 border-slate-200 bg-slate-50' : 'cursor-pointer border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'}
          ${dragging ? 'border-indigo-500 bg-indigo-50' : ''}
        `}
      >
        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          {dragging ? (
            <Upload className="w-5 h-5 text-indigo-500" />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xs text-slate-400">JPG, PNG, WebP — max {maxSizeMb} Mo</p>
      </div>
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
