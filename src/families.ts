export type TradeFamily = {
  label: string;
  short: string;
  words: string[];
};

export const FAMILIES: TradeFamily[] = [
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
    label: "weapons",
    short: "Weapons",
    words: ["weapon", "sword", "shortsword", "dagger", "mace", "axe", "staff", "bow", "blade", "spear", "knife", "cleaver", "hammer"],
  },
  {
    label: "armor",
    short: "Armor",
    words: ["armor", "armour", "boot", "chain", "plate", "helm", "gauntlet", "bracer", "vambrace"],
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
