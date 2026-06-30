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

// FNV-1a string hash → spreads consecutive dates across the pool.
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailyIndex(poolLen: number, key = todayKey()): number {
  return hash(key) % poolLen;
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
