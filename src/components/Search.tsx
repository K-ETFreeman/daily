import { useEffect, useMemo, useRef, useState } from 'react';
import type { Unit } from '../lib/units';
import { FACTION_COLOR } from '../lib/units';

interface Props {
  pool: Unit[];
  disabled?: boolean;
  onPick: (u: Unit) => void;
}

export function Search({ pool, disabled, onPick }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const starts: Unit[] = [];
    const contains: Unit[] = [];
    for (const u of pool) {
      const n = u.name.toLowerCase();
      if (n.startsWith(s)) starts.push(u);
      else if (n.includes(s) || u.desc.toLowerCase().includes(s)) contains.push(u);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [q, pool]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(u: Unit) {
    onPick(u);
    setQ('');
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(matches[active]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div className="search" ref={boxRef}>
      <input
        className="input"
        placeholder={disabled ? 'Solved — come back tomorrow' : 'Type a unit name…'}
        value={q}
        disabled={disabled}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        autoComplete="off"
        spellCheck={false}
      />
      {open && matches.length > 0 && (
        <div className="search__list">
          {matches.map((u, i) => (
            <button
              key={u.id}
              className={`search__item${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(u)}
            >
              <span className="search__dot" style={{ background: FACTION_COLOR[u.faction] }} />
              <span className="search__name">{u.name}</span>
              <span className="search__desc">{u.tech} · {u.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
