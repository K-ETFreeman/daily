import { useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import type { Unit } from '../lib/units';
import { UnitIcon } from './UnitIcon';

interface Props {
  pool: Unit[];
  disabled?: boolean;
  onPick: (u: Unit) => void;
}

// Common shorthands expand to the words they should match in a unit's text.
const ALIASES: Record<string, string[]> = {
  tmd: ['tactical', 'missile', 'defense'],
  tml: ['tactical', 'missile', 'launcher'],
  smd: ['strategic', 'missile', 'defense'],
  sml: ['strategic', 'missile', 'launcher'],
  nuke: ['strategic', 'missile'],
  pd: ['point', 'defense'],
  aa: ['anti-air'],
  sam: ['anti-air'],
  mex: ['mass', 'extractor'],
  pgen: ['power'],
  acu: ['armored', 'command'],
  sacu: ['command'],
  asf: ['air', 'superiority'],
};

export function Search({ pool, disabled, onPick }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Multi-term AND search across faction / tier / type / name / description, so
  // "aeon land factory", "aeon tmd", "t3 cybran bomber", or just "aeon" work.
  // Aliases (tmd, mex, acu, …) expand to real words.
  //
  // Role / Weapon / Abilities are deliberately NOT searchable: those are grid
  // clues you're meant to deduce, and indexing them would let you enumerate the
  // answer set (e.g. typing "volatile" to list every Volatile unit).
  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const tokens = query.split(/\s+/).flatMap((t) => ALIASES[t] || [t]);
    const scored: { u: Unit; rank: number }[] = [];
    // stem tolerance so near-spellings still land ("fabrication" -> "Fabricator")
    const hit = (hay: string, t: string) =>
      hay.includes(t) || (t.length >= 5 && hay.includes(t.slice(0, 5)));
    for (const u of pool) {
      const hay = `${u.faction} ${u.tech} ${u.type} ${u.name} ${u.desc}`.toLowerCase();
      if (!tokens.every((t) => hit(hay, t))) continue;
      const n = u.name.toLowerCase();
      let rank = 3;
      if (n === query) rank = 0;
      else if (n.startsWith(query)) rank = 1;
      else if (n.includes(query)) rank = 2;
      scored.push({ u, rank });
    }
    scored.sort(
      (a, b) => a.rank - b.rank || a.u.name.localeCompare(b.u.name) || a.u.techRank - b.u.techRank
    );
    return scored.slice(0, 50).map((x) => x.u);
  }, [q, pool]);

  useEffect(() => setActive(0), [q]);

  // Focus the search box on load so you can type a guess the instant the page
  // opens. Only while playable — don't grab focus once the puzzle is solved.
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

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
        <SearchIcon className="ml-3 h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.5} />
        <input
          ref={inputRef}
          className="w-full bg-transparent px-3 py-3.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
          placeholder={disabled ? 'Solved — back tomorrow' : 'Search: name, role, "aeon land factory", "t3 bomber"…'}
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
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-[60vh] overflow-y-auto border border-line bg-surface">
          {matches.map((u, i) => (
            <button
              key={u.id}
              className={`flex w-full items-center gap-3 border-b border-line/60 px-3 py-2.5 text-left last:border-b-0 ${
                i === active ? 'bg-surface2' : 'hover:bg-surface2/60'
              }`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(u)}
            >
              <UnitIcon unit={u} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-100">{u.name}</span>
                <span className="block truncate font-mono text-[11px] uppercase tracking-wide text-slate-500">
                  {u.faction} · {u.tech}
                  {u.desc && u.desc !== u.name ? ` · ${u.desc}` : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
