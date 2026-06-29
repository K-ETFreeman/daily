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

// [unit] + 11 attribute columns. minmax(0,1fr) lets cells shrink to fit the
// container so there's no horizontal scroll on desktop (mobile falls back to
// the scroll wrapper via min-width below).
const COLS = 'minmax(168px,1.5fr) repeat(11, minmax(0,1fr))';

// Vibrant, distinct states. Hits/partials glow so the correct answers pop;
// misses are charcoal-slate (muted crimson text) and recede.
const CELL: Record<Cell['state'], string> = {
  hit: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/50 shadow-[0_0_16px_-4px_rgba(16,185,129,0.6)]',
  partial: 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/50 shadow-[0_0_16px_-4px_rgba(245,158,11,0.55)]',
  miss: 'bg-surface2 text-rose-200/55 ring-1 ring-inset ring-line',
};

function ValueCell({ cell }: { cell: Cell }) {
  return (
    <div className={`flex items-center justify-center gap-1 px-1.5 py-2.5 text-center text-[12px] font-bold leading-tight ${CELL[cell.state]}`}>
      <span className="line-clamp-2">{cell.text}</span>
      {cell.arrow === '↑' && <ChevronUp className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />}
      {cell.arrow === '↓' && <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />}
    </div>
  );
}

export function GuessGrid({ guesses, answer }: Props) {
  if (guesses.length === 0) return null;
  const rows = [...guesses].reverse(); // newest first

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[940px] space-y-2">
        {/* header */}
        <div className="grid items-end gap-2 px-1" style={{ gridTemplateColumns: COLS }}>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">Unit</span>
          {COLUMNS.map((c) => (
            <span key={String(c.key)} className="text-center font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
              {c.label}
            </span>
          ))}
        </div>

        {/* rows */}
        {rows.map((g, idx) => {
          const cells = compareRow(g, answer);
          const newest = idx === 0;
          return (
            <div key={g.id} className="grid animate-rise items-stretch gap-2" style={{ gridTemplateColumns: COLS }}>
              <div
                className={`flex items-center gap-2.5 bg-surface px-3 py-2 ring-1 ring-inset ${newest ? 'ring-accent/50' : 'ring-line'}`}
                style={{ borderLeft: `3px solid ${FACTION_COLOR[g.faction]}` }}
              >
                <UnitIcon unit={g} size={34} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-white">{g.name}</div>
                  {g.desc && g.desc !== g.name && (
                    <div className="truncate font-mono text-[10px] uppercase tracking-wide text-slate-500">{g.desc}</div>
                  )}
                </div>
              </div>
              {cells.map((cell, i) => (
                <ValueCell key={i} cell={cell} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
