import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share2, Clock } from 'lucide-react';
import { UNITS, findById } from './lib/units';
import type { Unit } from './lib/units';
import { dailyIndex, todayKey, puzzleNumber, msUntilNextUTCDay, formatCountdown } from './lib/daily';
import { buildShareImage } from './lib/shareImage';
import { Search } from './components/Search';
import { GuessGrid } from './components/GuessGrid';
import { UnitIcon } from './components/UnitIcon';

const STORE_KEY = 'faf-daily';
const DATA_URL = 'https://unitdb.faforever.com/';

interface Saved {
  date: string;
  guesses: string[];
  solved: boolean;
}

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORE_KEY) ?? localStorage.getItem('faf-unitdle');
    if (raw) {
      const s = JSON.parse(raw) as Saved;
      if (s.date === todayKey()) return s;
    }
  } catch {
    /* ignore */
  }
  return { date: todayKey(), guesses: [], solved: false };
}

export default function App() {
  const answer = useMemo(() => UNITS[dailyIndex(UNITS.length)], []);
  const initial = useMemo(loadSaved, []);
  const [guesses, setGuesses] = useState<Unit[]>(
    () => initial.guesses.map(findById).filter((u): u is Unit => !!u)
  );
  const solved = guesses.some((g) => g.id === answer.id);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const saved: Saved = { date: todayKey(), guesses: guesses.map((g) => g.id), solved };
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  }, [guesses, solved]);

  useEffect(() => {
    if (!solved) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [solved]);

  const guessedIds = new Set(guesses.map((g) => g.id));
  const pool = useMemo(() => UNITS.filter((u) => !guessedIds.has(u.id)), [guesses]);

  const onPick = useCallback(
    (u: Unit) => {
      if (solved) return;
      setGuesses((prev) => (prev.some((g) => g.id === u.id) ? prev : [...prev, u]));
    },
    [solved]
  );

  const showIntro = !solved && guesses.length === 0;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-14">
        {/* header */}
        <header className="border-b border-line pb-5">
          <h1 className="font-mono text-xl font-semibold uppercase tracking-[0.2em] text-slate-100">
            FAF <span className="text-accent">Daily</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Guess the daily Forged Alliance unit.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-slate-500">
            <span>Puzzle #{puzzleNumber()}</span>
            <span className="text-slate-700">/</span>
            <span>{UNITS.length} units</span>
            <span className="text-slate-700">/</span>
            <span>{guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}</span>
          </div>
        </header>

        {/* how to play (landing) */}
        {showIntro && (
          <section className="mt-6 border border-line bg-surface p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">How to play</p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
              A random Forged Alliance unit is picked every day. Type any unit to guess — each guess
              reveals how it compares to today's unit across its stats.{' '}
              <span className="font-semibold text-emerald-300">Green</span> = that attribute matches,{' '}
              <span className="font-semibold text-amber-300">amber</span> = partial match, and{' '}
              <span className="font-semibold text-slate-200">↑ / ↓</span> means the answer is higher / lower.
              Use the clues to identify it in as few tries as possible.
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-slate-500">
              Search by name, role, or faction — e.g. “aeon bomber”, “t3 land factory”.
            </p>
          </section>
        )}

        {/* input / win */}
        <div className="mt-7">
          {solved ? (
            <WinCard answer={answer} guesses={guesses} now={now} />
          ) : (
            <Search pool={pool} onPick={onPick} />
          )}
        </div>

        {/* legend */}
        {guesses.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            <Legend className="bg-emerald-500/20 ring-1 ring-inset ring-emerald-400/50" label="Match" />
            <Legend className="bg-amber-500/20 ring-1 ring-inset ring-amber-400/50" label="Partial" />
            <Legend className="bg-surface2 ring-1 ring-inset ring-line" label="Miss" />
            <span className="text-slate-500">↑ / ↓ answer is higher / lower</span>
          </div>
        )}

        {/* guesses */}
        <div className="mt-3">
          <GuessGrid guesses={guesses} answer={answer} />
        </div>

        <footer className="mt-14 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-widest text-slate-600">
          <span>{UNITS.length} units · resets 00:00 UTC</span>
          <span className="text-slate-700">·</span>
          <a
            href={DATA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 underline decoration-slate-700 underline-offset-2 transition-colors hover:text-accent"
          >
            Unit data &amp; icons from the FAF Unit Database ↗
          </a>
        </footer>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 ${className}`} />
      {label}
    </span>
  );
}

function WinCard({ answer, guesses, now }: { answer: Unit; guesses: Unit[]; now: number }) {
  const left = msUntilNextUTCDay(new Date(now));
  const count = guesses.length;
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  function captionFor(spoilerFree: boolean) {
    const base = `FAF Daily #${puzzleNumber()} — solved in ${count} ${count === 1 ? 'try' : 'tries'}. Try it yourself: ${location.origin}`;
    return spoilerFree ? base : `⚠️ Spoilers ⚠️ ${base}`;
  }

  async function share(spoilerFree: boolean) {
    setBusy(true);
    setFlash(null);
    try {
      const blob = await buildShareImage(guesses, answer, { spoilerFree });
      if (!blob) return;
      const name = `${spoilerFree ? '' : 'SPOILER_'}faf-daily-${puzzleNumber()}.png`;
      const file = new File([blob], name, { type: 'image/png' });
      const nav = navigator as Navigator & {
        canShare?: (d: unknown) => boolean;
        share?: (d: unknown) => Promise<void>;
      };
      // Touch devices → native share sheet (Discord auto-blurs the SPOILER_ file).
      const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
      if (coarse && nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], text: captionFor(spoilerFree) });
        setFlash('Shared');
      } else {
        // Desktop → copy the image to the clipboard (no download).
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setFlash(
          spoilerFree
            ? 'Copied — paste it into Discord'
            : 'Copied — paste into Discord, then click “Mark as spoiler”'
        );
      }
      setTimeout(() => setFlash(null), 5000);
    } catch {
      /* cancelled or error — ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center gap-4 border-b border-line p-5">
        <UnitIcon unit={answer} size={84} />
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Identified</p>
          <h2 className="mt-1 truncate text-xl font-semibold text-slate-100 sm:text-2xl">{answer.name}</h2>
          <p className="mt-0.5 truncate font-mono text-xs uppercase tracking-wide text-slate-500">
            {answer.faction} · {answer.tech} · {answer.desc}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
            Solved in <span className="text-emerald-300">{count}</span> {count === 1 ? 'try' : 'tries'}
          </p>
          <span className="inline-flex items-center gap-2 border border-accent/70 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            Next unit {formatCountdown(left)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => share(true)}
            disabled={busy}
            title="Just the colored squares — reveals nothing"
            className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-950 transition-colors hover:bg-white disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
            {busy ? 'Rendering…' : 'Share (no spoilers)'}
          </button>
          <button
            onClick={() => share(false)}
            disabled={busy}
            title="Shows your guessed units (answer hidden) — spoilers"
            className="inline-flex items-center gap-2 border border-line px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
            With guesses
          </button>
        </div>
      </div>

      {flash && <p className="px-5 pb-5 font-mono text-[11px] text-emerald-300">{flash}</p>}
    </div>
  );
}
