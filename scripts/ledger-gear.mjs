const response = await fetch("https://arcane-ledger-kappa.vercel.app/data/items.json");
if (!response.ok) throw new Error(String(response.status));
const data = await response.json();
const gear = data.items.map((item) => ({
  id: item.id,
  name: item.name,
  slot: item.slots?.[0] ?? "",
  stats: item.stats && Object.keys(item.stats).length > 0 ? item.stats : undefined,
  dmg: typeof item.dmg === "number" ? item.dmg : undefined,
  delay: typeof item.delay === "number" ? item.delay : undefined,
}));
const { writeFile } = await import("node:fs/promises");
await writeFile(new URL("../src/data/gear.json", import.meta.url), `${JSON.stringify(gear)}\n`);
console.log("gear", gear.length);
