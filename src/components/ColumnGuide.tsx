import { ChevronDown, HelpCircle } from 'lucide-react';
import { buildColumnGuide } from '../lib/columnGuide';

// Compact number for the value ranges: 6,000,000 → 6m, 250,200 → 250k.
function fmt(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}m`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString('en-US');
}

// Collapsed-by-default reference of every column and the values it can show, so
// players can see what's possible without being nagged. Values come from the
// live data (see buildColumnGuide), so this stays in sync automatically.
export function ColumnGuide() {
  const guide = buildColumnGuide();
  return (
    <details className="group mt-4 border border-line bg-surface">
      <summary className="flex cursor-pointer list-none select-none items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
        <HelpCircle className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
        What each column can show
        <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180" strokeWidth={2.5} />
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-4">
        {guide.map((g) => (
          <div key={g.key} className="grid gap-1 sm:grid-cols-[104px_1fr] sm:gap-4">
            <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-200">
              {g.label}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] leading-snug text-slate-400">{g.desc}</p>
              {g.values && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {g.values.map((v) => (
                    <span
                      key={v}
                      className="border border-line bg-surface2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-300"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
              {g.range && (
                <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                  in-game range: {fmt(g.range[0])} – {fmt(g.range[1])}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
