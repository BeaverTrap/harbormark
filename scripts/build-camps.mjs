import { readFile, writeFile } from "node:fs/promises";

const recipes = JSON.parse(await readFile(new URL("../src/data/recipes.json", import.meta.url), "utf8"));
const wanted = new Set();
for (const recipe of recipes) {
  for (const ingredient of recipe.ingredients) wanted.add(ingredient.name.toLowerCase());
}

const items = await (await fetch("https://arcane-ledger-kappa.vercel.app/data/items.json")).json();
const npcs = await (await fetch("https://arcane-ledger-kappa.vercel.app/data/npcs.json")).json();
const byNameZone = new Map();
for (const npc of Object.values(npcs.npcs)) {
  byNameZone.set(`${npc.name.toLowerCase()}|${String(npc.zone || "").toLowerCase()}`, npc);
}

const camps = {};
for (const item of items.items) {
  if (!wanted.has(item.name.toLowerCase()) || !item.drops?.length) continue;
  const seen = new Set();
  const rows = [];
  for (const drop of item.drops) {
    if (!drop?.npc || !drop.zone) continue;
    const key = `${drop.npc.toLowerCase()}|${drop.zone.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const npc = byNameZone.get(key);
    const level = Array.isArray(npc?.level) ? npc.level : [];
    const min = Number.isInteger(level[0]) ? level[0] : null;
    const max = Number.isInteger(level[1]) ? level[1] : min;
    rows.push({ npc: drop.npc, zone: drop.zone, min, max });
  }
  rows.sort((a, b) => (a.min ?? 999) - (b.min ?? 999) || a.zone.localeCompare(b.zone) || a.npc.localeCompare(b.npc));
  if (rows.length > 0) camps[item.name] = rows.slice(0, 8);
}

await writeFile(new URL("../src/data/camps.json", import.meta.url), `${JSON.stringify(camps, null, 2)}\n`);
console.log("items", Object.keys(camps).length);
