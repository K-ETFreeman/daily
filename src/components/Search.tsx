import { useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import type { Unit } from '../lib/units';
import { UnitIcon } from './UnitIcon';

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

  // Rank: name-prefix > name-substring > desc-prefix > desc-substring.
  // Searching the description is what surfaces e.g. every "Bomber" across
  // factions; the list is generous (40) and scrolls, so nothing gets clipped.
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const scored: { u: Unit; rank: number }[] = [];
    for (const u of pool) {
      const name = u.name.toLowerCase();
      const desc = u.desc.toLowerCase();
      let rank = -1;
      if (name.startsWith(s)) rank = 0;
      else if (name.includes(s)) rank = 1;
      else if (desc.startsWith(s)) rank = 2;
      else if (desc.includes(s)) rank = 3;
      if (rank >= 0) scored.push({ u, rank });
    }
    scored.sort((a, b) => a.rank - b.rank || a.u.name.localeCompare(b.u.name));
    return scored.slice(0, 40).map((x) => x.u);
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
    <div className="relative" ref={boxRef}>
      <div className="flex items-center border border-neutral-800 bg-neutral-900 focus-within:border-accent">
        <SearchIcon className="ml-3 h-4 w-4 shrink-0 text-neutral-600" strokeWidth={1.5} />
        <input
          className="w-full bg-transparent px-3 py-3 text-[15px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
          placeholder={disabled ? 'Solved — back tomorrow' : 'Type a unit name or role…'}
          value={q}
          disabled={disabled}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto border border-neutral-800 bg-neutral-900">
          {matches.map((u, i) => (
            <button
              key={u.id}
              className={`flex w-full items-center gap-3 border-b border-neutral-800/70 px-3 py-2 text-left last:border-b-0 ${
                i === active ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'
              }`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(u)}
            >
              <UnitIcon unit={u} size={26} />
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">{u.name}</span>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                {u.faction} · {u.tech} · {u.desc}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
