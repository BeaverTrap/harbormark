import { useEffect, useState } from "react";

export type TraitSlot = "major-combat" | "minor-combat" | "major-trade" | "minor-trade";

export type WikiTrait = {
  name: string;
  slot: TraitSlot;
  classes: readonly string[];
  note: string;
  starts?: readonly { skill: string; level: number }[];
};

const ANY = ["Any"] as const;
const CASTERS = ["BST", "CLR", "DRU", "ELE", "ENC", "INQ", "NEC", "PAL", "RNG", "SHD", "SHM", "SPB", "WIZ"] as const;

export const TRAIT_SLOTS: readonly TraitSlot[] = ["major-combat", "minor-combat", "major-trade", "minor-trade"];

export function traitSlotLabel(slot: TraitSlot): string {
  switch (slot) {
    case "major-combat":
      return "Major Combat";
    case "minor-combat":
      return "Minor Combat";
    case "major-trade":
      return "Major Non-Combat";
    case "minor-trade":
      return "Minor Non-Combat";
    default: {
      const exhaustive: never = slot;
      return exhaustive;
    }
  }
}

export const WIKI_TRAITS: readonly WikiTrait[] = [
  { name: "Agile", slot: "major-combat", classes: ANY, note: "Agility +5%. Active: Agility +50% for 15 seconds." },
  { name: "Charismatic", slot: "major-combat", classes: ANY, note: "Charisma +5%. Active: Charisma +50% for 15 seconds." },
  { name: "Cold Resistant", slot: "major-combat", classes: ANY, note: "Cold resistance is higher, with a short cleanse." },
  { name: "Corruption Resistant", slot: "major-combat", classes: ANY, note: "Corruption resistance is higher, with a short cleanse." },
  { name: "Dexterous", slot: "major-combat", classes: ANY, note: "Dexterity +5%. Active: Dexterity +50% for 15 seconds." },
  { name: "Disease Resistant", slot: "major-combat", classes: ANY, note: "Disease resistance is higher, with a short cleanse." },
  { name: "Electric Resistant", slot: "major-combat", classes: ANY, note: "Electric resistance is higher, with a short cleanse." },
  { name: "Fire Resistant", slot: "major-combat", classes: ANY, note: "Fire resistance is higher, with a short cleanse." },
  { name: "Holy Resistant", slot: "major-combat", classes: ANY, note: "Holy resistance is higher, with a short cleanse." },
  { name: "Intelligent", slot: "major-combat", classes: ANY, note: "Intelligence +5%. Active: Intelligence +50% for 15 seconds." },
  { name: "Magic Resistant", slot: "major-combat", classes: ANY, note: "Magic resistance is higher, with a short cleanse." },
  { name: "Poison Resistant", slot: "major-combat", classes: ANY, note: "Poison resistance is higher, with a short cleanse." },
  { name: "Strong", slot: "major-combat", classes: ANY, note: "Strength +5%. Active: Strength +50% for 15 seconds." },
  { name: "Tough", slot: "major-combat", classes: ANY, note: "Stamina +5%. Active: Stamina +50% for 15 seconds." },
  { name: "Wise", slot: "major-combat", classes: ANY, note: "Wisdom +5%. Active: Wisdom +50% for 15 seconds." },
  { name: "Abjurer", slot: "minor-combat", classes: CASTERS, note: "Abjuration starts at 10 and rises 25% faster." },
  { name: "Alterer", slot: "minor-combat", classes: CASTERS, note: "Alteration starts at 10 and rises 25% faster." },
  { name: "Bludgeoner", slot: "minor-combat", classes: ["BST", "CLR", "DRU", "ELE", "ENC", "FTR", "MNK", "NEC", "PAL", "ROG", "SHM", "SPB", "WIZ"], note: "Bludgeoning starts at 5 and rises 25% faster." },
  { name: "Bowman", slot: "minor-combat", classes: ["ARC", "BST", "FTR", "INQ", "PAL", "RNG", "ROG", "SHD", "SPB"], note: "Archery starts at 5 and rises 25% faster." },
  { name: "Brawler", slot: "minor-combat", classes: ["MNK"], note: "Dual Wield starts at 20 and rises 25% faster. Monk only." },
  { name: "Channeler", slot: "minor-combat", classes: CASTERS, note: "Channeling starts at 10 and rises 25% faster." },
  { name: "Conjurer", slot: "minor-combat", classes: CASTERS, note: "Conjuration starts at 10 and rises 25% faster." },
  { name: "Cutthroat", slot: "minor-combat", classes: ["ARC", "BRD", "BST", "ELE", "ENC", "FTR", "INQ", "NEC", "RNG", "ROG", "SHD", "SHM", "SPB", "WIZ"], note: "Piercing starts at 5 and rises 25% faster." },
  { name: "Defender", slot: "minor-combat", classes: ANY, note: "Defense starts at 5 and rises 25% faster." },
  { name: "Diviner", slot: "minor-combat", classes: CASTERS, note: "Divination starts at 10 and rises 25% faster." },
  { name: "Evoker", slot: "minor-combat", classes: CASTERS, note: "Evocation starts at 10 and rises 25% faster." },
  { name: "Knife Thrower", slot: "minor-combat", classes: ["ARC", "BST", "FTR", "MNK", "RNG", "ROG", "SPB"], note: "Throwing starts at 5 and rises 25% faster." },
  { name: "Shieldman", slot: "minor-combat", classes: ["BRD", "CLR", "DRU", "FTR", "INQ", "PAL", "RNG", "SHD", "SHM", "SPB"], note: "Block starts at 5 and rises 25% faster." },
  { name: "Swordsman", slot: "minor-combat", classes: ["ARC", "BRD", "BST", "DRU", "FTR", "INQ", "PAL", "RNG", "ROG", "SHD", "SPB", "WIZ"], note: "Slashing starts at 5 and rises 25% faster." },
  { name: "Virtuoso", slot: "minor-combat", classes: ["BRD"], note: "Instrument skills start at 25. Bard only." },
  { name: "Vocalist", slot: "minor-combat", classes: ["BRD"], note: "Singing starts at 50. Bard only." },
  { name: "Warrior", slot: "minor-combat", classes: ANY, note: "Offense starts at 5 and rises 25% faster." },
  { name: "Fast Metabolism", slot: "major-trade", classes: ANY, note: "Endurance +25%. Food is consumed 25% faster." },
  { name: "Forage", slot: "major-trade", classes: ["ARC", "BRD", "BST", "CLR", "ELE", "ENC", "FTR", "INQ", "MNK", "NEC", "PAL", "ROG", "SHD", "SHM", "SPB", "WIZ"], note: "Search the area for food, drink, and supplies. Not every race." },
  { name: "Infravision", slot: "major-trade", classes: ANY, note: "Better vision in darkness. Not every race." },
  { name: "Iron Lungs", slot: "major-trade", classes: ANY, note: "Underwater air +200%. Endurance −25%." },
  { name: "Master Artisan", slot: "major-trade", classes: ANY, note: "Carpentry, Smithing, Jewelcrafting, Leatherworking, Pottery, and Tailoring rise 5% faster." },
  { name: "Readiness", slot: "major-trade", classes: ["CLR", "DRU", "ELE", "ENC", "NEC", "SHM", "WIZ"], note: "Start with a Cantrip slot." },
  { name: "Slow Metabolism", slot: "major-trade", classes: ANY, note: "Food lasts longer. Endurance −25%." },
  { name: "Ultravision", slot: "major-trade", classes: ANY, note: "Much better vision in darkness, worse in bright light. Deep races." },
  { name: "Alchemist", slot: "minor-trade", classes: ANY, note: "Alchemy starts at 25.", starts: [{ skill: "Alchemy", level: 25 }] },
  { name: "Blacksmith", slot: "minor-trade", classes: ANY, note: "Smithing starts at 25.", starts: [{ skill: "Smithing", level: 25 }] },
  { name: "Bookworm", slot: "minor-trade", classes: ["BST", "CLR", "DRU", "ELE", "ENC", "INQ", "NEC", "PAL", "RNG", "SHD", "SHM", "SPB", "WIZ"], note: "Start with an extra trainee spellbook." },
  { name: "Brewmaster", slot: "minor-trade", classes: ANY, note: "Brewing starts at 25.", starts: [{ skill: "Brewing", level: 25 }] },
  { name: "Carpenter", slot: "minor-trade", classes: ANY, note: "Carpentry starts at 25.", starts: [{ skill: "Carpentry", level: 25 }] },
  { name: "Chef", slot: "minor-trade", classes: ANY, note: "Cooking starts at 25.", starts: [{ skill: "Cooking", level: 25 }] },
  { name: "Disenchanter", slot: "minor-trade", classes: ANY, note: "Disenchanting starts at 25.", starts: [{ skill: "Disenchanting", level: 25 }] },
  { name: "Enchanter", slot: "minor-trade", classes: ANY, note: "Enchanting starts at 25.", starts: [{ skill: "Enchanting", level: 25 }] },
  { name: "Fisherman", slot: "minor-trade", classes: ANY, note: "Fishing starts at 25.", starts: [{ skill: "Fishing", level: 25 }] },
  { name: "Fletcher", slot: "minor-trade", classes: ANY, note: "Fletching starts at 25.", starts: [{ skill: "Fletching", level: 25 }] },
  { name: "Herbalist", slot: "minor-trade", classes: ANY, note: "Herbalism starts at 25.", starts: [{ skill: "Herbalism", level: 25 }] },
  { name: "Jewelcrafter", slot: "minor-trade", classes: ANY, note: "Jewelcrafting starts at 25.", starts: [{ skill: "Jewelcrafting", level: 25 }] },
  { name: "Leatherworker", slot: "minor-trade", classes: ANY, note: "Leatherworking starts at 25.", starts: [{ skill: "Leatherworking", level: 25 }] },
  { name: "Lumberjack", slot: "minor-trade", classes: ANY, note: "Lumberjacking starts at 25.", starts: [{ skill: "Lumberjacking", level: 25 }] },
  { name: "Medic", slot: "minor-trade", classes: ANY, note: "Bind Wound starts at 25. Survival starts at 5.", starts: [{ skill: "Bind Wound", level: 25 }, { skill: "Survival", level: 5 }] },
  { name: "Merchant", slot: "minor-trade", classes: ANY, note: "Commerce starts at 25." },
  { name: "Miner", slot: "minor-trade", classes: ANY, note: "Mining starts at 25.", starts: [{ skill: "Mining", level: 25 }] },
  { name: "Poison Maker", slot: "minor-trade", classes: ["ROG"], note: "Poison Making starts at 25. Rogue only.", starts: [{ skill: "Poison Making", level: 25 }] },
  { name: "Smelter", slot: "minor-trade", classes: ANY, note: "Smelting starts at 25.", starts: [{ skill: "Smelting", level: 25 }] },
  { name: "Stonecutter", slot: "minor-trade", classes: ANY, note: "Stone Cutting starts at 25.", starts: [{ skill: "Stone Cutting", level: 25 }] },
  { name: "Stonemason", slot: "minor-trade", classes: ANY, note: "Masonry starts at 25." },
  { name: "Survivalist", slot: "minor-trade", classes: ANY, note: "Survival starts at 25.", starts: [{ skill: "Survival", level: 25 }] },
  { name: "Swimmer", slot: "minor-trade", classes: ANY, note: "Swimming starts at 25." },
  { name: "Tailor", slot: "minor-trade", classes: ANY, note: "Tailoring starts at 25.", starts: [{ skill: "Tailoring", level: 25 }] },
  { name: "Tavern Regular", slot: "minor-trade", classes: ANY, note: "Alcohol Tolerance starts at 25." },
  { name: "Tinkerer", slot: "minor-trade", classes: ANY, note: "Tinkering starts at 25.", starts: [{ skill: "Tinkering", level: 25 }] },
  { name: "Tracker", slot: "minor-trade", classes: ["BRD", "DRU", "RNG"], note: "Tracking starts at 25." },
  { name: "Woodworker", slot: "minor-trade", classes: ANY, note: "Woodworking starts at 25.", starts: [{ skill: "Woodworking", level: 25 }] },
];

export type TraitPicks = Record<TraitSlot, string>;

const EMPTY_PICKS: TraitPicks = {
  "major-combat": "",
  "minor-combat": "",
  "major-trade": "",
  "minor-trade": "",
};

const KEY = "harbormark-traits";
const EVENT = "harbormark-traits";

function isSlot(value: string): value is TraitSlot {
  return value === "major-combat" || value === "minor-combat" || value === "major-trade" || value === "minor-trade";
}

export function traitsFor(slot: TraitSlot, classCode: string | null, picked: string): WikiTrait[] {
  return WIKI_TRAITS.filter((trait) => {
    if (trait.slot !== slot) return false;
    if (trait.name === picked) return true;
    if (!classCode || trait.classes.includes("Any") || trait.classes.includes(classCode)) return true;
    return false;
  });
}

export function traitStart(picks: TraitPicks, skill: string): number | null {
  for (const name of Object.values(picks)) {
    const trait = WIKI_TRAITS.find((item) => item.name === name);
    const start = trait?.starts?.find((item) => item.skill === skill);
    if (start) return start.level;
  }
  return null;
}

export function readTraits(): TraitPicks {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...EMPTY_PICKS };
    const picks = { ...EMPTY_PICKS };
    for (const [slot, value] of Object.entries(raw)) {
      if (!isSlot(slot) || typeof value !== "string") continue;
      if (value && !WIKI_TRAITS.some((trait) => trait.slot === slot && trait.name === value)) continue;
      picks[slot] = value;
    }
    return picks;
  } catch {
    return { ...EMPTY_PICKS };
  }
}

export function writeTrait(slot: TraitSlot, name: string): void {
  const picks = readTraits();
  const known = WIKI_TRAITS.some((trait) => trait.slot === slot && trait.name === name);
  picks[slot] = known ? name : "";
  localStorage.setItem(KEY, JSON.stringify(picks));
  window.dispatchEvent(new Event(EVENT));
}

export function useTraits(): [TraitPicks, (slot: TraitSlot, name: string) => void] {
  const [picks, setPicks] = useState(readTraits);

  useEffect(() => {
    const sync = () => setPicks(readTraits());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [picks, writeTrait];
}
