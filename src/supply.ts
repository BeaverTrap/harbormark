import campsJson from "./data/camps.json";
import { merchants } from "./catalog";
import { recipeFor, recipes, sameTrade, type Recipe } from "./craft";
import { findBuyers, normalize } from "./match";
import type { Merchant } from "./types";

type RawCamp = {
  npc: string;
  zone: string;
  min: number | null;
  max: number | null;
};

const campsByItem = campsJson as Record<string, RawCamp[]>;

export type MaterialCamp = RawCamp & { items: string[] };

export type VendorLine = {
  item: string;
  merchant: string;
  where: string;
  wiki: string;
};

function ingredientNames(skill: string): string[] {
  const keys = new Set(sameTrade(skill));
  const names = new Set<string>();
  for (const recipe of recipes) {
    if (!keys.has(recipe.skill.toLowerCase())) continue;
    for (const ingredient of recipe.ingredients) names.add(ingredient.name);
  }
  return [...names];
}

function midpoint(camp: RawCamp): number | null {
  if (camp.min == null) return null;
  return camp.max ?? camp.min;
}

export function materialCamps(skill: string, level: number | null): MaterialCamp[] {
  const merged = new Map<string, MaterialCamp>();
  for (const name of ingredientNames(skill)) {
    const rows = campsByItem[name];
    if (!rows) continue;
    for (const row of rows) {
      const key = `${row.npc}|${row.zone}`;
      const existing = merged.get(key);
      if (existing) {
        if (!existing.items.includes(name) && existing.items.length < 3) existing.items.push(name);
        continue;
      }
      merged.set(key, { ...row, items: [name] });
    }
  }
  return [...merged.values()]
    .sort((a, b) => closeness(a, level) - closeness(b, level) || (a.min ?? 999) - (b.min ?? 999) || a.zone.localeCompare(b.zone))
    .slice(0, 8);
}

function closeness(camp: RawCamp, level: number | null): number {
  const mid = midpoint(camp);
  if (mid == null) return 400;
  if (level == null) return mid;
  if (camp.min != null && level >= camp.min && level <= mid) return 0;
  return Math.abs(mid - level);
}

export type LevelZone = {
  zone: string;
  camps: MaterialCamp[];
};

export type LevelPlan = {
  stay: LevelZone | null;
  elsewhere: LevelZone[];
  total: number;
};

function allCamps(): MaterialCamp[] {
  const merged = new Map<string, MaterialCamp>();
  for (const [name, rows] of Object.entries(campsByItem)) {
    for (const row of rows) {
      const key = `${row.npc}|${row.zone}`;
      const existing = merged.get(key);
      if (existing) {
        if (!existing.items.includes(name) && existing.items.length < 3) existing.items.push(name);
        continue;
      }
      merged.set(key, { ...row, items: [name] });
    }
  }
  return [...merged.values()];
}

function containsLevel(camp: RawCamp, level: number): boolean {
  if (camp.min == null) return false;
  const max = camp.max ?? camp.min;
  return level >= camp.min && level <= max;
}

export function levelingPlan(level: number): LevelPlan {
  const fitting = allCamps().filter((camp) => containsLevel(camp, level));
  const byZone = new Map<string, MaterialCamp[]>();
  for (const camp of fitting) {
    const list = byZone.get(camp.zone) ?? [];
    list.push(camp);
    byZone.set(camp.zone, list);
  }
  const zones = [...byZone.entries()]
    .map(([zone, camps]) => ({
      zone,
      camps: camps.sort((a, b) => (a.min ?? 0) - (b.min ?? 0) || a.npc.localeCompare(b.npc)),
    }))
    .sort((a, b) => b.camps.length - a.camps.length || zoneDrift(a, level) - zoneDrift(b, level) || a.zone.localeCompare(b.zone));
  return {
    stay: zones[0] ?? null,
    elsewhere: zones.slice(1),
    total: fitting.length,
  };
}

function zoneDrift(zone: LevelZone, level: number): number {
  return zone.camps.reduce((sum, camp) => sum + Math.abs((midpoint(camp) ?? level) - level), 0);
}

export function levelVerdict(plan: LevelPlan): string {
  if (!plan.stay) return "";
  if (plan.elsewhere.length === 0) return `Every on-level camp the wiki lists is in ${plan.stay.zone}.`;
  const here = plan.stay.camps.length;
  const rest = plan.total - here;
  const places = plan.elsewhere.length === 1 ? "1 other zone" : `${plan.elsewhere.length} other zones`;
  if (here > rest) {
    return `${here} of ${plan.total} on-level camps are in ${plan.stay.zone}. The other ${rest} are spread across ${places}.`;
  }
  return `On-level camps are split. ${plan.stay.zone} has the most, ${here} of ${plan.total}. The rest are in ${places}.`;
}

function hubFirst(list: Merchant[]): Merchant[] {
  return [...list].sort((a, b) => hubRank(a) - hubRank(b) || a.name.localeCompare(b.name));
}

function hubRank(merchant: Merchant): number {
  return merchant.zones.some((zone) => zone === "Night Harbor" || zone === "Underdocks") ? 0 : 1;
}

function where(merchant: Merchant): string {
  return merchant.zones.join(", ");
}

export type MaterialPlan = {
  name: string;
  made: Recipe | null;
  vendors: VendorLine[];
  moreVendors: number;
  camps: MaterialCamp[];
  notes: string[];
};

export function materialPlan(name: string, level: number | null): MaterialPlan {
  const vendors = stockedBy([name]);
  const camps = (campsByItem[name] ?? [])
    .map((row) => ({ ...row, items: [name] }))
    .sort((a, b) => closeness(a, level) - closeness(b, level) || (a.min ?? 999) - (b.min ?? 999))
    .slice(0, 2);
  return {
    name,
    made: recipeFor(name)[0] ?? null,
    vendors: vendors.slice(0, 2),
    moreVendors: Math.max(0, vendors.length - 2),
    camps,
    notes: sourceNotes(name),
  };
}

function sourceNotes(name: string): string[] {
  const key = normalize(name);
  const notes = new Set<string>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      if (normalize(ingredient.name) !== key || !ingredient.note) continue;
      for (const part of ingredient.note.split(",")) {
        const clean = part.trim().toLowerCase();
        if (clean) notes.add(clean);
      }
    }
  }
  return [...notes];
}

export function stockedBy(items: string[]): VendorLine[] {
  const lines: VendorLine[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = normalize(item);
    for (const merchant of hubFirst(merchants)) {
      if (!merchant.sells.some((sold) => normalize(sold) === key)) continue;
      const id = `${merchant.name}|${item}`;
      if (seen.has(id) || lines.length >= 8) continue;
      seen.add(id);
      lines.push({ item, merchant: merchant.name, where: where(merchant), wiki: merchant.wiki });
    }
  }
  return lines;
}

export function boughtBy(items: string[]): VendorLine[] {
  const lines: VendorLine[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const hit = findBuyers(item, merchants, "hubs").here[0];
    if (!hit) continue;
    const id = `${hit.merchant.name}|${item}`;
    if (seen.has(id) || lines.length >= 8) continue;
    seen.add(id);
    lines.push({ item, merchant: hit.merchant.name, where: where(hit.merchant), wiki: hit.merchant.wiki });
  }
  return lines;
}
