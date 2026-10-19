import { useEffect, useRef, useState } from "react";
import { meta } from "./catalog";
import { CharacterDesk } from "./CharacterDesk";
import { CraftDesk } from "./CraftDesk";
import { LevelDesk } from "./LevelDesk";
import { Glyph, type GlyphName } from "./icons";
import { ATLAS_HOME, LEDGER_HOME, WIKI_HOME } from "./links";
import { OutLink } from "./OutLink";
import { Routines } from "./Routines";
import { SellDesk } from "./SellDesk";
import type { Tab } from "./types";

const TABS: { id: Tab; label: string; glyph: GlyphName }[] = [
  { id: "craft", label: "Craft", glyph: "craft" },
  { id: "character", label: "Character", glyph: "armor" },
  { id: "level", label: "Level", glyph: "pin" },
  { id: "sell", label: "Sell", glyph: "coin" },
  { id: "routines", label: "Routines", glyph: "book" },
];

function isTab(value: string): value is Tab {
  return value === "sell" || value === "level" || value === "routines" || value === "craft" || value === "character";
}

function readTab(): Tab {
  const saved = localStorage.getItem("harbormark-tab");
  if (saved === "haul") return "sell";
  return saved && isTab(saved) ? saved : "craft";
}

export function App() {
  const [tab, setTab] = useState<Tab>(readTab);
  const [zone, setZone] = useState(() => {
    const saved = localStorage.getItem("harbormark-zone");
    if (!saved || saved === "Night Harbor") return "hubs";
    return saved;
  });

  useEffect(() => {
    localStorage.setItem("harbormark-tab", tab);
  }, [tab]);

  useEffect(() => {
    localStorage.setItem("harbormark-zone", zone);
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
    sky.src = "/sky-bg.jpg?v=9";
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
        <p className="kicker">Monsters & Memories · Loot, buyers, combines, and trades</p>
        <h1>Harbormark</h1>
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
          <nav className="outside" aria-label="Related sites">
            <OutLink href={WIKI_HOME}>Wiki</OutLink>
            <OutLink href={ATLAS_HOME}>Atlas</OutLink>
            <OutLink href={LEDGER_HOME}>Ledger</OutLink>
          </nav>
        </div>
      </header>
      <main>
        <Desk tab={tab} zone={zone} onZone={setZone} />
      </main>
      <footer>
        <p>
          Merchant lists and class guides from the <OutLink href={WIKI_HOME}>Monsters & Memories Wiki</OutLink>{" "}
          (Miraheze), used under <OutLink href={meta.licenseUrl}>CC BY-SA 4.0</OutLink> and reformatted for this page.
          Maps by <OutLink href={ATLAS_HOME}>MnM Atlas</OutLink>. The Character page imports a{" "}
          <OutLink href={LEDGER_HOME}>Castanova's Arcane Ledger</OutLink> sheet; those item names are the
          wiki&apos;s. Imported{" "}
          {new Date(meta.scrapedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}. Early Access data changes.
          Check the wiki before you vendor a stack or trust a spell rank.
        </p>
        <p>The three moons are the large, small, and medium moons from the wiki.</p>
        <p>Unofficial. Not affiliated with Niche Worlds Cult. Game content © Niche Worlds Cult.</p>
      </footer>
    </div>
    </>
  );
}

function Desk({ tab, zone, onZone }: { tab: Tab; zone: string; onZone: (zone: string) => void }) {
  switch (tab) {
    case "sell":
      return <SellDesk zone={zone} onZone={onZone} />;
    case "level":
      return <LevelDesk />;
    case "routines":
      return <Routines />;
    case "craft":
      return <CraftDesk />;
    case "character":
      return <CharacterDesk />;
    default: {
      const exhaustive: never = tab;
      return exhaustive;
    }
  }
}
