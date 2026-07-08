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

// How many days a unit must wait before it can be picked again. Prevents
// near-term repeats without turning the schedule into a predictable full cycle.
const AVOID_RECENT_DAYS = 90;

// Deterministic daily pick with a recency window: each day picks a random unit
// (seeded by the date) that hasn't been used in the last AVOID_RECENT_DAYS days.
// Same for everyone, decoupled from the puzzle number. After the window a unit
// can recur, so it's varied and not a fixed permutation. We replay from the
// epoch to build the window (cheap — a few ms even years out).
export function dailyIndex(poolLen: number, d = new Date()): number {
  const dayNumber = Math.floor((utcMidnight(d) - EPOCH) / DAY_MS);
  const window = Math.min(AVOID_RECENT_DAYS, poolLen - 1);
  const recent: number[] = [];
  const recentSet = new Set<number>();
  let pick = 0;

  for (let day = 0; day <= dayNumber; day++) {
    const rnd = mulberry32((Math.imul(day + 1, 2654435761) ^ 0x9e3779b9) >>> 0);
    pick = Math.floor(rnd() * poolLen);
    // re-roll if it was used within the window (always resolves: window < pool)
    for (let attempt = 0; attempt < 64 && recentSet.has(pick); attempt++) {
      pick = Math.floor(rnd() * poolLen);
    }
    recent.push(pick);
    recentSet.add(pick);
    if (recent.length > window) recentSet.delete(recent.shift() as number);
  }
  return pick;
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
