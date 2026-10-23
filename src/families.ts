export type TradeFamily = {
  label: string;
  short: string;
  words: string[];
};

function plain(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function mentions(text: string, word: string): boolean {
  const haystack = plain(text);
  const normalized = plain(word);
  if (!normalized) return false;
  if (normalized.includes(" ")) return haystack.includes(normalized);
  const tokens = haystack.split(" ").filter(Boolean);
  return tokens.some((token) => token === normalized || token === `${normalized}s` || token === `${normalized}es`);
}

const GEAR_LABELS = new Set(["weapons", "armor", "jewelry"]);
const MATERIAL_LABELS = new Set([
  "meat and animal parts",
  "fish",
  "vegetables, roots, and herbs",
  "hides and leather",
  "cloth and thread",
  "ore and metal",
  "wood",
  "reagents and spell parts",
]);

export function gearQuery(text: string): boolean {
  return FAMILIES.some(
    (family) => GEAR_LABELS.has(family.label) && family.words.some((word) => mentions(text, word)),
  );
}

export function materialFamily(label: string): boolean {
  return MATERIAL_LABELS.has(label);
}

export const FAMILIES: TradeFamily[] = [
  {
    label: "weapons",
    short: "Weapons",
    words: [
      "weapon",
      "sword",
      "shortsword",
      "dagger",
      "mace",
      "axe",
      "staff",
      "bow",
      "blade",
      "spear",
      "knife",
      "cleaver",
      "hammer",
      "club",
      "flail",
      "wand",
      "rapier",
      "halberd",
      "pike",
      "scythe",
      "arrow",
      "bolt",
    ],
  },
  {
    label: "armor",
    short: "Armor",
    words: [
      "armor",
      "armour",
      "boot",
      "tunic",
      "vest",
      "robe",
      "cap",
      "helm",
      "hood",
      "mask",
      "belt",
      "cloak",
      "cape",
      "mantle",
      "legging",
      "pant",
      "trouser",
      "greave",
      "shoulderpads",
      "pauldron",
      "gorget",
      "glove",
      "gauntlet",
      "bracer",
      "vambrace",
      "sleeve",
      "breastplate",
      "chainmail",
      "platemail",
      "coif",
      "circlet",
      "crown",
      "sandal",
      "shoe",
      "shield",
      "buckler",
    ],
  },
  {
    label: "jewelry",
    short: "Jewelry",
    words: ["jewelry", "ring", "earring", "necklace", "amulet", "pendant", "choker"],
  },
  {
    label: "meat and animal parts",
    short: "Meat",
    words: ["meat", "beef", "mutton", "bushmeat", "gator", "chevron", "flesh", "animal part", "monster part", "creature part"],
  },
  {
    label: "fish",
    short: "Fish",
    words: ["fish", "fillet", "sturgeon", "grouper", "crab"],
  },
  {
    label: "vegetables, roots, and herbs",
    short: "Herbs",
    words: ["vegetable", "carrot", "herb", "thyme", "mushroom", "pepper", "cabbage", "onion", "root", "cheese"],
  },
  {
    label: "hides and leather",
    short: "Hides",
    words: ["hide", "pelt", "leather", "rawhide", "fur", "skin"],
  },
  {
    label: "cloth and thread",
    short: "Cloth",
    words: ["cloth", "silk", "thread", "linen", "fabric"],
  },
  {
    label: "ore and metal",
    short: "Ore",
    words: ["ore", "ingot", "metal scrap", "blacksmith"],
  },
  {
    label: "gems and jewelry",
    short: "Gems",
    words: ["gem", "malachite", "jewel", "jewelry"],
  },
  {
    label: "wood",
    short: "Wood",
    words: ["wood", "lumber", "log"],
  },
  {
    label: "reagents and spell parts",
    short: "Reagents",
    words: ["reagent", "bone", "chip", "skull", "dust", "bile", "gland", "beetle", "resin", "incense", "scroll", "skeleton", "undead", "ash"],
  },
  {
    label: "bags and packs",
    short: "Bags",
    words: ["bag", "pack", "pouch", "satchel", "backpack"],
  },
  {
    label: "lights",
    short: "Lights",
    words: ["torch", "lantern", "candle", "lightstone", "light stone"],
  },
  {
    label: "food",
    short: "Food",
    words: ["food", "ration", "bread", "stew", "cooked"],
  },
  {
    label: "drink",
    short: "Drink",
    words: ["ale", "wine", "rum", "water flask"],
  },
  {
    label: "bait",
    short: "Bait",
    words: ["bait", "grub"],
  },
];
