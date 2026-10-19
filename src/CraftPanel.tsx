import { craftsUsing, iconFor, recipeFor, type Recipe } from "./craft";
import { familyForName } from "./goods";
import { glyphForShort, ItemMark } from "./icons";
import { normalize } from "./match";
import { ItemLink } from "./names";
import { OutLink } from "./OutLink";

const SHOW = 6;

function RecipeRow({ recipe, focus }: { recipe: Recipe; focus: string }) {
  const key = normalize(focus);
  const stations = recipe.stations.join(" or ");
  return (
    <article className="row">
      <ItemMark src={recipe.icon || iconFor(recipe.product)} glyph={glyphForShort(familyForName(recipe.product))} />
      <div className="row-body">
        <OutLink href={recipe.wiki} className="item-name">
          {recipe.qty > 1 ? `${recipe.qty} × ` : ""}
          {recipe.product}
        </OutLink>
        <p className="meta">
          {recipe.skill}
          {recipe.trivial ? ` · trivial ${recipe.trivial}` : ""}
          {stations ? ` · ${stations}` : ""}
        </p>
        <ul className="ingredients">
          {recipe.ingredients.map((part) => {
            const have = normalize(part.name) === key;
            return (
              <li key={`${part.name}-${part.qty}`} className={have ? "have" : undefined}>
                {part.qty} × <ItemLink name={part.name} />
                {part.note ? <span> {part.note}</span> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

function RecipeList({ title, recipes, focus, empty }: { title: string; recipes: Recipe[]; focus: string; empty?: string }) {
  if (recipes.length === 0) {
    return empty ? <p className="note">{empty}</p> : null;
  }
  const visible = recipes.slice(0, SHOW);
  return (
    <>
      <h3 className="subhead">
        {title}
        <span>
          {" "}
          {recipes.length} {recipes.length === 1 ? "combine" : "combines"}
        </span>
      </h3>
      <div className="stack">
        {visible.map((recipe) => (
          <RecipeRow key={`${recipe.wiki}-${recipe.skill}-${recipe.trivial}`} recipe={recipe} focus={focus} />
        ))}
      </div>
      {recipes.length > SHOW ? (
        <p className="note">
          Showing {SHOW} of {recipes.length}. The rest are on the wiki pages for those items.
        </p>
      ) : null}
    </>
  );
}

export function CraftPanel({ name }: { name: string }) {
  const makes = craftsUsing(name);
  const made = recipeFor(name);
  return (
    <section className="craft-panel">
      <h2>Combines</h2>
      <RecipeList
        title="Crafted from this"
        recipes={makes}
        focus={name}
        empty={made.length === 0 ? "The wiki does not list a combine that uses this drop." : undefined}
      />
      <RecipeList title="How to make it" recipes={made} focus={name} />
    </section>
  );
}
