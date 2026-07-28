/// <reference types="node" />
// Tiny dependency-free Node service for FAF Daily. Run with tsx (no build step):
//   npx tsx server/index.ts
// It is meant to sit on the private Docker network; the nginx container proxies
// /api/* to it. It never trusts a client-supplied date — every request resolves
// against the server's current UTC day, so tomorrow can't be pre-fetched.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildState } from './state';
import type { Mode } from './answer';

const PORT = Number(process.env.PORT) || 8090;
const SECRET_FILE = process.env.DAILY_SECRET_FILE || '/data/secret';

// A stable server secret salts the answer streams. Prefer an explicit env var;
// otherwise generate one once and persist it so answers stay stable across
// restarts/rebuilds (the file lives in a Docker volume).
function getSecret(): string {
  const fromEnv = process.env.DAILY_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  try {
    if (existsSync(SECRET_FILE)) {
      const s = readFileSync(SECRET_FILE, 'utf8').trim();
      if (s.length >= 16) return s;
    }
    const gen = randomBytes(32).toString('hex');
    mkdirSync(dirname(SECRET_FILE), { recursive: true });
    writeFileSync(SECRET_FILE, gen, { mode: 0o600 });
    console.log(`[daily-api] generated a new answer secret at ${SECRET_FILE}`);
    return gen;
  } catch (err) {
    console.error('[daily-api] could not persist a secret, using an ephemeral one:', err);
    return randomBytes(32).toString('hex');
  }
}

const SECRET = getSecret();

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      data += chunk.toString('utf8');
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/daily/state') {
      const raw = await readBody(req);
      let body: { mode?: unknown; guesses?: unknown };
      try {
        body = JSON.parse(raw || '{}');
      } catch {
        return send(res, 400, { error: 'bad json' });
      }
      const mode: Mode = body.mode === 'challenge' ? 'challenge' : 'daily';
      const guesses: string[] = Array.isArray(body.guesses)
        ? body.guesses.filter((x): x is string => typeof x === 'string').slice(0, 200)
        : [];
      const state = buildState(mode, new Date(), guesses, SECRET);
      return send(res, 200, state);
    }

    return send(res, 404, { error: 'not found' });
  } catch (err) {
    console.error('[daily-api]', err);
    return send(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, () => console.log(`[daily-api] listening on :${PORT}`));
