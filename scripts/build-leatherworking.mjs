import { readFileSync, writeFileSync } from "node:fs";

// Leatherworking combines whose trivial matches on
// https://monstersandmemories.miraheze.org/wiki/Skill_Leatherworking
// https://storiesofmnm.com/tradeskill/leatherworking/
// https://monstersandmemories.wiki/tradeskills/leatherworking
// Rawhide Boots uses 2 Rough Thread, as on Stories of MnM and the
// monstersandmemories.wiki item page. The Miraheze skill table says 1.
// Patched Rawhide Cloak is named from its item page. Both skill tables
// list that combine a second time under Patched Rawhide Gorget.

const rows = [
  [5, "Rawhide Canvas", "6x Rawhide Scraps"],
  [5, "Rawhide Strap", "2x Rawhide Scraps"],
  [10, "Rawhide Bracelet", "1x Rawhide Canvas, 1x Rough Thread, 2x Cloth Padding"],
  [10, "Rawhide Gorget", "1x Rawhide Canvas, 1x Rough Thread, 2x Cloth Padding"],
  [10, "Patched Rawhide Mask", "1x Rawhide Scraps, 1x Tattered Rawhide Mask"],
  [10, "Patched Rawhide Tunic", "2x Rawhide Scraps, 1x Tattered Rawhide Tunic"],
  [10, "Patched Rawhide Leggings", "2x Rawhide Scraps, 1x Tattered Rawhide Leggings"],
  [10, "Patched Rawhide Shoulderpads", "1x Rawhide Scraps, 1x Tattered Rawhide Shoulderpads"],
  [10, "Patched Rawhide Cap", "2x Rawhide Scraps, 1x Tattered Rawhide Cap"],
  [10, "Patched Rawhide Cloak", "2x Rawhide Scraps, 1x Tattered Rawhide Cloak"],
  [10, "Patched Rawhide Gloves", "1x Rawhide Scraps, 1x Tattered Rawhide Gloves"],
  [10, "Patched Rawhide Bracelet", "1x Rawhide Scraps, 1x Tattered Rawhide Bracer"],
  [10, "Patched Rawhide Belt", "1x Rawhide Scraps, 1x Tattered Rawhide Belt"],
  [10, "Patched Rawhide Gorget", "1x Rawhide Scraps, 1x Tattered Rawhide Gorget"],
  [10, "Patched Rawhide Boots", "1x Rawhide Scraps, 1x Tattered Rawhide Boots"],
  [20, "Rawhide Cloak", "1x Rawhide Canvas, 2x Rough Thread, 2x Cloth Padding"],
  [20, "Rawhide Gloves", "1x Rawhide Canvas, 2x Rough Thread, 2x Cloth Padding"],
  [30, "Rawhide Belt", "1x Rawhide Canvas, 1x Rough Thread, 2x Cloth Padding"],
  [30, "Rawhide Mask", "1x Rawhide Canvas, 1x Rough Thread, 2x Cloth Padding"],
  [40, "Rawhide Boots", "1x Rawhide Canvas, 2x Rough Thread, 2x Cloth Padding"],
  [45, "Rawhide Saddlebag", "6x Rawhide Canvas, 4x Rough Thread"],
  [50, "Rawhide Cap", "2x Rawhide Canvas, 2x Rough Thread, 2x Cloth Padding"],
  [50, "Rawhide Shoulderpads", "2x Rawhide Canvas, 2x Rough Thread, 2x Cloth Padding"],
  [55, "Enchanted Rawhide Canvas", "6x Enchanted Rawhide"],
  [60, "Rawhide Saddle", "2x Rawhide Scraps, 3x Rawhide Strap, 1x Copper Stirrups"],
  [65, "Rawhide Backpack", "7x Rawhide Canvas, 3x Rough Thread"],
  [70, "Rawhide Leggings", "3x Rawhide Canvas, 3x Rough Thread, 3x Cloth Padding"],
  [70, "Enchanted Rawhide Cap", "2x Enchanted Rawhide Canvas, 2x Rough Thread, 2x Cloth Padding"],
  [70, "Enchanted Rawhide Leggings", "3x Enchanted Rawhide Canvas, 3x Rough Thread, 3x Cloth Padding"],
  [70, "Rawhide Tunic", "4x Rawhide Canvas, 3x Rough Thread, 3x Cloth Padding"],
  [75, "Enchanted Rawhide Tunic", "4x Enchanted Rawhide Canvas, 3x Rough Thread, 3x Cloth Padding"],
  [10, "Patched Hide Tunic", "2x Hide Scraps, 1x Tattered Hide Tunic"],
  [10, "Patched Hide Leggings", "2x Hide Scraps, 1x Tattered Hide Leggings"],
  [10, "Patched Hide Cap", "2x Hide Scraps, 1x Tattered Hide Cap"],
  [10, "Patched Hide Gloves", "1x Hide Scraps, 1x Tattered Hide Gloves"],
  [10, "Patched Hide Belt", "1x Hide Scraps, 1x Tattered Hide Belt"],
  [10, "Patched Hide Gorget", "1x Hide Scraps, 1x Tattered Hide Gorget"],
  [10, "Patched Hide Cloak", "1x Hide Scraps, 1x Tattered Hide Cloak"],
  [10, "Patched Hide Mask", "1x Hide Scraps, 1x Tattered Hide Mask"],
  [10, "Patched Hide Boots", "1x Hide Scraps, 1x Tattered Hide Boots"],
  [10, "Patched Hide Bracer", "1x Hide Scraps, 1x Tattered Hide Bracer"],
  [10, "Patched Hide Shoulderpads", "1x Hide Scraps, 1x Tattered Hide Shoulderpads"],
  [80, "Hide Canvas", "6x Hide Scraps"],
  [80, "Hide Strap", "2x Hide Scraps"],
  [85, "Hide Bracelet", "1x Hide Canvas, 1x Rough Thread, 2x Wool Padding"],
  [85, "Hide Gorget", "1x Hide Canvas, 1x Rough Thread, 2x Wool Padding"],
  [95, "Hide Cloak", "1x Hide Canvas, 2x Rough Thread, 2x Wool Padding"],
  [95, "Hide Gloves", "1x Hide Canvas, 2x Rough Thread, 2x Wool Padding"],
  [105, "Hide Belt", "1x Hide Canvas, 1x Rough Thread, 2x Wool Padding"],
  [105, "Hide Mask", "1x Hide Canvas, 1x Rough Thread, 2x Wool Padding"],
  [115, "Enchanted Hide Canvas", "6x Enchanted Hide"],
  [115, "Hide Boots", "1x Hide Canvas, 2x Rough Thread, 2x Wool Padding"],
  [120, "Hide Saddlebag", "6x Hide Canvas, 4x Rough Thread"],
  [125, "Hide Saddle", "2x Hide Scraps, 3x Hide Strap, 1x Bronze Stirrups"],
  [125, "Hide Cap", "2x Hide Canvas, 2x Rough Thread, 2x Wool Padding"],
  [125, "Hide Shoulderpads", "2x Hide Canvas, 2x Rough Thread, 2x Wool Padding"],
  [130, "Hide Backpack", "7x Hide Canvas, 3x Rough Thread"],
  [135, "Hide Leggings", "3x Hide Canvas, 3x Rough Thread, 3x Wool Padding"],
  [140, "Enchanted Hide Cap", "2x Enchanted Hide Canvas, 2x Rough Thread, 2x Wool Padding"],
  [150, "Enchanted Hide Leggings", "3x Enchanted Hide Canvas, 3x Rough Thread, 3x Wool Padding"],
  [150, "Hide Tunic", "4x Hide Canvas, 3x Rough Thread, 3x Wool Padding"],
  [150, "Enchanted Hide Tunic", "4x Enchanted Hide Canvas, 3x Rough Thread, 3x Wool Padding"],
  [155, "Leather Canvas", "6x Leather Scraps"],
  [155, "Leather Strap", "2x Leather Scraps"],
  [160, "Leather Bracelet", "1x Leather Canvas, 1x Light Thread, 2x Cotton Padding"],
  [160, "Leather Gorget", "1x Leather Canvas, 1x Light Thread, 2x Cotton Padding"],
  [170, "Leather Cloak", "1x Leather Canvas, 2x Light Thread, 2x Cotton Padding"],
  [170, "Leather Gloves", "1x Leather Canvas, 2x Light Thread, 2x Cotton Padding"],
  [180, "Enchanted Leather Canvas", "6x Enchanted Leather"],
  [180, "Leather Belt", "1x Leather Canvas, 1x Light Thread, 2x Cotton Padding"],
  [180, "Leather Mask", "1x Leather Canvas, 1x Light Thread, 2x Cotton Padding"],
  [190, "Leather Saddle", "2x Leather Scraps, 3x Leather Strap, 1x Iron Stirrups"],
  [190, "Leather Boots", "1x Leather Canvas, 2x Light Thread, 2x Cotton Padding"],
  [195, "Leather Saddlebag", "6x Leather Canvas, 4x Light Thread"],
  [200, "Leather Cap", "2x Leather Canvas, 2x Light Thread, 2x Cotton Padding"],
  [200, "Leather Shoulderpads", "2x Leather Canvas, 2x Light Thread, 2x Cotton Padding"],
  [205, "Leather Backpack", "7x Leather Canvas, 3x Light Thread"],
  [210, "Leather Leggings", "3x Leather Canvas, 3x Light Thread, 3x Cotton Padding"],
  [215, "Enchanted Leather Cap", "2x Enchanted Leather Canvas, 2x Light Thread, 2x Cotton Padding"],
  [225, "Enchanted Leather Leggings", "3x Enchanted Leather Canvas, 3x Light Thread, 3x Cotton Padding"],
  [225, "Leather Tunic", "4x Leather Canvas, 3x Light Thread, 3x Cotton Padding"],
  [230, "Enchanted Leather Tunic", "4x Enchanted Leather Canvas, 3x Light Thread, 3x Cotton Padding"],
  [230, "Padded Leather Canvas", "6x Padded Leather Scraps"],
  [230, "Padded Leather Strap", "2x Padded Leather Scraps"],
  [240, "Padded Leather Bracelet", "1x Padded Leather Canvas, 1x Light Thread, 2x Linen Padding"],
  [240, "Padded Leather Gorget", "1x Padded Leather Canvas, 1x Light Thread, 2x Linen Padding"],
  [250, "Enchanted Padded Leather Canvas", "6x Enchanted Padded Leather"],
  [250, "Padded Leather Cloak", "1x Padded Leather Canvas, 2x Light Thread, 2x Linen Padding"],
  [250, "Padded Leather Gloves", "1x Padded Leather Canvas, 2x Light Thread, 2x Linen Padding"],
  [255, "Padded Leather Saddle", "2x Padded Leather Scraps, 3x Padded Leather Strap, 1x Steel Stirrups"],
  [255, "Padded Leather Belt", "1x Padded Leather Canvas, 1x Light Thread, 2x Linen Padding"],
  [255, "Padded Leather Mask", "1x Padded Leather Canvas, 1x Light Thread, 2x Linen Padding"],
  [260, "Padded Leather Boots", "1x Padded Leather Canvas, 2x Light Thread, 2x Linen Padding"],
  [265, "Padded Leather Saddlebag", "6x Padded Leather Canvas, 4x Light Thread"],
  [270, "Padded Leather Cap", "2x Padded Leather Canvas, 2x Light Thread, 2x Linen Padding"],
  [270, "Padded Leather Shoulderpads", "2x Padded Leather Canvas, 2x Light Thread, 2x Linen Padding"],
  [275, "Padded Leather Backpack", "7x Padded Leather Canvas, 3x Light Thread"],
  [280, "Padded Leather Leggings", "3x Padded Leather Canvas, 3x Light Thread, 3x Linen Padding"],
  [285, "Enchanted Padded Leather Cap", "2x Enchanted Padded Leather Canvas, 2x Light Thread, 2x Linen Padding"],
  [295, "Enchanted Padded Leather Leggings", "3x Enchanted Padded Leather Canvas, 3x Light Thread, 3x Linen Padding"],
  [295, "Padded Leather Tunic", "4x Padded Leather Canvas, 3x Light Thread, 3x Linen Padding"],
  [300, "Enchanted Padded Leather Tunic", "4x Enchanted Padded Leather Canvas, 3x Light Thread, 3x Linen Padding"],
];

const breakdowns = [
  ["Tattered Rawhide Leggings", "Rawhide Scraps", 2],
  ["Tattered Rawhide Cap", "Rawhide Scraps", 2],
  ["Tattered Rawhide Shoulderpads", "Rawhide Scraps", 2],
  ["Tattered Rawhide Vest", "Rawhide Scraps", 1],
  ["Tattered Rawhide Gloves", "Rawhide Scraps", 1],
  ["Tattered Rawhide Tunic", "Rawhide Scraps", 4],
  ["Tattered Rawhide Gorget", "Rawhide Scraps", 1],
  ["Tattered Rawhide Bracer", "Rawhide Scraps", 1],
  ["Tattered Rawhide Mask", "Rawhide Scraps", 1],
  ["Tattered Rawhide Cloak", "Rawhide Scraps", 1],
  ["Tattered Rawhide Boots", "Rawhide Scraps", 1],
  ["Tattered Hide Mask", "Hide Scraps", 1],
  ["Tattered Hide Boots", "Hide Scraps", 1],
  ["Tattered Hide Leggings", "Hide Scraps", 2],
  ["Tattered Hide Gloves", "Hide Scraps", 1],
];

const existing = JSON.parse(readFileSync("src/data/recipes.json", "utf8"));
const icons = new Map();
for (const recipe of existing) {
  if (recipe.icon && !icons.has(recipe.product)) icons.set(recipe.product, recipe.icon);
}

function ingredients(text) {
  return text.split(",").map((part) => {
    const match = part.trim().match(/^(\d+)x\s+(.+)$/);
    if (!match) throw new Error(`Bad ingredient: ${part}`);
    return { name: match[2], qty: Number(match[1]), note: "" };
  });
}

function wiki(name) {
  return `https://monstersandmemories.miraheze.org/wiki/${encodeURI(name.replace(/ /g, "_"))}`;
}

const recipes = rows.map(([trivial, product, text]) => {
  const parts = ingredients(text);
  const count = parts.reduce((sum, part) => sum + part.qty, 0);
  return {
    product,
    qty: 1,
    skill: "Leatherworking",
    trivial,
    stations: count >= 7 ? ["Leatherworking Station"] : ["Leatherworking Kit"],
    ingredients: parts,
    wiki: wiki(product),
    icon: icons.get(product) ?? "",
  };
});

const file = {
  recipes,
  breakdowns: breakdowns.map(([item, yields, qty]) => ({ item, yields, qty })),
};

writeFileSync("src/data/leatherworking.json", `${JSON.stringify(file, null, 2)}\n`);
console.log(`recipes ${recipes.length} breakdowns ${file.breakdowns.length}`);
