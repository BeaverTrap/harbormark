import { useEffect, useMemo, useState } from "react";
import { guides } from "./catalog";
import { pickFeatured, pickNotes } from "./guide";
import { Numbers } from "./Numbers";
import { OutLink } from "./OutLink";
import { knownCount } from "./rotation";
import { decodeShare } from "./share";
import type { GuideSection } from "./types";
import { readShare, useCharacterLevel, useShareText } from "./useShare";

function readNumber(key: string, fallback: number): number {
  const saved = Number(localStorage.getItem(key));
  return Number.isFinite(saved) && saved > 0 ? saved : fallback;
}

export function Routines() {
  const imported = decodeShare(readShare());
  const [className, setClassName] = useState(() =>
    imported.status === "ok" ? imported.character.className : (localStorage.getItem("harbormark-class") ?? "Shaman"),
  );
  const [level, setLevel] = useCharacterLevel(
    imported.status === "ok" ? Math.min(60, imported.character.level) : readNumber("harbormark-level", 12),
  );
  const [shareText] = useShareText();
  const shared = useMemo(() => decodeShare(shareText), [shareText]);
  const guide = guides.find((item) => item.className === className) ?? guides[0];

  useEffect(() => {
    localStorage.setItem("harbormark-class", className);
  }, [className]);

  useEffect(() => {
    if (shared.status !== "ok") return;
    setClassName(shared.character.className);
  }, [shared]);

  const featured = guide ? pickFeatured(guide.sections, level) : [];
  const notes = guide ? pickNotes(guide.sections, featured) : [];

  return (
    <section className="desk">
      <div className="desk-copy">
        <h2>Class routines</h2>
        <p>
          The cast order is the wiki&apos;s hit points divided by the published cast or recast time, at your level.
          Dots are ranked by damage each second they tick. The guide&apos;s own wording stays under that list.
        </p>
      </div>
      <div className="routine-layout">
        <div className="class-list" role="listbox" aria-label="Class">
          {guides.map((item) => (
            <button
              key={item.className}
              type="button"
              role="option"
              aria-selected={item.className === guide?.className}
              className={item.className === guide?.className ? "class-btn active" : "class-btn"}
              onClick={() => setClassName(item.className)}
            >
              <span className="badge" aria-hidden="true">
                {item.className.slice(0, 3)}
              </span>
              {item.className}
              {item.thin && knownCount(item.className) === 0 ? <span className="thin">No numbers yet</span> : null}
            </button>
          ))}
        </div>
        {guide ? (
          <div className="routine-body">
            <div className="level-row">
              <label>
                Level {level}
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={level}
                  onChange={(event) => setLevel(Number(event.target.value))}
                />
              </label>
              <OutLink href={guide.wiki}>Wiki guide</OutLink>
            </div>
            <Numbers className={guide.className} level={level} />
            {featured.length > 0 ? (
              <>
                <h3 className="subhead">From the guide</h3>
                {featured.map((section, index) => (
                  <SectionBlock key={`${sectionKey(section)}-${index}`} section={section} />
                ))}
              </>
            ) : null}
            {notes.length > 0 ? (
              <details className="more">
                <summary>Build notes from the guide</summary>
                {notes.map((section) => (
                  <SectionBlock key={sectionKey(section)} section={section} />
                ))}
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function sectionKey(section: GuideSection): string {
  return `${section.source}|${section.title}|${section.minLevel ?? "x"}`;
}

function SectionBlock({ section }: { section: GuideSection }) {
  const [open, setOpen] = useState(false);
  const shown = open ? section.lines : section.lines.slice(0, 6);
  const hidden = section.lines.length - shown.length;
  const band =
    section.minLevel == null
      ? ""
      : section.maxLevel != null && section.maxLevel !== section.minLevel
        ? `Levels ${section.minLevel}–${section.maxLevel}`
        : `Level ${section.minLevel}`;

  return (
    <article className="card">
      <p className="card-kicker">{band || "From the guide"}</p>
      <h3>{section.title}</h3>
      {section.source ? <p className="source">From {section.source}</p> : null}
      <div className="prose">
        {shown.map((line, index) => (
          <p key={`${index}-${line.slice(0, 24)}`}>{line}</p>
        ))}
      </div>
      {hidden > 0 ? (
        <button type="button" className="text-btn" onClick={() => setOpen(true)}>
          Show {hidden} more lines
        </button>
      ) : null}
    </article>
  );
}
