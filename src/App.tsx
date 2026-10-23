import { useEffect, useRef, useState } from "react";
import { CraftDesk } from "./CraftDesk";
import { Glyph, type GlyphName } from "./icons";
import { meta } from "./catalog";
import { ATLAS_HOME, GAME_WIKI, LEDGER_HOME, LEDGER_LINKS, STORIES_WIKI, WIKI_HOME } from "./links";
import { OutLink } from "./OutLink";
import { readSaved, writeSaved } from "./saved";
import { SellDesk } from "./SellDesk";
import type { Tab } from "./types";

const TABS: { id: Tab; label: string; glyph: GlyphName }[] = [
  { id: "craft", label: "Skills", glyph: "craft" },
  { id: "sell", label: "Sell", glyph: "coin" },
];

function readTab(): Tab {
  const saved = readSaved("tab");
  if (saved === "sell" || saved === "haul") return "sell";
  return "craft";
}

export function App() {
  const [tab, setTab] = useState<Tab>(readTab);
  const [zone, setZone] = useState(() => {
    const saved = readSaved("zone");
    if (!saved || saved === "Night Harbor") return "hubs";
    return saved;
  });

  useEffect(() => {
    writeSaved("tab", tab);
  }, [tab]);

  useEffect(() => {
    writeSaved("zone", zone);
  }, [zone]);

  const galaxyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = galaxyRef.current;
    if (!node) return;
    let frame = 0;
    const paint = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      // Travel farther than the scroll so the band moves down while the page moves up.
      const travel = Math.round(maxScroll * 1.65);
      const progress = maxScroll === 0 ? 0 : Math.min(1, window.scrollY / maxScroll);
      const shift = Math.round(progress * travel);
      node.style.top = `${-travel}px`;
      node.style.height = `calc(100% + ${travel}px)`;
      node.style.transform = `translate3d(0, ${shift}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    paint();
    const sky = new Image();
    sky.src = `${import.meta.env.BASE_URL}sky-bg.jpg?v=9`;
    sky.onload = paint;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const observer = new ResizeObserver(onScroll);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      sky.onload = null;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
    <div className="sky" aria-hidden="true">
      <div className="galaxy" ref={galaxyRef} />
    </div>
    <div className="stars" aria-hidden="true" />
    <div className="sky-dim" aria-hidden="true" />
    <div className="moons" aria-hidden="true">
      <div className="moon moon-small" />
      <div className="moon moon-large" />
      <div className="moon moon-medium" />
    </div>
    <div className="page">
      <header className="mast">
        <p className="kicker">Monsters & Memories</p>
        <h1>Skillooth</h1>
        <div className="nav-row">
          <nav className="tabs" aria-label="Desks">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === tab ? "tab active" : "tab"}
                aria-current={item.id === tab ? "page" : undefined}
                onClick={() => setTab(item.id)}
              >
                <Glyph name={item.glyph} />
                {item.label}
              </button>
            ))}
          </nav>
          <nav className="outside" aria-label="Map">
            <OutLink href={ATLAS_HOME}>Atlas</OutLink>
          </nav>
        </div>
        <aside className="ledger-banner" aria-label="Advertisement">
          <span className="ad-mark">Ad</span>
          <LedgerSigil />
          <OutLink href={LEDGER_HOME} className="ledger-banner-hit">
            <span className="ledger-banner-brand">
              <strong>Castanova's Arcane Ledger</strong>
              <span>Gear planner</span>
            </span>
          </OutLink>
          <nav className="ledger-links" aria-label="Arcane Ledger">
            <OutLink className="ad-cta" href={LEDGER_HOME}>
              Open the Ledger
            </OutLink>
            {LEDGER_LINKS.map((link) => (
              <OutLink key={link.href} href={link.href}>
                {link.label}
              </OutLink>
            ))}
          </nav>
        </aside>
      </header>
      <main>
        <Desk tab={tab} zone={zone} onZone={setZone} />
      </main>
      <footer>
        <p>
          Sources: merchant lists, recipes, and trade notes from the{" "}
          <OutLink href={WIKI_HOME}>Miraheze wiki</OutLink>, used under{" "}
          <OutLink href={meta.licenseUrl}>CC BY-SA 4.0</OutLink>. Item names from{" "}
          <OutLink href={GAME_WIKI}>monstersandmemories.wiki</OutLink>. Skill notes checked against{" "}
          <OutLink href={STORIES_WIKI}>Stories of MnM</OutLink>. Maps by{" "}
          <OutLink href={ATLAS_HOME}>MnM Atlas</OutLink>. Camp drops from{" "}
          <OutLink href={LEDGER_HOME}>Castanova&apos;s Arcane Ledger</OutLink>. Imported{" "}
          {new Date(meta.scrapedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}. Early Access data changes.
        </p>
        <p>Unofficial. Not affiliated with Niche Worlds Cult. Game content © Niche Worlds Cult.</p>
      </footer>
    </div>
    </>
  );
}

function LedgerSigil() {
  return (
    <svg className="ledger-sigil" viewBox="-160 -160 320 320" aria-hidden="true">
      <g className="ledger-sigil-turn">
        <circle r="150" />
        <circle r="144" className="ticks" />
        <circle r="143" className="ticks-major" />
      </g>
      <circle r="122" />
      <circle r="64" className="dashed" />
      <path className="faint" d="M0-150V150M-150 0H150M-106-106L106 106M-106 106L106-106" />
      <path className="lines" d="M-96-38L-52-70L-8-58L40-88L84-44M-8-58L-20-6L30 34L78 22M-20-6L-74 30" />
      <g className="stars">
        <circle cx="-96" cy="-38" r="3" />
        <circle cx="-52" cy="-70" r="2.5" />
        <circle cx="-8" cy="-58" r="3.5" />
        <circle cx="40" cy="-88" r="2.5" />
        <circle cx="84" cy="-44" r="3" />
        <circle cx="-20" cy="-6" r="2.5" />
        <circle cx="30" cy="34" r="3" />
        <circle cx="78" cy="22" r="2" />
        <circle cx="-74" cy="30" r="2.5" />
      </g>
      <path className="star" d="M0-22L5-5L22 0L5 5L0 22L-5 5L-22 0L-5-5Z" />
    </svg>
  );
}

function Desk({ tab, zone, onZone }: { tab: Tab; zone: string; onZone: (zone: string) => void }) {
  switch (tab) {
    case "sell":
      return <SellDesk zone={zone} onZone={onZone} />;
    case "craft":
      return <CraftDesk />;
    default: {
      const exhaustive: never = tab;
      return exhaustive;
    }
  }
}
