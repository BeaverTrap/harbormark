/**
 * Pull the wiki's item id and name list in one request.
 * Item pages themselves are not walked. The current file stays when the
 * list matches, and a short response does not replace it.
 */
import { readFile, writeFile } from "node:fs/promises";

const SOURCE = "https://monstersandmemories.wiki/api/items";
const UA = "Skillooth/0.1 (local fan tool; CC BY-SA 4.0 attribution)";
const target = new URL("../src/data/item-names.json", import.meta.url);

const response = await fetch(SOURCE, {
  headers: { "User-Agent": UA, Accept: "application/json" },
  signal: AbortSignal.timeout(60_000),
});
if (!response.ok) throw new Error(`item list ${response.status}`);
const body = await response.json();
if (!Array.isArray(body)) throw new Error("item list was not an array");

const items = body
  .filter((row) => row && row.id && row.item_name)
  .map((row) => ({
    id: String(row.id),
    name: String(row.item_name).replace(/\s+/g, " ").trim(),
  }))
  .filter((row) => row.name.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

let previous = null;
try {
  previous = JSON.parse(await readFile(target, "utf8"));
} catch {
  previous = null;
}

const previousCount = Array.isArray(previous) ? previous.length : 0;
if (previousCount > 0 && items.length < previousCount * 0.5) {
  throw new Error(`refusing to replace ${previousCount} item names with ${items.length}`);
}

if (previous && JSON.stringify(previous) === JSON.stringify(items)) {
  console.log(`unchanged ${items.length} item names`);
  process.exit(0);
}

await writeFile(target, `${JSON.stringify(items, null, 2)}\n`);
const previousIds = new Set(Array.isArray(previous) ? previous.map((row) => row.id) : []);
const nextIds = new Set(items.map((row) => row.id));
const added = items.filter((row) => !previousIds.has(row.id)).length;
const removed = [...previousIds].filter((id) => !nextIds.has(id)).length;
console.log(`wrote ${items.length} item names, ${added} added, ${removed} removed`);
