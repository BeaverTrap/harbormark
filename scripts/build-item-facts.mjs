/**
 * Pull class, slot, and drop names for each item.
 * The wiki publishes these on item pages. mnm-db.com/wiki.json is that
 * extract as one file. One request, then we keep the current file when
 * the lists match, and we refuse a pull that comes back short.
 */
import { readFile, writeFile } from "node:fs/promises";

const SOURCE = "https://mnm-db.com/wiki.json";
const UA = "Skillooth/0.1 (local fan tool; CC BY-SA 4.0 attribution)";
const target = new URL("../src/data/item-facts.json", import.meta.url);

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function classesOf(value) {
  return String(value || "")
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);
}

function unique(values) {
  const seen = new Set();
  const kept = [];
  for (const value of values) {
    const name = String(value || "").replace(/\s+/g, " ").trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    kept.push(name);
  }
  return kept;
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(target, "utf8"));
  } catch {
    return null;
  }
}

const response = await fetch(SOURCE, {
  headers: { "User-Agent": UA, Accept: "application/json" },
  signal: AbortSignal.timeout(60_000),
});
if (!response.ok) throw new Error(`wiki.json ${response.status}`);
const wiki = await response.json();
if (!wiki || typeof wiki.items !== "object" || Array.isArray(wiki.items)) {
  throw new Error("wiki.json had no item map");
}

const items = {};
let collisions = 0;
for (const [name, record] of Object.entries(wiki.items)) {
  const key = normalize(name);
  if (!key || !record || typeof record !== "object") continue;
  const fact = {};
  const slot = String(record.slot || "").toUpperCase().replace(/\s+/g, " ").trim();
  const classes = classesOf(record.class);
  const drops = unique(Array.isArray(record.from) ? record.from : []);
  if (slot) fact.slot = slot;
  if (classes.length > 0) fact.classes = classes;
  if (drops.length > 0) fact.drops = drops;
  if (!fact.slot && !fact.classes && !fact.drops) continue;
  const existing = items[key];
  if (existing) {
    collisions += 1;
    const existingScore = (existing.classes ? 2 : 0) + (existing.slot ? 1 : 0);
    const nextScore = (fact.classes ? 2 : 0) + (fact.slot ? 1 : 0);
    if (existingScore > nextScore) continue;
  }
  items[key] = fact;
}

const sorted = {};
for (const key of Object.keys(items).sort()) sorted[key] = items[key];

const previous = await readPrevious();
const previousCount = previous?.items ? Object.keys(previous.items).length : 0;
if (previousCount > 0 && Object.keys(sorted).length < previousCount * 0.5) {
  throw new Error(`refusing to replace ${previousCount} item facts with ${Object.keys(sorted).length}`);
}

if (previous && JSON.stringify(previous.items) === JSON.stringify(sorted)) {
  console.log(`unchanged ${Object.keys(sorted).length} item facts, ${collisions} name collisions`);
  process.exit(0);
}

const file = {
  source: "Data from the Monsters and Memories Wiki",
  via: SOURCE,
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  generatedAt: new Date().toISOString(),
  count: Object.keys(sorted).length,
  items: sorted,
};
await writeFile(target, JSON.stringify(file));
console.log(`wrote ${file.count} item facts, ${collisions} name collisions`);
