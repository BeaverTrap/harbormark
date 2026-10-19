import { useEffect, useMemo, useState } from "react";
import { skills } from "./catalog";
import { conOf } from "./consider";
import { keptFor, practiceLadder, recipeCountFor, recipeFor, type KeptUse } from "./craft";
import { useCraftLevels } from "./crafts";
import { Glyph, type GlyphName } from "./icons";
import { ItemLink, LinkedText, NameList, PlaceText, ZoneLink } from "./names";
import { OutLink } from "./OutLink";
import { decodeShare } from "./share";
import { useCharacterLevel, useShareText } from "./useShare";
import { boughtBy, materialCamps, materialPlan, stockedBy, type MaterialCamp, type MaterialPlan, type VendorLine } from "./supply";
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
    const saved = localStorage.getItem("harbormark-skill") ?? "Tailoring";
    return saved === "Blacksmithing" ? "Smithing" : saved;
  });
  const [shareText] = useShareText();
  const shared = useMemo(() => decodeShare(shareText), [shareText]);
  const character = shared.status === "ok" ? shared.character : null;
  const [level] = useCharacterLevel(character ? Math.min(60, character.level) : 1);
  const [craftLevels] = useCraftLevels();
  const you = character ? level : null;
  const skill = all.find((item) => item.name === name) ?? all.find((item) => item.name === "Tailoring") ?? all[0];

  useEffect(() => {
    if (skill) localStorage.setItem("harbormark-skill", skill.name);
  }, [skill]);

  useEffect(() => {
    if (!character) return;
    localStorage.setItem("harbormark-class", character.className);
  }, [character]);

  if (!skill) return null;
  const ladder = practiceLadder(skill.name);
  const combines = recipeCountFor(skill.name);
  const hasNotes = skill.intro.length > 0 || skill.sections.length > 0;
  const yours = craftLevels[skill.name];

  return (
    <section className="desk">
      <div className="desk-copy">
        <h2>Trades</h2>
        <p>
          Who trains the skill, which camps drop the materials, who sells them, and who buys what you make
          while the number climbs.
        </p>
      </div>
      {character ? (
        <p className="source">{`Camps are colored for ${character.name}, ${character.className} ${level}.`}</p>
      ) : null}
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
            {skill.wiki ? <OutLink href={skill.wiki}>Wiki page</OutLink> : null}
          </div>
          {yours != null ? <p className="source">{`Your ${skill.name} is ${yours}.`}</p> : null}
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
          <Camps skill={skill.name} you={you} />
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
          {ladder.length > 0 ? (
            <section className="pane pane-green">
              <h3 className="subhead">
                Combines to practice
                {combines > 0 ? <span className="craft-hint"> {combines} on the wiki</span> : null}
              </h3>
              <ul className="pile">
                {ladder.map((recipe) => (
                  <li key={`${recipe.product}-${recipe.trivial}`}>
                    <strong>
                      <ItemLink name={recipe.product} />
                      <span className="craft-hint">
                        Trivial {recipe.trivial}
                        {yours != null && recipe.trivial != null
                          ? recipe.trivial <= yours
                            ? " · trivial for you"
                            : " · still raises skill"
                          : ""}
                        {recipe.stations.length > 0 ? ` · ${recipe.stations.join(", ")}` : ""}
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
            </section>
          ) : null}
          <Materials names={ladderMaterials(ladder)} you={you} />
          <Kept products={ladder.map((recipe) => recipe.product)} />
          <Market materials={ladderMaterials(ladder)} products={ladder.map((recipe) => recipe.product)} camps={materialCamps(skill.name, you)} />
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

function Materials({ names, you }: { names: string[]; you: number | null }) {
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
            <Ways plan={materialPlan(name, you)} you={you} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Ways({ plan, you }: { plan: MaterialPlan; you: number | null }) {
  const made = plan.made;
  const covered = new Set<string>();
  if (made) covered.add("crafted");
  if (plan.camps.length > 0) covered.add("dropped");
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
          <CampLevel camp={camp} you={you} />
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

function Camps({ skill, you }: { skill: string; you: number | null }) {
  const camps = materialCamps(skill, you);
  return (
    <section className="pane pane-blue">
      <h3 className="subhead">Camps</h3>
      {camps.length > 0 ? (
        <>
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
                <CampLevel camp={camp} you={you} />
              </li>
            ))}
          </ul>
          <p className="source">
            Mob levels are from the wiki. Color is an estimate until the game publishes consider bands.
          </p>
        </>
      ) : (
        <p className="note">The wiki item list has no mob camp for these materials.</p>
      )}
    </section>
  );
}

function Market({
  materials,
  products,
  camps,
}: {
  materials: string[];
  products: string[];
  camps: MaterialCamp[];
}) {
  const farmed = [...new Set(camps.flatMap((camp) => camp.items))];
  const stock = [...materials, ...farmed];
  const leftovers = products.filter((product) => !isComponent(product));
  return (
    <div className="market">
      <VendorCard title="Buy" lines={stockedBy(stock)} empty="No vendor stocks these by name." />
      <VendorCard title="Sell materials" lines={boughtBy(stock).filter((line) => !isComponent(line.item))} empty="No city buyer is listed." />
      <VendorCard title="Sell extras" lines={boughtBy(leftovers)} empty="No city buyer is listed for these combines." />
    </div>
  );
}

function isComponent(item: string): boolean {
  return recipeFor(item).length > 0 && keptFor(item).length > 0;
}

function Kept({ products }: { products: string[] }) {
  const rows = products
    .map((product) => ({ product, uses: keptFor(product) }))
    .filter((row) => row.uses.length > 0);
  if (rows.length === 0) return null;
  return (
    <section className="pane pane-green">
      <h3 className="subhead">What to do with them</h3>
      <ul className="kept">
        {rows.map((row) => (
          <li key={row.product}>
            <strong>
              <ItemLink name={row.product} />
              <span className="craft-hint"> Save them</span>
            </strong>
            {row.uses.map((use) => (
              <p key={use.skill}>{keptLine(use)}</p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

function keptLine(use: KeptUse) {
  const from = use.from == null ? "" : `, from trivial ${use.from}`;
  const more = use.more > 0 ? `, and ${use.more} more` : "";
  return (
    <>
      {`${use.skill} takes ${use.qtyLabel} each${from}: `}
      {use.examples.map((example, index) => (
        <span key={example.name}>
          {index > 0 ? ", " : null}
          <ItemLink name={example.name} />
        </span>
      ))}
      {`${more}.`}
    </>
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

function CampLevel({ camp, you }: { camp: MaterialCamp; you: number | null }) {
  if (camp.min == null) return <span>level unknown</span>;
  const max = camp.max ?? camp.min;
  if (you == null) return <span>{camp.min === max ? `level ${camp.min}` : `level ${camp.min}–${max}`}</span>;
  if (camp.min === max) return <span className={`con-${conOf(camp.min, you)}`}>{camp.min}</span>;
  return (
    <span>
      <span className={`con-${conOf(camp.min, you)}`}>{camp.min}</span>
      –
      <span className={`con-${conOf(max, you)}`}>{max}</span>
    </span>
  );
}
