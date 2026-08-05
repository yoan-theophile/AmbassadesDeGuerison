interface AvatarProps {
  photoUrl: string | null;
  firstName: string;
  size?: number;
  className?: string;
}

export default function Avatar({ photoUrl, firstName, size = 32, className = '' }: AvatarProps) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = (firstName || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      className={`rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
