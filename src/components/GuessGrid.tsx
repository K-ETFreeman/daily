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

// Desaturated, flat coding: green = exact, amber = partial, red = miss.
const STATE_CLASS: Record<Cell['state'], string> = {
  hit: 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200',
  partial: 'border-amber-500/30 bg-amber-500/[0.08] text-amber-200',
  miss: 'border-neutral-800 bg-rose-500/[0.05] text-rose-300/80',
};

export function GuessGrid({ guesses, answer }: Props) {
  if (guesses.length === 0) return null;
  const rows = [...guesses].reverse(); // newest first
  const cols = `minmax(150px,1.3fr) repeat(${COLUMNS.length}, minmax(82px,1fr))`;

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[860px] gap-px" style={{ gridTemplateColumns: cols }}>
        {/* header */}
        <div className="px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-widest text-neutral-600">
          Unit
        </div>
        {COLUMNS.map((c) => (
          <div key={String(c.key)} className="px-1 py-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            {c.label}
          </div>
        ))}

        {/* rows */}
        {rows.map((g) => {
          const cells = compareRow(g, answer);
          return (
            <div key={g.id} className="contents">
              <div
                className="flex items-center gap-2 border border-neutral-800 bg-neutral-900 px-2 py-2"
                style={{ borderLeft: `2px solid ${FACTION_COLOR[g.faction]}55` }}
              >
                <UnitIcon unit={g} size={30} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-neutral-100">{g.name}</div>
                  <div className="truncate font-mono text-[10px] text-neutral-500">{g.desc}</div>
                </div>
              </div>
              {cells.map((cell, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center gap-0.5 border px-1 py-2 text-center font-mono text-[11px] leading-tight ${STATE_CLASS[cell.state]}`}
                >
                  <span className="flex items-center gap-0.5">
                    <span className="line-clamp-2">{cell.text}</span>
                    {cell.arrow === '↑' && <ChevronUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                    {cell.arrow === '↓' && <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
