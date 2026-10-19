import type { Merchant } from "./types";

export const WIKI_HOME = "https://monstersandmemories.miraheze.org/wiki/Main_Page";
export const ATLAS_HOME = "https://www.mnmatlas.com/";
export const LEDGER_HOME = "https://arcane-ledger-kappa.vercel.app/";

const ZONE_MAPS: Record<string, string> = {
  "Ail'Vorith": "ail-vorith",
  "Ancient Crypt": "ancient-crypt",
  "Blacktide Bay": "blacktide-bay",
  "Caves of Irem": "caves-of-irem",
  "Evershade Weald": "evershade-weald",
  Faelindral: "faelindral",
  "Fallen Pass": "fallen-pass",
  "Fallen Watch": "fallen-watch",
  "Glass Flats": "glass-flats",
  "Glinting Hollow": "glinting-hollow",
  "Grain Cellar": "grain-cellar",
  "Great Cavern Sea": "great-cavern-sea",
  "Grimtide Sanctum": "grimtide-sanctum",
  "Keeper's Bight": "keepers-bight",
  "Night Harbor": "night-harbor",
  Rothold: "rothold",
  Scarwood: "scarwood",
  "Shaded Dunes": "shaded-dunes",
  "Shallow Shoals": "shallow-shoals",
  "Sungreet Strand": "sungreet-strand",
  "Sunken Resort": "sunken-resort",
  "Tel Ekir": "tel-ekir",
  "The Shaded Bloom Inn": "night-harbor",
  "Tomb of the Last Wyrmsbane": "wyrmsbane-tomb",
  Underdocks: "underdocks",
  "Vale of Zintar": "vale-of-zintar",
};

export function wikiPage(title: string): string {
  const slug = title.trim().replace(/\s+/g, "_");
  return `https://monstersandmemories.miraheze.org/wiki/${encodeURI(slug)}`;
}

export function knownZones(): string[] {
  return Object.keys(ZONE_MAPS).sort((a, b) => b.length - a.length);
}

export function atlasForZone(zone: string): string | null {
  const map = ZONE_MAPS[zone];
  return map ? `${ATLAS_HOME}${map}/` : null;
}

export function atlasForMerchant(merchant: Merchant): string {
  const params = new URLSearchParams({ find: merchant.name });
  const map = merchant.zones.map((zone) => ZONE_MAPS[zone]).find(Boolean);
  if (map) params.set("map", map);
  return `${ATLAS_HOME}?${params.toString()}`;
}
