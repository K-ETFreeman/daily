import { ChevronUp, ChevronDown, Lock } from 'lucide-react';
import type { Unit } from '../lib/units';
import { FACTION_COLOR } from '../lib/units';
import { COLUMNS } from '../lib/compare';
import type { Cell } from '../lib/compare';
import { UnitIcon } from './UnitIcon';

/** A guessed unit paired with its server-computed comparison cells. */
export interface GuessResult {
  unit: Unit;
  cells: Cell[];
}

interface Props {
  results: GuessResult[];
  /** Column keys to mask (daily-challenge hidden stats). */
  hidden?: Set<string>;
}

// Unit + 6 single-value cols + Role (wider) + 3 numeric + Abilities (widest),
// matching the COLUMNS order. Multi-value columns get more room.
const COLS =
  'minmax(168px,1.5fr) repeat(6, minmax(0,1fr)) minmax(0,1.4fr) repeat(3, minmax(0,1fr)) minmax(0,2.2fr)';

// Desktop cells: vibrant, with a glow on hits/partials so correct answers pop;
// misses are charcoal-slate (muted crimson) and recede.
const CELL: Record<Cell['state'], string> = {
  hit: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/50 shadow-[0_0_16px_-4px_rgba(16,185,129,0.6)]',
  partial: 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/50 shadow-[0_0_16px_-4px_rgba(245,158,11,0.55)]',
  miss: 'bg-surface2 text-rose-200/55 ring-1 ring-inset ring-line',
};

// Mobile tiles: same hues, separated by the hairline grid (no ring needed).
const MCELL: Record<Cell['state'], string> = {
  hit: 'bg-emerald-500/15 text-emerald-300',
  partial: 'bg-amber-500/15 text-amber-300',
  miss: 'bg-surface2 text-rose-200/60',
};

function Arrow({ cell }: { cell: Cell }) {
  if (cell.arrow === '↑') return <ChevronUp className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />;
  if (cell.arrow === '↓') return <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />;
  return null;
}

// Multi-value cells render each value as its own stacked tag (no commas);
// single-value cells render the text + an optional higher/lower arrow.
function CellBody({ cell }: { cell: Cell }) {
  if (cell.list) {
    return (
      <div className="flex w-full flex-col gap-0.5">
        {cell.list.map((item, i) => (
          <span key={i} className="whitespace-normal text-[10px] font-semibold leading-tight">
            {item}
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="flex items-center justify-center gap-1 break-words">
      {cell.text}
      <Arrow cell={cell} />
    </span>
  );
}

function UnitHead({ g, size }: { g: Unit; size: number }) {
  return (
    <>
      <UnitIcon unit={g} size={size} />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold text-white">{g.name}</div>
        {g.desc && g.desc !== g.name && (
          <div className="truncate font-mono text-[10px] uppercase tracking-wide text-slate-500">{g.desc}</div>
        )}
      </div>
    </>
  );
}

export function GuessGrid({ results, hidden }: Props) {
  if (results.length === 0) return null;
  const rows = [...results].reverse(); // newest first

  return (
    <>
      {/* ---------- desktop / wide: dense single-row table ---------- */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[940px] space-y-2">
          <div className="grid items-end gap-2 px-1" style={{ gridTemplateColumns: COLS }}>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">Unit</span>
            {COLUMNS.map((c) => {
              const masked = hidden?.has(String(c.key));
              return (
                <span
                  key={String(c.key)}
                  className={`flex items-center justify-center gap-1 text-center font-mono text-[9px] font-bold uppercase tracking-widest ${
                    masked ? 'text-slate-600' : 'text-slate-500'
                  }`}
                >
                  {masked && <Lock className="h-2.5 w-2.5 shrink-0" strokeWidth={3} />}
                  {c.label}
                </span>
              );
            })}
          </div>

          {rows.map(({ unit: g, cells }, idx) => {
            const newest = idx === 0;
            return (
              <div key={g.id} className="grid animate-rise items-stretch gap-2" style={{ gridTemplateColumns: COLS }}>
                <div
                  className={`flex items-center gap-2.5 bg-surface px-3 py-2 ring-1 ring-inset ${newest ? 'ring-accent/50' : 'ring-line'}`}
                  style={{ borderLeft: `3px solid ${FACTION_COLOR[g.faction]}` }}
                >
                  <UnitHead g={g} size={34} />
                </div>
                {cells.map((cell, i) => {
                  if (hidden?.has(String(COLUMNS[i].key))) {
                    return (
                      <div
                        key={i}
                        title="Hidden this round"
                        className="flex items-center justify-center bg-surface2/60 px-1.5 py-2 ring-1 ring-inset ring-line"
                      >
                        <Lock className="h-3.5 w-3.5 text-slate-600" strokeWidth={2.5} />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center px-1.5 py-2 text-center text-[12px] font-bold leading-tight ${CELL[cell.state]}`}
                    >
                      <CellBody cell={cell} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- mobile / narrow: per-guess card + tile grid ---------- */}
      <div className="space-y-3 lg:hidden">
        {rows.map(({ unit: g, cells }, idx) => {
          const newest = idx === 0;
          return (
            <div
              key={g.id}
              className={`animate-rise border bg-surface ${newest ? 'border-accent/50' : 'border-line'}`}
              style={{ borderLeft: `3px solid ${FACTION_COLOR[g.faction]}` }}
            >
              <div className="flex items-center gap-3 border-b border-line px-3 py-2.5">
                <UnitHead g={g} size={40} />
              </div>
              <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
                {COLUMNS.map((col, i) => {
                  const masked = hidden?.has(String(col.key));
                  return (
                    <div
                      key={String(col.key)}
                      className={`flex flex-col gap-1 px-3 py-2 ${masked ? 'bg-surface2/60' : MCELL[cells[i].state]}`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest ${
                          masked ? 'text-slate-600' : 'text-slate-500'
                        }`}
                      >
                        {masked && <Lock className="h-2.5 w-2.5 shrink-0" strokeWidth={3} />}
                        {col.label}
                      </span>
                      <div className="text-[13px] font-bold leading-tight">
                        {masked ? <span className="text-slate-600">Hidden</span> : <CellBody cell={cells[i]} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
