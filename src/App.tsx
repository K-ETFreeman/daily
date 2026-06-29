import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share2, Check, Clock } from 'lucide-react';
import { UNITS, findById } from './lib/units';
import type { Unit } from './lib/units';
import { dailyIndex, todayKey, puzzleNumber, msUntilNextUTCDay, formatCountdown } from './lib/daily';
import { Search } from './components/Search';
import { GuessGrid } from './components/GuessGrid';
import { UnitIcon } from './components/UnitIcon';

const STORE_KEY = 'faf-unitdle';

interface Saved {
  date: string;
  guesses: string[];
  solved: boolean;
}

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORE_KEY);
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-14">
        {/* header */}
        <header className="border-b border-line pb-5">
          <h1 className="font-mono text-xl font-semibold uppercase tracking-[0.2em] text-neutral-100">
            FAF <span className="text-accent">Unitdle</span>
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">Identify the daily Forged Alliance unit.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
            <span>Puzzle #{puzzleNumber()}</span>
            <span className="text-neutral-700">/</span>
            <span>{UNITS.length} units</span>
            <span className="text-neutral-700">/</span>
            <span>{guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}</span>
          </div>
        </header>

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
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            <Legend className="bg-emerald-500/20 ring-1 ring-inset ring-emerald-400/50" label="Match" />
            <Legend className="bg-amber-500/20 ring-1 ring-inset ring-amber-400/50" label="Partial" />
            <Legend className="bg-surface2 ring-1 ring-inset ring-line" label="Miss" />
            <span className="text-neutral-500">↑ / ↓ answer is higher / lower</span>
          </div>
        )}

        {/* guesses */}
        <div className="mt-3">
          <GuessGrid guesses={guesses} answer={answer} />
        </div>

        <footer className="mt-14 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
          {UNITS.length} units · resets 00:00 UTC
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
  const [copied, setCopied] = useState(false);
  const left = msUntilNextUTCDay(new Date(now));
  const count = guesses.length;

  function onShare() {
    const text =
      `FAF Unitdle #${puzzleNumber()} — solved in ${count} ${count === 1 ? 'try' : 'tries'}\n${location.origin}`;
    navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => {}
    );
  }

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center gap-4 border-b border-line p-5">
        <UnitIcon unit={answer} size={84} />
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Identified</p>
          <h2 className="mt-1 truncate text-2xl font-semibold text-neutral-100">{answer.name}</h2>
          <p className="mt-0.5 truncate font-mono text-xs uppercase tracking-wide text-neutral-500">
            {answer.faction} · {answer.tech} · {answer.desc}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            Solved in <span className="text-emerald-300">{count}</span> {count === 1 ? 'try' : 'tries'}
          </p>
          <span className="inline-flex items-center gap-2 border border-accent/70 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            Next unit {formatCountdown(left)}
          </span>
        </div>
        <button
          onClick={onShare}
          className="inline-flex items-center gap-2 bg-neutral-100 px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-neutral-950 transition-colors hover:bg-white"
        >
          {copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Share2 className="h-4 w-4" strokeWidth={2} />}
          {copied ? 'Copied' : 'Share result'}
        </button>
      </div>
    </div>
  );
}
