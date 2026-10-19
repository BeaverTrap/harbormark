import { recipeCountFor } from "./craft";
import type { TradeSkill } from "./types";

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

export function playedTrades(list: TradeSkill[]): TradeSkill[] {
  return list.filter(isInGame).map(asPlayed);
}
