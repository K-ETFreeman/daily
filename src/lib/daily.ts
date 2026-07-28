// Deterministic per-UTC-day date helpers for the daily puzzle.
//
// The ANSWER itself is no longer resolved here: it's computed on the server
// (server/answer.ts) behind a secret salt, so the pick can't be reproduced from
// this bundle. What remains is date math the client legitimately needs (the
// puzzle number, the countdown) plus two primitives the challenge config and the
// server share (mulberry32, dayNumberOf).

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

// The puzzle NUMBER is a sequential daily counter (#1 = the epoch day, +1 each
// UTC day), intentionally decoupled from the answer so it reveals nothing.
export function puzzleNumber(d = new Date()): number {
  return Math.floor((utcMidnight(d) - EPOCH) / DAY_MS) + 1;
}

// Days since the epoch (0-based) — the seed input for the answer streams.
export function dayNumberOf(d: Date): number {
  return Math.floor((utcMidnight(d) - EPOCH) / DAY_MS);
}

export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic per-day RNG for feature logic that must be stable within a day
// but independent of the answer stream (e.g. which columns the daily challenge
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
