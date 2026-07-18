// Download the latest FAF unit data from ETFreeman-db (same format our builder
// expects) into scripts/source-unitlist.json.
//
//   node scripts/fetch-data.mjs      (or: npm run update-data — also rebuilds)
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const SOURCE_URL = 'https://faforever.github.io/etfreeman-db/data/index.json';
const here = dirname(fileURLToPath(import.meta.url));

const res = await fetch(SOURCE_URL);
if (!res.ok) {
  console.error(`Fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error('Downloaded data is not valid JSON.');
  process.exit(1);
}
if (!Array.isArray(data.units) || data.units.length === 0) {
  console.error('Downloaded data has no units array — refusing to overwrite.');
  process.exit(1);
}

writeFileSync(join(here, 'source-unitlist.json'), text);
console.log(`Fetched unit data v${data.version} (${data.units.length} units) from ETFreeman-db → scripts/source-unitlist.json`);
