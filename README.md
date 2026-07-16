# FAF Daily

A daily "guess the unit" game for **Supreme Commander: Forged Alliance** — in the
style of Wordle/Loldle. One mystery unit per day (same for everyone, UTC). Guess
any base-faction unit; the grid reveals which attributes match.

- **Faction · Tech · Unit/Building · Domain · Weapon · Yields · Role · Mass · HP · Build · Abilities**
- 🟩 exact match · 🟨 partial / close · 🟥 no · ↑/↓ answer is higher / lower
- 286 base-faction units (Aeon/UEF/Cybran/Seraphim). **Nomads excluded.**
- Unit build-icons are hotlinked from the [FAForever/UnitDB](https://github.com/FAForever/UnitDB)
  repo via the jsDelivr CDN (with a faction-colored fallback), so no images are bundled.
- Fully client-side — no backend, no accounts. Daily answer is a deterministic
  function of the date.

## Develop
```bash
npm install
npm run dev          # http://localhost:5174
npm run typecheck
npm run build        # -> dist/
```

## Regenerate the unit list
Drop a fresh FAF `unitlist.json` export into `scripts/source-unitlist.json`, then:
```bash
npm run build:units  # rewrites src/data/units.json
```

## Deploy
Standalone static site served by nginx (its own port, separate from FAFGuessr):
```bash
docker compose up -d --build   # serves on host :8081
```
Point your edge reverse proxy (e.g. `daily.replays.doodlepros.com` → `VM-IP:8081`) at it.
