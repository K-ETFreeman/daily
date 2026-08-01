// Data for the "what each column can show" reference. Descriptions are curated,
// but the list of possible VALUES for every categorical/set column (and the
// numeric ranges) is derived from the live unit data, so it can never drift out
// of sync with what the game actually uses.

import { UNITS } from './units';
import { COLUMNS } from './compare';

export interface ColumnGuideEntry {
  key: string;
  label: string;
  desc: string;
  /** For categorical/set/tech columns: the distinct values that can appear. */
  values?: string[];
  /** For numeric columns: the observed [min, max] in the data. */
  range?: [number, number];
}

const DESC: Record<string, string> = {
  faction: 'Which of the four base factions the unit belongs to.',
  tech: "Tech tier. The arrow points toward the answer's tier; the ACU has no tier (—).",
  type: "Whether it's a mobile Unit, a Building, or a crab Egg.",
  domain:
    "The unit's in-game layer, read from its icon background. Related layers (Land / Hover / Amphibious) score a partial (amber).",
  weapon: 'Weapon categories it carries — a unit can have several, or None.',
  produces: 'Resources it generates. (Factories build units but yield no resource here.)',
  role: 'What the unit is for — it can fill several roles at once.',
  mass: 'Mass cost to build. The arrow points toward the answer; amber when within ~20%.',
  hp: 'Maximum hit points. The arrow points toward the answer; amber when within ~20%.',
  buildTime: 'How much build effort it takes. The arrow points toward the answer; amber when within ~20%.',
  abilities:
    'Special capabilities — shields, stealth, intel, missile defense and more. A unit can have several, or None.',
};

// Preferred display order for the value chips. Anything present in the data but
// not listed here is appended alphabetically, so new values can never be hidden.
const ORDER: Record<string, string[]> = {
  faction: ['Aeon', 'UEF', 'Cybran', 'Seraphim'],
  tech: ['T1', 'T2', 'T3', 'EXP', '—'],
  type: ['Unit', 'Building', 'Egg'],
  domain: ['Land', 'Hover', 'Amphibious', 'Naval', 'Air'],
  weapon: ['Direct Fire', 'Indirect', 'Anti-Air', 'Torpedoes', 'None'],
  produces: ['Mass', 'Energy', 'None'],
  role: ['Combat', 'Factory', 'Engineer', 'Transport', 'Defense', 'Economy', 'Intel', 'Shield', 'Support', 'Egg'],
  abilities: [
    'Shield Dome', 'Personal Shield',
    'Stealth Field', 'Personal Stealth', 'Cloaking',
    'Radar', 'Sonar', 'Omni Sensor', 'Jamming',
    'Tactical Missile Defense', 'Strategic Missile Defense', 'Torpedo Defense',
    'Reclaim', 'Assist', 'Capture', 'Transport', 'Carrier', 'Submersible', 'Air Staging',
    'Volatile', 'Massive', 'EMP Weapon', 'Suicide Weapon', 'Sacrifice',
    'Egg', 'None',
  ],
};

const asRecord = (u: unknown) => u as Record<string, unknown>;

function distinctCat(key: string): string[] {
  return [...new Set(UNITS.map((u) => String(asRecord(u)[key])))];
}
function distinctSet(key: string): string[] {
  const s = new Set<string>();
  UNITS.forEach((u) => (asRecord(u)[key] as string[] | undefined)?.forEach((v) => s.add(v)));
  return [...s];
}
function ordered(key: string, found: string[]): string[] {
  const pref = ORDER[key] || [];
  const inPref = pref.filter((v) => found.includes(v));
  const extra = found.filter((v) => !pref.includes(v)).sort();
  return [...inPref, ...extra];
}

export function buildColumnGuide(): ColumnGuideEntry[] {
  return COLUMNS.map((c) => {
    const key = String(c.key);
    const base = { key, label: c.label, desc: DESC[key] ?? '' };
    if (c.kind === 'num') {
      const vals = UNITS.map((u) => Number(asRecord(u)[key]));
      return { ...base, range: [Math.min(...vals), Math.max(...vals)] as [number, number] };
    }
    const found = c.kind === 'set' ? distinctSet(key) : distinctCat(key);
    return { ...base, values: ordered(key, found) };
  });
}
