import leatherworkingJson from "./data/leatherworking.json";
import recipesJson from "./data/recipes.json";
import { normalize } from "./match";

export type Ingredient = {
  name: string;
  qty: number;
  note: string;
};

export type Recipe = {
  product: string;
  qty: number;
  skill: string;
  trivial: number | null;
  stations: string[];
  ingredients: Ingredient[];
  wiki: string;
  icon: string;
};

const leatherworking = leatherworkingJson as {
  recipes: Recipe[];
  breakdowns: { item: string; yields: string; qty: number }[];
};

export const recipes: Recipe[] = [
  ...(recipesJson as Recipe[]).filter((recipe) => recipe.skill !== "Leatherworking"),
  ...leatherworking.recipes,
];

const breakdowns = leatherworking.breakdowns;

const byIngredient = new Map<string, Recipe[]>();
const byProduct = new Map<string, Recipe[]>();

for (const recipe of recipes) {
  const productKey = normalize(recipe.product);
  const made = byProduct.get(productKey) ?? [];
  made.push(recipe);
  byProduct.set(productKey, made);
  for (const ingredient of recipe.ingredients) {
    const key = normalize(ingredient.name);
    const uses = byIngredient.get(key) ?? [];
    if (!uses.includes(recipe)) uses.push(recipe);
    byIngredient.set(key, uses);
  }
}

function byTrivial(list: Recipe[]): Recipe[] {
  return [...list].sort((a, b) => (a.trivial ?? 9999) - (b.trivial ?? 9999) || a.product.localeCompare(b.product));
}

export function craftsUsing(name: string): Recipe[] {
  return byTrivial(byIngredient.get(normalize(name)) ?? []);
}

export type KeptUse = {
  skill: string;
  qtyLabel: string;
  from: number | null;
  examples: { name: string; wiki: string }[];
  more: number;
};

function displaySkill(skill: string): string {
  if (skill.toLowerCase() === "blacksmithing") return "Smithing";
  return skill;
}

export function keptFor(product: string): KeptUse[] {
  const key = normalize(product);
  const uses = craftsUsing(product).filter((recipe) => normalize(recipe.product) !== key);
  const grouped = new Map<string, Recipe[]>();
  for (const recipe of uses) {
    const list = grouped.get(recipe.skill) ?? [];
    list.push(recipe);
    grouped.set(recipe.skill, list);
  }
  const rows: KeptUse[] = [];
  for (const [skill, list] of grouped) {
    const qtys = list.map((recipe) => recipe.ingredients.find((item) => normalize(item.name) === key)?.qty ?? 1);
    const low = Math.min(...qtys);
    const high = Math.max(...qtys);
    const trivials = list.flatMap((recipe) => (recipe.trivial == null ? [] : [recipe.trivial]));
    const examples = list.slice(0, 2).map((recipe) => ({ name: recipe.product, wiki: recipe.wiki }));
    rows.push({
      skill: displaySkill(skill),
      qtyLabel: low === high ? String(low) : `${low}–${high}`,
      from: trivials.length > 0 ? Math.min(...trivials) : null,
      examples,
      more: Math.max(0, list.length - examples.length),
    });
  }
  return rows.sort((a, b) => (a.from ?? 9999) - (b.from ?? 9999) || a.skill.localeCompare(b.skill));
}

export function recipeFor(name: string): Recipe[] {
  return byTrivial(byProduct.get(normalize(name)) ?? []);
}

export type SkillBand = {
  trivial: number;
  recipes: Recipe[];
};

export function sameTrade(skill: string): string[] {
  const key = skill.toLowerCase();
  if (key === "smithing" || key === "blacksmithing") return ["smithing", "blacksmithing"];
  return [key];
}

function combineCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.qty, 0);
}

export function skillBands(skill: string, yours: number | null): SkillBand[] {
  const keys = sameTrade(skill);
  const grouped = new Map<number, Recipe[]>();
  for (const recipe of recipes) {
    if (!keys.includes(recipe.skill.toLowerCase()) || recipe.trivial == null) continue;
    if (yours != null && recipe.trivial <= yours) continue;
    const list = grouped.get(recipe.trivial) ?? [];
    list.push(recipe);
    grouped.set(recipe.trivial, list);
  }
  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([trivial, list]) => ({
      trivial,
      recipes: list.sort(
        (a, b) =>
          Number(a.product.toLowerCase().startsWith("patched")) -
            Number(b.product.toLowerCase().startsWith("patched")) ||
          combineCost(a) - combineCost(b) ||
          a.product.localeCompare(b.product),
      ),
    }));
}

export function breaksInto(material: string): { item: string; qty: number }[] {
  const key = normalize(material);
  return breakdowns
    .filter((row) => normalize(row.yields) === key)
    .map((row) => ({ item: row.item, qty: row.qty }))
    .sort((a, b) => b.qty - a.qty || a.item.localeCompare(b.item));
}

export function recipeCountFor(skill: string): number {
  const keys = sameTrade(skill);
  return recipes.filter((recipe) => keys.includes(recipe.skill.toLowerCase())).length;
}

export function iconFor(name: string): string {
  const made = byProduct.get(normalize(name));
  return made?.find((recipe) => recipe.icon)?.icon ?? "";
}
