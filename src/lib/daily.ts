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

function dayNumberOf(d: Date): number {
  return Math.floor((utcMidnight(d) - EPOCH) / DAY_MS);
}

// Fresh seeded streams per day. The daily and challenge streams use different
// constants so their sequences are independent of each other.
function dailySeed(day: number): () => number {
  return mulberry32((Math.imul(day + 1, 2654435761) ^ 0x9e3779b9) >>> 0);
}
function challengeSeed(day: number): () => number {
  return mulberry32((Math.imul(day + 1, 2246822519) ^ 0x85ebca6b) >>> 0);
}

// Build the pick sequence [day 0 .. dayNumber] for a seed function, applying
// the recency window. `blocked(day, pick)` can veto extra values (the challenge
// uses it to never reuse that day's daily answer). Cheap: a few ms even years
// past the epoch. Same for everyone, decoupled from the puzzle number; after
// the window a unit can recur, so it's varied and not a fixed permutation.
function pickSeq(
  poolLen: number,
  dayNumber: number,
  seedFor: (day: number) => () => number,
  blocked?: (day: number, pick: number) => boolean
): number[] {
  const window = Math.min(AVOID_RECENT_DAYS, poolLen - 1);
  const recent: number[] = [];
  const recentSet = new Set<number>();
  const out: number[] = [];

  for (let day = 0; day <= dayNumber; day++) {
    const rnd = seedFor(day);
    let pick = Math.floor(rnd() * poolLen);
    // re-roll if used within the window (or vetoed); always resolves: window < pool
    for (
      let attempt = 0;
      attempt < 64 && (recentSet.has(pick) || (blocked ? blocked(day, pick) : false));
      attempt++
    ) {
      pick = Math.floor(rnd() * poolLen);
    }
    out.push(pick);
    recent.push(pick);
    recentSet.add(pick);
    if (recent.length > window) recentSet.delete(recent.shift() as number);
  }
  return out;
}

export function dailyIndex(poolLen: number, d = new Date()): number {
  const dayNumber = dayNumberOf(d);
  return pickSeq(poolLen, dayNumber, dailySeed)[dayNumber];
}

// The daily-challenge answer: a separate deterministic stream that is never the
// same unit as that day's normal daily, so solving one can't reveal the other.
export function challengeIndex(poolLen: number, d = new Date()): number {
  const dayNumber = dayNumberOf(d);
  const daily = pickSeq(poolLen, dayNumber, dailySeed);
  return pickSeq(poolLen, dayNumber, challengeSeed, (day, pick) => pick === daily[day])[dayNumber];
}

// Deterministic per-day RNG for feature logic that must be stable within a day
// but independent of the answer streams (e.g. which columns the daily challenge
// hides or lies about). `salt` yields an independent stream per use-site.
export function dayRng(d = new Date(), salt = 0): () => number {
  const day = dayNumberOf(d);
  return mulberry32(
    (Math.imul(day + 1, 2166136261) ^ Math.imul(salt + 1, 3266489917) ^ 0x27d4eb2f) >>> 0
  );
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
