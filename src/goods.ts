import itemNames from "./data/item-names.json";
import { recipes } from "./craft";
import { merchants } from "./catalog";
import { FAMILIES, mentions } from "./families";
import { normalize } from "./match";

export type Good = {
  name: string;
  note: string;
  family: string;
  bought: boolean;
};

const OTHER = "Other";

function familyFor(text: string): string {
  const match = FAMILIES.find((family) => family.words.some((word) => mentions(text, word)));
  return match?.label ?? OTHER;
}

function present(raw: string): { name: string; note: string } | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const paren = cleaned.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
  const name = (paren?.[1] ?? cleaned).replace(/\s+\d+\s*c$/i, "").trim();
    if (name.length < 2 || /^(none|unknown|various)$/i.test(name)) return null;
    if (/^(pattern|recipe)\s*:/i.test(name)) return null;
  const note = (paren?.[2] ?? "").replace(/\.\.\.$/, "").trim();
  return { name, note };
}

function buildGoods(): Good[] {
  const byName = new Map<string, Good>();
  const add = (raw: string, bought: boolean) => {
    const presented = present(raw);
    if (!presented) return;
    const key = normalize(presented.name);
    const existing = byName.get(key);
    if (existing) {
      existing.bought = existing.bought || bought;
      if (!existing.note && presented.note) existing.note = presented.note;
      return;
    }
    byName.set(key, {
      name: presented.name,
      note: presented.note,
      family: familyFor(`${presented.name} ${presented.note}`),
      bought,
    });
  };

  for (const merchant of merchants) {
    for (const buy of merchant.buys) add(buy, true);
    for (const sell of merchant.sells) add(sell, false);
  }
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) add(ingredient.name, false);
  }
  for (const item of itemNames) add(item.name, false);

  return [...byName.values()].sort((a, b) => Number(b.bought) - Number(a.bought) || a.name.localeCompare(b.name));
}

export const goods = buildGoods();

const itemPages = new Map(itemNames.map((item) => [normalize(item.name), `https://monstersandmemories.wiki/items/${item.id}`]));

export function itemPage(name: string): string | null {
  return itemPages.get(normalize(name)) ?? null;
}

export function familyShort(label: string): string {
  return FAMILIES.find((family) => family.label === label)?.short ?? "Other";
}

export function familyForName(name: string): string {
  return familyShort(familyFor(name));
}

export function familyCounts(): { label: string; short: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const good of goods) counts.set(good.family, (counts.get(good.family) ?? 0) + 1);
  const known = FAMILIES.filter((family) => counts.has(family.label)).map((family) => ({
    label: family.label,
    short: family.short,
    count: counts.get(family.label) ?? 0,
  }));
  const other = counts.get(OTHER) ?? 0;
  if (other > 0) known.push({ label: OTHER, short: OTHER, count: other });
  return known;
}
