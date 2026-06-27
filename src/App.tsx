import { useCallback, useEffect, useMemo, useState } from 'react';
import { UNITS, FACTION_COLOR, findById } from './lib/units';
import type { Unit } from './lib/units';
import { dailyIndex, todayKey, puzzleNumber, msUntilNextUTCDay, formatCountdown } from './lib/daily';
import { compareRow, rowEmoji } from './lib/compare';
import { Search } from './components/Search';
import { GuessGrid } from './components/GuessGrid';
import { UnitIcon } from './components/UnitIcon';
import { Ambient } from './components/Ambient';

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
  const [copied, setCopied] = useState(false);
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

  function share() {
    const lines = guesses.map((g) => rowEmoji(compareRow(g, answer)));
    const text =
      `FAF Unitdle #${puzzleNumber()} — ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}\n` +
      lines.join('\n') +
      `\n${location.origin}`;
    navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => {}
    );
  }

  return (
    <div className="page">
      <Ambient />
      <header className="hero anim-rise">
        <span className="label text-amber">// Supreme Commander: Forged Alliance</span>
        <h1 className="display title">
          FAF<span className="text-amber">Unitdle</span>
        </h1>
        <p className="muted sub">
          One mystery unit each day. Guess any unit — the grid tells you which attributes match.{' '}
          <strong className="text-signal">Green</strong> = match,{' '}
          <strong style={{ color: 'var(--amber)' }}>amber</strong> = partial / close,{' '}
          <strong className="text-alert">red</strong> = no. ↑/↓ = answer is higher / lower.
        </p>
        <div className="row gap wrap">
          <span className="chip">PUZZLE #{puzzleNumber()}</span>
          <span className="chip chip--amber">{UNITS.length} UNITS</span>
          <span className="chip">{guesses.length} GUESSES</span>
        </div>
      </header>

      {!solved && (
        <div className="searchbar anim-rise d1">
          <Search pool={pool} onPick={onPick} />
        </div>
      )}

      {solved && <WinCard answer={answer} guesses={guesses.length} now={now} onShare={share} copied={copied} />}

      <GuessGrid guesses={guesses} answer={answer} />

      <footer className="foot muted">
        Unit data from the FAF unit database · {UNITS.length} base-faction units (Nomads excluded) · resets at 00:00 UTC
      </footer>
    </div>
  );
}

function WinCard({
  answer,
  guesses,
  now,
  onShare,
  copied,
}: {
  answer: Unit;
  guesses: number;
  now: number;
  onShare: () => void;
  copied: boolean;
}) {
  const left = msUntilNextUTCDay(new Date(now));
  return (
    <div className="wincard">
      <div className="wincard__top">
        <UnitIcon unit={answer} size={72} />
        <div>
          <span className="label text-signal">// Identified</span>
          <h2 className="heading" style={{ borderColor: FACTION_COLOR[answer.faction] }}>
            {answer.name}
          </h2>
          <p className="muted">
            {answer.faction} · {answer.tech} · {answer.desc}
          </p>
        </div>
      </div>
      <p className="mono win-line">
        Solved in <span className="text-signal">{guesses}</span> guess{guesses === 1 ? '' : 'es'}.
      </p>
      <div className="row gap wrap">
        <button className="btn btn--primary" onClick={onShare}>
          {copied ? 'Copied ✓' : '⤴ Share result'}
        </button>
        <span className="chip">Next unit in {formatCountdown(left)}</span>
      </div>
    </div>
  );
}
