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

export const recipes = recipesJson as Recipe[];

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

const BANDS = [0, 15, 30, 50, 75, 100, 125, 250];

export function sameTrade(skill: string): string[] {
  const key = skill.toLowerCase();
  if (key === "smithing" || key === "blacksmithing") return ["smithing", "blacksmithing"];
  return [key];
}

export function practiceLadder(skill: string): Recipe[] {
  const keys = sameTrade(skill);
  const mine = recipes.filter(
    (recipe) => keys.includes(recipe.skill.toLowerCase()) && recipe.trivial != null,
  );
  const picked: Recipe[] = [];
  for (let index = 0; index < BANDS.length - 1; index += 1) {
    const low = BANDS[index];
    const high = BANDS[index + 1];
    const band = mine
      .filter((recipe) => {
        const trivial = recipe.trivial ?? 0;
        return trivial >= low && trivial < high;
      })
      .sort((a, b) => (a.trivial ?? 0) - (b.trivial ?? 0) || a.product.localeCompare(b.product));
    const first = band[0];
    if (first) picked.push(first);
  }
  return picked;
}

export function recipeCountFor(skill: string): number {
  const keys = sameTrade(skill);
  return recipes.filter((recipe) => keys.includes(recipe.skill.toLowerCase())).length;
}

export function iconFor(name: string): string {
  const made = byProduct.get(normalize(name));
  return made?.find((recipe) => recipe.icon)?.icon ?? "";
}
