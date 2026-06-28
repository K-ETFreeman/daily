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

  // Rank name-prefix > name-substring > desc-prefix > desc-substring, so typing
  // a role like "bomber" surfaces every faction's bombers. Generous + scrolls.
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
      <div className="flex items-center border border-line bg-surface focus-within:border-accent">
        <SearchIcon className="ml-3 h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.5} />
        <input
          className="w-full bg-transparent px-3 py-3.5 text-[15px] text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
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
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto border border-line bg-surface">
          {matches.map((u, i) => (
            <button
              key={u.id}
              className={`flex w-full items-center gap-3 border-b border-line/60 px-3 py-2.5 text-left last:border-b-0 ${
                i === active ? 'bg-surface2' : 'hover:bg-surface2/60'
              }`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(u)}
            >
              <UnitIcon unit={u} size={26} />
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">{u.name}</span>
              <span className="hidden shrink-0 font-mono text-[11px] uppercase tracking-wide text-neutral-500 sm:block">
                {u.tech} · {u.desc}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
