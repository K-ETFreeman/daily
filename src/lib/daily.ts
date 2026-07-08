// Deterministic daily puzzle: every player gets the same unit for a given UTC
// date. No backend needed — the answer is a pure function of the date.

// The puzzle NUMBER is just a sequential daily counter (#1 = this day, then +1
// each UTC day). It is intentionally decoupled from the answer: the unit is a
// random hash of the date (see dailyIndex), so the number reveals nothing about
// which unit it is and you can't tell whether a unit has appeared before.
const EPOCH = Date.UTC(2026, 5, 28); // 2026-06-28 → ~#3 around launch
const DAY_MS = 86_400_000;

function utcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function todayKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
}

export function puzzleNumber(d = new Date()): number {
  return Math.floor((utcMidnight(d) - EPOCH) / DAY_MS) + 1;
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded daily permutation: within each full cycle of `poolLen` days every unit
// comes up exactly once (no repeats), the distribution is uniform across
// factions, and each cycle uses a different shuffle. Deterministic per UTC date
// and decoupled from the (sequential) puzzle number.
export function dailyIndex(poolLen: number, d = new Date()): number {
  const dayNumber = Math.floor((utcMidnight(d) - EPOCH) / DAY_MS);
  const cycle = Math.floor(dayNumber / poolLen);
  const pos = ((dayNumber % poolLen) + poolLen) % poolLen;
  const rnd = mulberry32((0x9e3779b9 ^ cycle) >>> 0);
  const order = Array.from({ length: poolLen }, (_, i) => i);
  for (let i = poolLen - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order[pos];
}

export function msUntilNextUTCDay(now = new Date()): number {
  const next = utcMidnight(now) + DAY_MS;
  return next - now.getTime();
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}
