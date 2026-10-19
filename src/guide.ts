import type { GuideSection } from "./types";

const ROUTINE =
  /fight routine|before a group|during the fight|spell priority|basic combat|basic group flow|group flow|solo tactics|group tactics|using glyphs|glyph spell|damage priority|ability bar|kiting|how to play|solo play|soloing|group play/i;

function span(section: GuideSection): number {
  if (section.minLevel == null || section.maxLevel == null) return 99;
  return section.maxLevel - section.minLevel;
}

function isBand(section: GuideSection, level: number): boolean {
  if (section.minLevel == null || section.maxLevel == null) return false;
  if (span(section) >= 40) return false;
  if (section.maxLevel === section.minLevel) return false;
  if (!/level/i.test(section.title)) return false;
  return level >= section.minLevel && level <= section.maxLevel;
}

function routineRank(title: string): number {
  const checks = [
    /simple fight routine/i,
    /during the fight/i,
    /before a group/i,
    /basic group flow/i,
    /damage priority/i,
    /basic combat/i,
    /using glyphs/i,
    /group tactics/i,
    /solo tactics/i,
    /kiting/i,
    /how to play/i,
    /glyph spell/i,
    /solo play|soloing/i,
    /group play/i,
  ];
  const index = checks.findIndex((check) => check.test(title));
  return index === -1 ? checks.length : index;
}

export function pickFeatured(sections: GuideSection[], level: number): GuideSection[] {
  const bands = sections.filter((section) => isBand(section, level)).sort((a, b) => span(a) - span(b));
  const tight = bands[0];
  const core = bands.find((section) => section !== tight && /core|priority|ability bar/i.test(section.title));

  const points = sections.filter((section) => {
    if (section.minLevel == null || section.maxLevel == null) return false;
    if (section.minLevel !== section.maxLevel || section.minLevel > level) return false;
    if (section.lines.length > 14) return false;
    return /priority|core|ability bar|damage/i.test(section.title);
  });
  const bestPoint = points.reduce((max, section) => Math.max(max, section.minLevel ?? 0), 0);
  const currentPoints = points.filter((section) => section.minLevel === bestPoint).slice(0, 2);

  const prose = sections
    .filter((section) => section.minLevel == null && ROUTINE.test(section.title) && section.lines.length <= 22)
    .sort((a, b) => routineRank(a.title) - routineRank(b.title) || a.lines.length - b.lines.length);

  const picked: GuideSection[] = [];
  const seen = new Set<string>();
  for (const section of [tight, core, ...currentPoints, ...prose]) {
    if (!section) continue;
    const key = `${section.title}|${section.lines.join("~")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(section);
    if (picked.length === 5) break;
  }
  return picked;
}

export function pickNotes(sections: GuideSection[], featured: GuideSection[]): GuideSection[] {
  const used = new Set(featured);
  return sections
    .filter((section) => !used.has(section))
    .filter((section) => /trait|stat|infusion|gear|what is a|strengths|race and stats/i.test(section.title))
    .filter((section) => section.lines.length > 0 && section.lines.length <= 12)
    .slice(0, 3);
}
