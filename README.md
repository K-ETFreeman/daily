# FAF Daily

A daily "guess the unit" game for **Supreme Commander: Forged Alliance** — in the
style of Wordle/Loldle. One mystery unit per day (same for everyone, UTC). Guess
any base-faction unit; the grid reveals which attributes match.

- **Faction · Tech · Unit/Building · Domain · Weapon · Yields · Role · Mass · HP · Build · Abilities**
- 🟩 exact match · 🟨 partial / close · 🟥 no · ↑/↓ answer is higher / lower
- 286 base-faction units (Aeon/UEF/Cybran/Seraphim). **Nomads excluded.**
- Unit build-icons are hotlinked from the [FAForever/UnitDB](https://github.com/FAForever/UnitDB)
  repo via the jsDelivr CDN (with a faction-colored fallback), so no images are bundled.
- **Answer resolved server-side** (see `server/`): the daily/challenge pick and
  every grid comparison are computed by a small Node service behind a secret, so
  the answer never reaches the browser until you've solved it — you can't read it
  from devtools or recompute it from the bundle. No accounts. The SPA still holds
  the unit *list* for search (that isn't the answer).

## Architecture
- `src/` — the React SPA (static, served by nginx).
- `server/` — a dependency-free Node service (run with `tsx`) that resolves the
  answer (`server/answer.ts`), builds the board (`server/state.ts`), and serves
  `POST /api/daily/state`. It reuses the same `src/lib` logic (`compare`,
  `challenge`, `units`) so the rules live in one place.
- In production the nginx container serves the SPA and reverse-proxies `/api/*`
  to the `api` container on the private Docker network.

## Develop
```bash
npm install
npm run server       # answer API on :8090 (needed for the game to work)
npm run dev          # http://localhost:5174 (proxies /api -> :8090)
npm run typecheck && npm run typecheck:server
npm run build        # -> dist/
```

## Regenerate the unit list
Drop a fresh FAF `unitlist.json` export into `scripts/source-unitlist.json`, then:
```bash
npm run build:units  # rewrites src/data/units.json
```

## Deploy
Two containers via compose — `web` (nginx: SPA + `/api` proxy, published on host
:8081) and `api` (the answer service, internal only):
```bash
docker compose up -d --build   # web on host :8081; api is internal
```
Point your edge reverse proxy (e.g. `daily.replays.doodlepros.com` → `VM-IP:8081`)
at the `web` container exactly as before — nothing else to configure.

The `api` container generates a random answer secret on first run and persists it
in the `daily-secret` volume, so answers stay stable across restarts. To control
it yourself, set `DAILY_SECRET` (a long random string) in `docker-compose.yml`.
**Note:** changing/losing the secret reshuffles every future answer, so keep the
volume (or a fixed `DAILY_SECRET`) intact.
