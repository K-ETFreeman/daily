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
  if (has(u, 'EXPERIMENTAL')) return ['Experimental', 4];
  if (has(u, 'COMMAND') || has(u, 'SUBCOMMANDER')) return ['Commander', 5];
  if (has(u, 'TECH3')) return ['T3', 3];
  if (has(u, 'TECH2')) return ['T2', 2];
  if (has(u, 'TECH1')) return ['T1', 1];
  return [null, 0];
}

function domainOf(u) {
  const i = (u.General && u.General.Icon) || '';
  return { air: 'Air', land: 'Land', sea: 'Naval', amph: 'Amphibious' }[i] || null;
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
const ABILITY_WHITELIST = new Set([
  'Shield Dome', 'Personal Shield', 'Stealth Field', 'Personal Stealth', 'Cloaking',
  'Hover', 'Amphibious', 'Submersible', 'Aquatic', 'Transport', 'Carrier',
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
      u.General.UnitName &&
      has(u, 'SELECTABLE') &&
      (has(u, 'MOBILE') || has(u, 'STRUCTURE')) &&
      techOf(u)[0]
  )
  .map((u) => {
    const [tech, techRank] = techOf(u);
    return {
      id: u.Id,
      name: u.General.UnitName,
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
  // De-dupe by name (some units share a display name across variants); keep the
  // costlier/canonical one so e.g. upgraded structures don't double up.
  .sort((a, b) => b.mass - a.mass);

const byName = new Map();
for (const u of pool) if (!byName.has(u.name)) byName.set(u.name, u);
const out = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(join(here, '..', 'src', 'data', 'units.json'), JSON.stringify(out, null, 0) + '\n');

console.log(`Wrote ${out.length} units to src/data/units.json`);
const fac = {};
out.forEach((u) => (fac[u.faction] = (fac[u.faction] || 0) + 1));
console.log('by faction:', fac);
const noDomain = out.filter((u) => !u.domain);
if (noDomain.length) console.log('WARNING missing domain:', noDomain.map((u) => u.name));
