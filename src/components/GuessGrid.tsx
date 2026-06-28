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

// Outlined state coding — clearly distinct hues: green = exact, amber =
// partial, red = miss. The border + value carry the colour; the label stays
// neutral so the grid reads cleanly.
const TILE: Record<Cell['state'], string> = {
  hit: 'border-emerald-500/70 text-emerald-200',
  partial: 'border-amber-500/70 text-amber-200',
  miss: 'border-red-500/45 text-red-200/75',
};

function Tile({ label, cell }: { label: string; cell: Cell }) {
  return (
    <div className={`flex flex-col gap-1 border bg-canvas/40 px-2.5 py-2 ${TILE[cell.state]}`}>
      <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
      <span className="flex items-center gap-1 text-[12px] font-semibold leading-tight">
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
      {rows.map((g, idx) => {
        const cells = compareRow(g, answer);
        const newest = idx === 0;
        return (
          <div
            key={g.id}
            className={`animate-rise border bg-surface ${newest ? 'border-accent/40' : 'border-line'}`}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderLeft: `3px solid ${FACTION_COLOR[g.faction]}` }}
            >
              <UnitIcon unit={g} size={42} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-neutral-50">{g.name}</div>
                <div className="truncate font-mono text-[11px] uppercase tracking-wide text-neutral-500">{g.desc}</div>
              </div>
            </div>
            <div
              className="grid gap-2 px-4 pb-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}
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
