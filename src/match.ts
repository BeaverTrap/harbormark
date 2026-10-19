import { FAMILIES } from "./families";
import type { BuyerHit, Merchant } from "./types";

const STOP = new Set(["the", "and", "for", "with", "from", "into", "your", "a", "an", "of"]);

const CATEGORY_WORD = new Set([
  "all",
  "and",
  "animal",
  "armor",
  "bag",
  "bags",
  "cloth",
  "food",
  "fish",
  "gem",
  "gems",
  "herb",
  "herbs",
  "hide",
  "hides",
  "meat",
  "meats",
  "monster",
  "ore",
  "ores",
  "part",
  "parts",
  "pelt",
  "pelts",
  "raw",
  "scrap",
  "scraps",
  "weapon",
  "weapons",
  "wood",
]);

function specificPenalty(queryTokens: string[], buy: string): number {
  const extras = tokens(buy).filter(
    (token) => !CATEGORY_WORD.has(token) && !queryTokens.some((query) => token.includes(query) || query.includes(token)),
  );
  return extras.length * 40;
}

const GENERIC_BUY = new Set([
  "weapon",
  "weapons",
  "armor",
  "meat",
  "meats",
  "fish",
  "hide",
  "hides",
  "pelt",
  "pelts",
  "ore",
  "ores",
  "food",
  "cloth",
  "herb",
  "herbs",
  "wood",
  "gem",
  "gems",
  "bag",
  "bags",
]);

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP.has(token));
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    kept.push(value);
  }
  return kept;
}

export function scoreMerchant(query: string, merchant: Merchant): BuyerHit | null {
  if (merchant.greedy) return null;
  const q = normalize(query);
  const queryTokens = tokens(query);
  if (!q || queryTokens.length === 0) return null;

  let score = 0;
  const reasons: string[] = [];

  for (const buy of merchant.buys) {
    const bought = normalize(buy);
    const overlap = queryTokens.filter((token) => bought.includes(token));
    const penalty = specificPenalty(queryTokens, buy);
    const fullMatch = bought.includes(q) || (queryTokens.length > 0 && queryTokens.every((token) => bought.includes(token)));
    const gained = fullMatch ? Math.max(30, 110 - penalty) : overlap.length > 0 ? Math.max(0, 20 * overlap.length - penalty) : 0;
    if (gained > 0) {
      score += gained;
      reasons.push(`Buys ${buy}`);
    }
  }

  for (const family of FAMILIES) {
    const matchedWords = family.words.filter((word) => q.includes(normalize(word)));
    if (matchedWords.length === 0) continue;
    const buy = merchant.buys.find((line) => {
      const bought = normalize(line);
      if (matchedWords.some((word) => bought.includes(normalize(word)))) return true;
      return family.words.some((word) => GENERIC_BUY.has(normalize(word)) && bought.includes(normalize(word)));
    });
    if (!buy) continue;
    const bought = normalize(buy);
    const rawQuery = q.includes("raw");
    const prepared = /\b(cooked|charred|grilled)\b/.test(bought);
    if (rawQuery && prepared) continue;
    score += 60;
    reasons.push(`Buys ${buy}`);
  }

  const stock = merchant.sells.find((sell) => {
    const sold = normalize(sell);
    return sold === q || queryTokens.every((token) => sold.includes(token));
  });
  if (stock) {
    score += 55;
    reasons.push(`Stocks ${stock}, so this is their trade`);
  }

  const merchantName = normalize(merchant.name);
  if (queryTokens.some((token) => merchantName.includes(token))) score += 15;
  for (const family of FAMILIES) {
    if (!family.words.some((word) => q.includes(normalize(word)))) continue;
    if (family.words.some((word) => merchantName.includes(normalize(word)))) score += 12;
  }

  if (score < 40) return null;
  return { merchant, score, reasons: unique(reasons).slice(0, 3) };
}

export const HOME_ZONES = ["Night Harbor", "Underdocks"] as const;

export function selectedZones(zone: string): readonly string[] | "all" {
  if (zone === "all") return "all";
  if (zone === "hubs") return HOME_ZONES;
  return [zone];
}

export function zoneLabel(zone: string): string {
  if (zone === "hubs") return "Night Harbor or Underdocks";
  return zone;
}

function inSelectedZone(merchantZones: string[], zone: string): boolean {
  const selected = selectedZones(zone);
  if (selected === "all") return true;
  return merchantZones.some((name) => selected.includes(name));
}

export function findBuyers(query: string, merchants: Merchant[], zone: string): { here: BuyerHit[]; elsewhere: BuyerHit[] } {
  const hits = merchants
    .map((merchant) => scoreMerchant(query, merchant))
    .filter((hit): hit is BuyerHit => hit !== null)
    .sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;
      if (zone === "all") {
        const aHub = a.merchant.zones.some((name) => name === "Night Harbor" || name === "Underdocks") ? 0 : 1;
        const bHub = b.merchant.zones.some((name) => name === "Night Harbor" || name === "Underdocks") ? 0 : 1;
        if (aHub !== bHub) return aHub - bHub;
      }
      return a.merchant.name.localeCompare(b.merchant.name);
    });

  if (zone === "all") return { here: hits.slice(0, 6), elsewhere: [] };

  const here: BuyerHit[] = [];
  const elsewhere: BuyerHit[] = [];
  for (const hit of hits) {
    const inZone = inSelectedZone(hit.merchant.zones, zone);
    if (inZone && here.length < 6) here.push(hit);
    else if (!inZone && elsewhere.length < 4) elsewhere.push(hit);
  }
  return { here, elsewhere };
}

export function shadyInZone(merchants: Merchant[], zone: string): Merchant[] {
  const shady = merchants.filter((merchant) => merchant.greedy && (merchant.location || merchant.zones.length > 0));
  if (zone === "all") return shady;
  const local = shady.filter((merchant) => inSelectedZone(merchant.zones, zone));
  return local.length > 0 ? local : shady;
}

export type HaulEntry = {
  qty: number;
  name: string;
};

export type HaulStop = {
  merchant: Merchant | null;
  lines: { qty: number; name: string; reasons: string[] }[];
};

export function parseHaul(text: string): HaulEntry[] {
  const entries: HaulEntry[] = [];
  for (const raw of text.split(/\n+/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const leading = line.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
    const trailing = line.match(/^(.+?)\s*[x×]\s*(\d+)$/i);
    if (leading) {
      entries.push({ qty: Number(leading[1]), name: leading[2].trim() });
      continue;
    }
    if (trailing && trailing[1].trim().length > 0) {
      entries.push({ qty: Number(trailing[2]), name: trailing[1].trim() });
      continue;
    }
    entries.push({ qty: 1, name: line });
  }
  return entries;
}

export function planHaul(text: string, merchants: Merchant[], zone: string): { stops: HaulStop[]; unmatched: HaulStop } {
  const grouped = new Map<string, HaulStop>();
  const unmatched: HaulStop = { merchant: null, lines: [] };

  for (const entry of parseHaul(text)) {
    const { here, elsewhere } = findBuyers(entry.name, merchants, zone);
    const best = here[0] ?? elsewhere[0] ?? null;
    if (!best) {
      unmatched.lines.push({ qty: entry.qty, name: entry.name, reasons: [] });
      continue;
    }
    const existing = grouped.get(best.merchant.id);
    const line = { qty: entry.qty, name: entry.name, reasons: best.reasons };
    if (existing) existing.lines.push(line);
    else grouped.set(best.merchant.id, { merchant: best.merchant, lines: [line] });
  }

  const stops = [...grouped.values()].sort((a, b) => {
    const aLocal = zone !== "all" && a.merchant && inSelectedZone(a.merchant.zones, zone) ? 0 : 1;
    const bLocal = zone !== "all" && b.merchant && inSelectedZone(b.merchant.zones, zone) ? 0 : 1;
    return aLocal - bLocal || (a.merchant?.name ?? "").localeCompare(b.merchant?.name ?? "");
  });
  return { stops, unmatched };
}
