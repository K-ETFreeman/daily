import type { Unit } from '../lib/units';
import { FACTION_COLOR } from '../lib/units';
import { COLUMNS, compareRow } from '../lib/compare';
import { UnitIcon } from './UnitIcon';

interface Props {
  guesses: Unit[];
  answer: Unit;
}

export function GuessGrid({ guesses, answer }: Props) {
  if (guesses.length === 0) return null;
  // newest first
  const rows = [...guesses].reverse();
  return (
    <div className="grid-scroll">
      <div className="grid" style={{ gridTemplateColumns: `minmax(180px,1.5fr) repeat(${COLUMNS.length}, minmax(86px,1fr))` }}>
        <div className="grid__head grid__unit">Unit</div>
        {COLUMNS.map((c) => (
          <div key={String(c.key)} className="grid__head">{c.label}</div>
        ))}

        {rows.map((g) => {
          const cells = compareRow(g, answer);
          return (
            <div className="grid__row" key={g.id} style={{ display: 'contents' }}>
              <div className="cell cell--unit" style={{ borderColor: FACTION_COLOR[g.faction] }}>
                <UnitIcon unit={g} size={34} />
                <span className="cell__txt">
                  <span className="cell__name">{g.name}</span>
                  <span className="cell__sub">{g.desc}</span>
                </span>
              </div>
              {cells.map((cell, i) => (
                <div key={i} className={`cell cell--${cell.state} anim-flip`} style={{ animationDelay: `${i * 45}ms` }}>
                  <span>{cell.text}</span>
                  {cell.arrow && <span className="cell__arrow">{cell.arrow}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
