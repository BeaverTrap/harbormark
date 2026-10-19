import spellsJson from "./data/spells.json";

export type SpellBand = {
  low: number;
  high: number;
  lowLevel: number | null;
  highLevel: number | null;
};

export type SpellDot = SpellBand & { every: number };

export type ClassGate = {
  className: string;
  level: number;
};

export type Spell = {
  name: string;
  wiki: string;
  icon: string;
  skill: string;
  resist: string;
  target: string;
  mana: number | null;
  cast: number | null;
  recast: number | null;
  duration: number | null;
  classes: ClassGate[];
  direct: SpellBand | null;
  dot: SpellDot | null;
  heal: SpellBand | null;
  weapon: SpellBand | null;
};

export const spells = spellsJson as Spell[];

export type RatedKind = "nuke" | "dot" | "heal" | "weapon";

export type RatedSpell = {
  spell: Spell;
  kind: RatedKind;
  amount: number;
  seconds: number | null;
  perSecond: number | null;
  perMana: number | null;
};

function valueAt(band: SpellBand, level: number): number {
  if (band.lowLevel == null || band.highLevel == null || band.highLevel <= band.lowLevel) return band.low;
  if (level <= band.lowLevel) return band.low;
  if (level >= band.highLevel) return band.high;
  const span = (level - band.lowLevel) / (band.highLevel - band.lowLevel);
  return band.low + (band.high - band.low) * span;
}

function pace(spell: Spell): number | null {
  if (spell.cast != null && spell.cast > 0) return spell.cast;
  if (spell.recast != null && spell.recast > 0) return spell.recast;
  return null;
}

function gateFor(spell: Spell, className: string): number | null {
  const gates = spell.classes.filter((gate) => gate.className.toLowerCase() === className.toLowerCase());
  if (gates.length === 0) return null;
  return Math.min(...gates.map((gate) => gate.level));
}

function perMana(amount: number, mana: number | null): number | null {
  if (mana == null || mana <= 0) return null;
  return amount / mana;
}

export function knownCount(className: string): number {
  return spells.filter((spell) => gateFor(spell, className) != null).length;
}

export function rateClass(className: string, level: number): { damage: RatedSpell[]; heals: RatedSpell[]; weapons: RatedSpell[] } {
  const best = new Map<string, { spell: Spell; gate: number }>();
  for (const spell of spells) {
    const gate = gateFor(spell, className);
    if (gate == null || gate > level) continue;
    const key = spell.name.toLowerCase();
    const previous = best.get(key);
    if (!previous || gate > previous.gate) best.set(key, { spell, gate });
  }

  const damage: RatedSpell[] = [];
  const heals: RatedSpell[] = [];
  const weapons: RatedSpell[] = [];

  for (const { spell } of best.values()) {
    const seconds = pace(spell);
    if (spell.direct && seconds) {
      const amount = valueAt(spell.direct, level);
      damage.push({
        spell,
        kind: "nuke",
        amount,
        seconds,
        perSecond: amount / seconds,
        perMana: perMana(amount, spell.mana),
      });
    } else if (spell.dot) {
      const tick = valueAt(spell.dot, level);
      const ticks = spell.duration && spell.duration > 0 ? Math.max(1, Math.floor(spell.duration / spell.dot.every)) : 1;
      const amount = tick * ticks;
      damage.push({
        spell,
        kind: "dot",
        amount,
        seconds: spell.dot.every,
        perSecond: tick / spell.dot.every,
        perMana: perMana(amount, spell.mana),
      });
    } else if (spell.direct) {
      const amount = valueAt(spell.direct, level);
      damage.push({
        spell,
        kind: "nuke",
        amount,
        seconds: null,
        perSecond: null,
        perMana: perMana(amount, spell.mana),
      });
    }

    if (spell.heal && seconds) {
      const amount = valueAt(spell.heal, level);
      heals.push({
        spell,
        kind: "heal",
        amount,
        seconds,
        perSecond: amount / seconds,
        perMana: perMana(amount, spell.mana),
      });
    }

    if (spell.weapon) {
      weapons.push({
        spell,
        kind: "weapon",
        amount: valueAt(spell.weapon, level),
        seconds,
        perSecond: null,
        perMana: null,
      });
    }
  }

  const byRate = (a: RatedSpell, b: RatedSpell) =>
    (b.perSecond ?? -1) - (a.perSecond ?? -1) || b.amount - a.amount || a.spell.name.localeCompare(b.spell.name);

  damage.sort(byRate);
  heals.sort(byRate);
  weapons.sort((a, b) => b.amount - a.amount || a.spell.name.localeCompare(b.spell.name));
  return { damage, heals, weapons };
}
