// Transform the raw FAF unit DB export (scripts/source-unitlist.json) into the
// trimmed, derived unit list the game uses (src/data/units.json).
//
//   node scripts/build-units.mjs
//
// Re-run this after dropping a newer unitlist.json export into scripts/.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(here, 'source-unitlist.json'), 'utf8'));
const units = raw.units;

const has = (u, tag) => (u.Categories || []).includes(tag);

function techOf(u) {
  if (has(u, 'EXPERIMENTAL')) return ['EXP', 4];
  if (has(u, 'COMMAND') || has(u, 'SUBCOMMANDER')) return ['Commander', 5];
  if (has(u, 'TECH3')) return ['T3', 3];
  if (has(u, 'TECH2')) return ['T2', 2];
  if (has(u, 'TECH1')) return ['T1', 1];
  return [null, 0];
}

// Movement layer, by precedence: Air > Naval > Hover > Amphibious > Land.
// Captures the gameplay-relevant distinction (e.g. an Aeon hover tank reads
// "Hover", not just "Land"). Movement abilities therefore live here, not in the
// Abilities column.
function domainOf(u) {
  const i = (u.General && u.General.Icon) || '';
  if (i === 'air') return 'Air';
  if (i === 'sea') return 'Naval';
  const a = (u.Display && u.Display.Abilities) || [];
  if (a.includes('Hover')) return 'Hover';
  if (i === 'amph' || a.includes('Amphibious') || a.includes('Aquatic')) return 'Amphibious';
  return 'Land';
}

function weaponOf(u) {
  const set = new Set();
  (u.Weapon || []).forEach((w) => {
    const c = w.WeaponCategory || '';
    if (/Anti Air/i.test(c)) set.add('Anti-Air');
    else if (/Anti Navy/i.test(c)) set.add('Anti-Navy');
    else if (/Artillery|Missile|Indirect|Bomb/i.test(c)) set.add('Indirect');
    else if (/Direct Fire/i.test(c)) set.add('Direct Fire');
    // Death / Kamikaze / Teleport / unknown effect weapons are ignored
  });
  return set.size ? [...set] : ['None'];
}

function producesOf(u) {
  const r = [];
  if (has(u, 'MASSPRODUCTION')) r.push('Mass');
  if (has(u, 'ENERGYPRODUCTION')) r.push('Energy');
  return r.length ? r : ['None'];
}

function roleOf(u) {
  if (has(u, 'FACTORY')) return 'Factory';
  if (has(u, 'ENGINEER') || has(u, 'CONSTRUCTION')) return 'Engineer';
  if (has(u, 'DEFENSE')) return 'Defense';
  if (has(u, 'ECONOMIC')) return 'Economy';
  if (has(u, 'INTELLIGENCE')) return 'Intel';
  if (has(u, 'SHIELD')) return 'Shield';
  return 'Combat';
}

// Abilities we surface as a guessable column (clean, recognizable subset).
// Movement traits (Hover/Amphibious/Aquatic) are intentionally excluded — they
// live in the Domain column now.
const ABILITY_WHITELIST = new Set([
  'Shield Dome', 'Personal Shield', 'Stealth Field', 'Personal Stealth', 'Cloaking',
  'Submersible', 'Transport', 'Carrier',
  'Sonar', 'Radar', 'Omni Sensor', 'Jamming', 'Torpedoes', 'Anti-Air',
  'Tactical Missile Defense', 'Strategic Missile Defense', 'Torpedo Defense',
  'EMP Weapon', 'Suicide Weapon', 'Sacrifice', 'Massive', 'Volatile',
  'Engineering Suite', 'Factory', 'Air Staging',
]);

function abilitiesOf(u) {
  const a = (u.Display && u.Display.Abilities) || [];
  return a.filter((x) => ABILITY_WHITELIST.has(x));
}

const pool = units
  .filter(
    (u) =>
      u.General &&
      u.General.FactionName &&
      u.General.FactionName !== 'Nomads' &&
      (u.General.UnitName || u.Description) &&
      has(u, 'SELECTABLE') &&
      (has(u, 'MOBILE') || has(u, 'STRUCTURE')) &&
      techOf(u)[0] &&
      !has(u, 'WALL') &&
      !/wall section/i.test(u.Description || '')
  )
  .map((u) => {
    const [tech, techRank] = techOf(u);
    return {
      id: u.Id,
      name: u.General.UnitName || u.Description,
      desc: u.Description || '',
      faction: u.General.FactionName,
      tech,
      techRank,
      type: has(u, 'STRUCTURE') ? 'Building' : 'Unit',
      domain: domainOf(u),
      weapon: weaponOf(u),
      produces: producesOf(u),
      role: roleOf(u),
      mass: u.Economy?.BuildCostMass ?? 0,
      energy: u.Economy?.BuildCostEnergy ?? 0,
      hp: u.Defense?.Health ?? 0,
      buildTime: u.Economy?.BuildTime ?? 0,
      abilities: abilitiesOf(u),
    };
  })
  // Sort costliest first so de-dupe keeps the canonical variant.
  .sort((a, b) => b.mass - a.mass);

// De-dupe by name + faction + tech: collapses true duplicates (e.g. a factory
// and its HQ variant at the same tier) without dropping a faction's or a tier's
// distinct unit that happens to share a display name.
const byKey = new Map();
for (const u of pool) {
  const key = `${u.name}|${u.faction}|${u.tech}`;
  if (!byKey.has(key)) byKey.set(key, u);
}
const out = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(join(here, '..', 'src', 'data', 'units.json'), JSON.stringify(out, null, 0) + '\n');

console.log(`Wrote ${out.length} units to src/data/units.json`);
const fac = {};
out.forEach((u) => (fac[u.faction] = (fac[u.faction] || 0) + 1));
console.log('by faction:', fac);
const noDomain = out.filter((u) => !u.domain);
if (noDomain.length) console.log('WARNING missing domain:', noDomain.map((u) => u.name));
