import { useState } from 'react';
import type { Unit } from '../lib/units';
import { iconUrl } from '../lib/units';

interface Props {
  unit: Unit;
  size?: number;
  className?: string;
}

// Flat, sharp-cornered unit portrait with a neutral fallback (no glow).
export function UnitIcon({ unit, size = 40, className = '' }: Props) {
  const [err, setErr] = useState(false);
  const base = `shrink-0 border border-line bg-surface2 object-contain ${className}`;
  if (err) {
    return (
      <span
        className={`${base} grid place-items-center font-mono text-neutral-500`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-hidden
      >
        {unit.faction[0]}
      </span>
    );
  }
  return (
    <img
      className={base}
      src={iconUrl(unit.id)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}
