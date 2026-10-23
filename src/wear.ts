import factsJson from "./data/item-facts.json";
import { FAMILIES, mentions } from "./families";

export type ArmorMaterial = "leather" | "chain" | "plate" | "cloth";

type ItemFact = {
  slot?: string;
  classes?: string[];
  drops?: string[];
};

const facts = factsJson.items as Record<string, ItemFact>;

const ARMOR_SLOTS = new Set([
  "HEAD",
  "CHEST",
  "ARMS",
  "WRIST",
  "HANDS",
  "LEGS",
  "FEET",
  "WAIST",
  "SHOULDERS",
  "BACK",
  "FACE",
  "SHIRT",
  "BELT",
]);

const PLATE = new Set(["CLR", "FTR", "INQ", "PAL", "SHD"]);
const CHAIN = new Set(["BRD", "RNG", "ROG", "SHM"]);
const CASTER = new Set(["ELE", "ENC", "NEC", "WIZ"]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function armorName(name: string): boolean {
  const armor = FAMILIES.find((family) => family.label === "armor");
  return armor ? armor.words.some((word) => mentions(name, word)) : false;
}

function armorSlot(slot: string): boolean {
  const parts = slot.toUpperCase().split(/\s+/).filter(Boolean);
  return parts.length > 0 && parts.every((part) => ARMOR_SLOTS.has(part));
}

function materialFromClasses(classes: readonly string[]): ArmorMaterial | null {
  if (classes.length === 0) return null;
  if (classes.every((name) => name === "ALL")) return "cloth";
  if (classes.some((name) => name === "DRU" || name === "MNK")) return "leather";
  if (classes.some((name) => CHAIN.has(name))) return "chain";
  if (classes.every((name) => PLATE.has(name))) return "plate";
  if (classes.every((name) => CASTER.has(name))) return "cloth";
  return null;
}

function materialFromName(name: string): ArmorMaterial | null {
  if (mentions(name, "plate") || mentions(name, "platemail")) return "plate";
  if (mentions(name, "chain") || mentions(name, "chainmail") || mentions(name, "mail")) return "chain";
  if (
    mentions(name, "leather") ||
    mentions(name, "rawhide") ||
    mentions(name, "hide") ||
    mentions(name, "pelt") ||
    mentions(name, "fur")
  ) {
    return "leather";
  }
  if (
    mentions(name, "cloth") ||
    mentions(name, "silk") ||
    mentions(name, "linen") ||
    mentions(name, "wool") ||
    mentions(name, "cotton") ||
    mentions(name, "robe") ||
    mentions(name, "shirt") ||
    mentions(name, "tailor")
  ) {
    return "cloth";
  }
  return null;
}

export function armorMaterial(name: string): ArmorMaterial | null {
  const key = normalize(name);
  if (/^(schematic|recipe|pattern|scroll|spell|song)\b/.test(key)) return null;
  const fact = facts[key];
  const slot = fact?.slot ?? "";
  if (slot && !armorSlot(slot)) return null;
  if (!slot && !armorName(name)) return null;
  const fromClass = fact?.classes ? materialFromClasses(fact.classes) : null;
  if (fromClass) return fromClass;
  return materialFromName(name);
}
