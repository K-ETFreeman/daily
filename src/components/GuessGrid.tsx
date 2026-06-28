import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Unit } from '../lib/units';
import { FACTION_COLOR } from '../lib/units';
import { COLUMNS, compareRow } from '../lib/compare';
import type { Cell } from '../lib/compare';
import { UnitIcon } from './UnitIcon';

interface Props {
  guesses: Unit[];
  answer: Unit;
}

// Clear, distinguishable states: vivid green = exact, amber = partial,
// neutral gray = miss (so the positives stand out instead of a wall of red).
const TILE: Record<Cell['state'], { box: string; label: string }> = {
  hit: { box: 'bg-emerald-600/25 text-emerald-50', label: 'text-emerald-300/80' },
  partial: { box: 'bg-amber-500/25 text-amber-50', label: 'text-amber-300/80' },
  miss: { box: 'bg-surface2 text-neutral-300', label: 'text-neutral-500' },
};

function Tile({ label, cell }: { label: string; cell: Cell }) {
  const t = TILE[cell.state];
  return (
    <div className={`flex flex-col gap-1 px-2.5 py-2 ${t.box}`}>
      <span className={`font-mono text-[9px] font-semibold uppercase tracking-widest ${t.label}`}>{label}</span>
      <span className="flex items-center gap-1 text-[12px] font-medium leading-tight">
        <span className="line-clamp-3">{cell.text}</span>
        {cell.arrow === '↑' && <ChevronUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
        {cell.arrow === '↓' && <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
      </span>
    </div>
  );
}

export function GuessGrid({ guesses, answer }: Props) {
  if (guesses.length === 0) return null;
  const rows = [...guesses].reverse(); // newest first

  return (
    <div className="flex flex-col gap-3">
      {rows.map((g) => {
        const cells = compareRow(g, answer);
        return (
          <div key={g.id} className="border border-line bg-surface">
            <div
              className="flex items-center gap-3 border-b border-line px-4 py-3"
              style={{ borderLeft: `3px solid ${FACTION_COLOR[g.faction]}` }}
            >
              <UnitIcon unit={g} size={40} />
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold text-neutral-100">{g.name}</div>
                <div className="truncate font-mono text-[11px] uppercase tracking-wide text-neutral-500">{g.desc}</div>
              </div>
            </div>
            <div
              className="grid gap-px bg-line p-px"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))' }}
            >
              {COLUMNS.map((col, i) => (
                <Tile key={String(col.key)} label={col.label} cell={cells[i]} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
