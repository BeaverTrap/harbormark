import { useEffect, useMemo, useState } from "react";
import { skills } from "./catalog";
import { breaksInto, recipeCountFor, recipeFor, skillBands, type Recipe } from "./craft";
import { useCraftLevels } from "./crafts";
import { Glyph, type GlyphName } from "./icons";
import { ItemLink, LinkedText, NameList, PlaceText, ZoneLink } from "./names";
import { OutLink } from "./OutLink";
import { readSaved, writeSaved } from "./saved";
import { campsFor, materialPlan, stockedBy, type MaterialCamp, type MaterialPlan, type VendorLine } from "./supply";
import type { TradeSkill } from "./types";

const GLYPHS: Record<string, GlyphName> = {
  Tailoring: "cloth",
  Spinning: "cloth",
  Leatherworking: "hides",
  Skinning: "hides",
  Tanning: "hides",
  Blacksmithing: "weapons",
  Smithing: "weapons",
  Fletching: "weapons",
  Mining: "ore",
  Smelting: "ore",
  Jewelcrafting: "gems",
  "Stone Cutting": "gems",
  Cooking: "food",
  Brewing: "drink",
  Fermenting: "drink",
  Fishing: "fish",
  Herbalism: "herbs",
  Alchemy: "reagents",
  "Poison Making": "reagents",
  Woodworking: "wood",
  Carpentry: "wood",
  Lumberjacking: "wood",
  Farming: "herbs",
  Survival: "lights",
};

function skillGlyph(name: string): GlyphName {
  return GLYPHS[name] ?? "craft";
}

function isInGame(skill: TradeSkill): boolean {
  const written = [skill.intro.join(" "), ...skill.sections.flatMap((section) => section.lines)].join(" ");
  if (/potential tradeskill|no implementation specifics/i.test(written)) return false;
  const detail = written
    .replace(new RegExp(`${skill.name} is one of the many tradeskills in Monsters & Memories\\.?`, "ig"), "")
    .replace(new RegExp(`\\b${skill.name}\\b`, "g"), "")
    .trim();
  return (
    skill.trainers.length > 0 ||
    skill.tools.length > 0 ||
    skill.station.length > 0 ||
    detail.length > 40 ||
    recipeCountFor(skill.name) > 0
  );
}

function asPlayed(skill: TradeSkill): TradeSkill {
  if (skill.name === "Smelting") {
    return {
      ...skill,
      intro: [
        "Smelting turns ore into bars at a forge. Smithing is the anvil skill that uses those bars.",
        ...skill.intro,
      ],
    };
  }
  if (skill.name !== "Blacksmithing") return skill;
  return {
    ...skill,
    name: "Smithing",
    intro: [
      "The game calls this Smithing. On the wiki the page is titled Blacksmithing, and Smithing redirects there. Smelting is separate: that one turns ore into bars at a forge.",
      ...skill.intro,
    ],
  };
}

export function CraftDesk() {
  const all = useMemo(() => skills.filter(isInGame).map(asPlayed), []);
  const [name, setName] = useState(() => {
    const saved = readSaved("skill") ?? "Leatherworking";
    return saved === "Blacksmithing" ? "Smithing" : saved;
  });
  const [craftLevels, setCraftLevel] = useCraftLevels();
  const skill = all.find((item) => item.name === name) ?? all.find((item) => item.name === "Leatherworking") ?? all[0];

  useEffect(() => {
    if (skill) writeSaved("skill", skill.name);
  }, [skill]);

  if (!skill) return null;
  const yours = craftLevels[skill.name] ?? null;
  const bands = skillBands(skill.name, yours);
  const current = bands[0]?.recipes ?? [];
  const made = current.filter((recipe) => !recipe.product.toLowerCase().startsWith("patched"));
  const steps = made.length > 0 ? made : current;
  const combines = recipeCountFor(skill.name);
  const hasNotes = skill.intro.length > 0 || skill.sections.length > 0;
  const materials = ladderMaterials(steps);
  const drops = feedDrops(steps);

  return (
    <section className="desk">
      <div className="desk-copy">
        <h2>Skills</h2>
        <p>
          Enter the skill you are training. Each block is what to repeat until that trivial. The drops match the
          block you are on.
        </p>
      </div>
      <div className="routine-layout">
        <div className="class-list" role="listbox" aria-label="Trade">
          {all.map((item) => (
            <button
              key={item.name}
              type="button"
              role="option"
              aria-selected={item.name === skill.name}
              className={item.name === skill.name ? "class-btn active" : "class-btn"}
              onClick={() => setName(item.name)}
            >
              <Glyph name={skillGlyph(item.name)} />
              {item.name}
            </button>
          ))}
        </div>
        <div className="routine-body">
          <section className="pane pane-violet">
          <div className="level-row">
            <h3>
              {skill.name}
              {skill.role ? <span className="craft-hint"> {skill.role}</span> : null}
            </h3>
          </div>
          <label className="char-level">
            {`Your ${skill.name}`}
            <input
              type="number"
              min={0}
              max={300}
              value={yours ?? ""}
              placeholder="0"
              aria-label={`Your ${skill.name}`}
              onChange={(event) => {
                if (event.target.value === "") {
                  setCraftLevel(skill.name, null);
                  return;
                }
                const next = Number(event.target.value);
                if (Number.isInteger(next)) setCraftLevel(skill.name, next);
              }}
            />
          </label>
          <dl className="skill-facts">
            {skill.trainers.length > 0 ? (
              <div>
                <dt>Trainers</dt>
                <dd>
                  <NameList names={skill.trainers.flatMap((name) => name.split(",").map((part) => part.trim()).filter(Boolean))} />
                </dd>
              </div>
            ) : null}
            {skill.location ? (
              <div>
                <dt>Where</dt>
                <dd>
                  <PlaceText text={skill.location} />
                </dd>
              </div>
            ) : null}
            {skill.tools.length > 0 ? (
              <div>
                <dt>Tools</dt>
                <dd>
                  <NameList names={skill.tools} />
                </dd>
              </div>
            ) : null}
            {skill.station ? (
              <div>
                <dt>Station</dt>
                <dd>
                  <ItemLink name={skill.station} />
                </dd>
              </div>
            ) : null}
          </dl>
          </section>
          {bands.length > 0 ? (
            <section className="pane pane-green">
              <h3 className="subhead">
                What to make
                {combines > 0 ? <span className="craft-hint"> {combines} combines</span> : null}
              </h3>
              <p className="source">
                {`A combine raises ${skill.name} until your skill reaches its trivial. Then move to the next block.`}
              </p>
              {bands.map((band, index) => (
                <div key={band.trivial}>
                  <h3 className="subhead">
                    {index === 0 && yours != null ? `At ${yours}, repeat until ${band.trivial}` : `Until ${band.trivial}`}
                  </h3>
                  <ul className="pile">
                    {band.recipes.map((recipe) => (
                      <li key={`${recipe.product}-${recipe.trivial}`}>
                        <strong>
                          <ItemLink name={recipe.product} />
                          <span className="craft-hint">
                            {recipe.stations.length > 0 ? recipe.stations.join(", ") : `Trivial ${recipe.trivial}`}
                          </span>
                        </strong>
                        <span>
                          {recipe.ingredients.map((ingredient, index) => (
                            <span key={`${ingredient.name}-${index}`}>
                              {index > 0 ? ", " : null}
                              {ingredient.qty > 1 ? `${ingredient.qty} ` : null}
                              <ItemLink name={ingredient.name} />
                            </span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : yours != null ? (
            <p className="note">{`The wiki combines for ${skill.name} are trivial at ${yours}.`}</p>
          ) : null}
          <Camps names={drops} yours={yours} skill={skill.name} />
          <Materials names={materials} />
          <Market materials={materials} />
          {skill.intro.map((line) => (
            <p key={line} className="source">
              <LinkedText text={line} extra={linkExtras(skill)} />
            </p>
          ))}
          {skill.sections.map((section) => (
            <section key={section.title} className="skill-note">
              <h3>{section.title}</h3>
              <div className="prose">
                {section.lines.map((line) => (
                  <p key={line}>
                    <LinkedText text={line} extra={linkExtras(skill)} />
                  </p>
                ))}
              </div>
            </section>
          ))}
          {hasNotes ? null : (
            <p className="note">The wiki names this skill and does not say how to raise it yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function linkExtras(skill: TradeSkill): string[] {
  return [
    ...skill.trainers.flatMap((name) => name.split(",").map((part) => part.trim())),
    ...skill.tools,
    skill.station,
  ].filter(Boolean);
}

function ladderMaterials(ladder: { ingredients: { name: string }[] }[]): string[] {
  return [...new Set(ladder.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.name)))];
}

function feedDrops(steps: Recipe[]): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const consider = (name: string, depth: number) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const camps = materialPlan(name, null).camps.length > 0;
    if (camps) found.push(name);
    const pieces = breaksInto(name);
    if (pieces.length > 0) {
      for (const piece of pieces) consider(piece.item, 0);
      return;
    }
    if (camps || depth === 0) return;
    const made = recipeFor(name)[0];
    if (!made) return;
    for (const ingredient of made.ingredients) consider(ingredient.name, depth - 1);
  };
  for (const step of steps) {
    for (const ingredient of step.ingredients) consider(ingredient.name, 1);
  }
  return found;
}

function Materials({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <section className="pane pane-gold">
      <h3 className="subhead">How to get the materials</h3>
      <ul className="kept">
        {names.map((name) => (
          <li key={name}>
            <strong>
              <ItemLink name={name} />
            </strong>
            <Ways plan={materialPlan(name, null)} />
            <Breakdown name={name} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Breakdown({ name }: { name: string }) {
  const pieces = breaksInto(name);
  if (pieces.length === 0) return null;
  return (
    <p>
      {"Seam Ripper in a Leatherworking Kit: "}
      {pieces.map((piece, index) => (
        <span key={piece.item}>
          {index > 0 ? ", " : null}
          <ItemLink name={piece.item} />
          {` yields ${piece.qty}`}
        </span>
      ))}
      .
    </p>
  );
}

function Ways({ plan }: { plan: MaterialPlan }) {
  const made = plan.made;
  const covered = new Set<string>();
  if (made || breaksInto(plan.name).length > 0) covered.add("crafted");
  if (plan.camps.length > 0 || breaksInto(plan.name).length > 0) {
    covered.add("dropped");
    covered.add("looted or purchased");
  }
  if (plan.vendors.length > 0) covered.add("bought");
  const missing = plan.notes.filter((note) => !covered.has(note));
  return (
    <>
      {made ? (
        <p>
          {`Make it with ${playedSkill(made.skill)}`}
          {made.trivial != null ? `, trivial ${made.trivial}` : ""}
          {made.stations.length > 0 ? `, on ${made.stations.join(" or ")}` : ""}
          {": "}
          {made.ingredients.map((ingredient, index) => (
            <span key={`${ingredient.name}-${index}`}>
              {index > 0 ? ", " : null}
              {ingredient.qty > 1 ? `${ingredient.qty} ` : null}
              <ItemLink name={ingredient.name} />
            </span>
          ))}
          .
        </p>
      ) : null}
      {plan.camps.map((camp) => (
        <p key={`${camp.npc}|${camp.zone}`}>
          {"Farm "}
          <ItemLink name={camp.npc} />
          {" in "}
          <ZoneLink zone={camp.zone} />
          {", "}
          <CampLevel camp={camp} />
          .
        </p>
      ))}
      {plan.vendors.length > 0 ? (
        <p>
          {"Buy it from "}
          {plan.vendors.map((vendor, index) => (
            <span key={vendor.merchant}>
              {index > 0 ? " or " : null}
              {vendor.wiki ? <OutLink href={vendor.wiki}>{vendor.merchant}</OutLink> : vendor.merchant}
              {vendor.where ? (
                <>
                  {" in "}
                  <PlaceText text={vendor.where} />
                </>
              ) : null}
            </span>
          ))}
          {plan.moreVendors > 0 ? `, and ${plan.moreVendors} more` : ""}
          .
        </p>
      ) : null}
      {missing.map((note) => (
        <p key={note}>{missingLine(note)}</p>
      ))}
    </>
  );
}

function playedSkill(skill: string): string {
  if (skill.toLowerCase() === "blacksmithing") return "Smithing";
  return skill;
}

function missingLine(note: string): string {
  if (note === "dropped") return "The wiki calls this a drop, and no camp is listed.";
  if (note === "bought") return "The wiki calls this bought, and no vendor stocks it by name.";
  if (note === "crafted") return "The wiki calls this crafted, and no combine is listed.";
  return `The wiki marks this as ${note}.`;
}

function Camps({ names, yours, skill }: { names: string[]; yours: number | null; skill: string }) {
  const camps = campsFor(names);
  return (
    <section className="pane pane-blue">
      <h3 className="subhead">Drops for this skill</h3>
      {camps.length > 0 ? (
        <>
          <p className="source">
            {yours == null
              ? `These mobs drop what the first ${skill} combines use. Enter your skill and the list follows the combine you are on.`
              : `These mobs drop what the combines still raising ${skill} at ${yours} use.`}
          </p>
          <ul className="pile">
            {camps.map((camp) => (
              <li key={`${camp.npc}|${camp.zone}`}>
                <strong>
                  <ItemLink name={camp.npc} />
                  <span className="craft-hint">
                    <ZoneLink zone={camp.zone} />
                    {camp.items.length > 0 ? (
                      <>
                        {" · "}
                        <NameList names={camp.items} />
                      </>
                    ) : null}
                  </span>
                </strong>
                <CampLevel camp={camp} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="note">The wiki item list has no mob camp for these materials.</p>
      )}
    </section>
  );
}

function Market({ materials }: { materials: string[] }) {
  return (
    <div className="market">
      <VendorCard title="Who sells the materials" lines={stockedBy(materials)} empty="No vendor stocks these by name." />
    </div>
  );
}

function VendorCard({ title, lines, empty }: { title: string; lines: VendorLine[]; empty: string }) {
  const groups = groupVendors(lines);
  return (
    <section>
      <h3>{title}</h3>
      {groups.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <ul>
          {groups.map((group) => (
            <li key={group.merchant}>
              <span>
                <NameList names={group.items} />
              </span>
              <em>
                {group.wiki ? <OutLink href={group.wiki}>{group.merchant}</OutLink> : group.merchant}
                {group.where ? (
                  <>
                    {" · "}
                    <PlaceText text={group.where} />
                  </>
                ) : null}
              </em>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function groupVendors(lines: VendorLine[]): { merchant: string; where: string; wiki: string; items: string[] }[] {
  const groups: { merchant: string; where: string; wiki: string; items: string[] }[] = [];
  for (const line of lines) {
    const found = groups.find((group) => group.merchant === line.merchant);
    if (found) {
      if (!found.items.includes(line.item)) found.items.push(line.item);
      continue;
    }
    groups.push({ merchant: line.merchant, where: line.where, wiki: line.wiki, items: [line.item] });
  }
  return groups;
}

function CampLevel({ camp }: { camp: MaterialCamp }) {
  if (camp.min == null) return <span>level unknown</span>;
  const max = camp.max ?? camp.min;
  return <span>{camp.min === max ? `level ${camp.min}` : `level ${camp.min}–${max}`}</span>;
}
