import { useState } from 'react';
import type { Unit } from '../lib/units';
import { FACTION_COLOR, iconUrl } from '../lib/units';

interface Props {
  unit: Unit;
  size?: number;
}

export function UnitIcon({ unit, size = 40 }: Props) {
  const [err, setErr] = useState(false);
  const color = FACTION_COLOR[unit.faction];
  if (err) {
    return (
      <span
        className="uicon uicon--ph"
        style={{ width: size, height: size, borderColor: color, color }}
        aria-hidden
      >
        {unit.faction[0]}
      </span>
    );
  }
  return (
    <img
      className="uicon"
      src={iconUrl(unit.id)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErr(true)}
      style={{ borderColor: color }}
    />
  );
}
