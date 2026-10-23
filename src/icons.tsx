import type { ReactNode } from "react";

export type GlyphName =
  | "meat"
  | "fish"
  | "herbs"
  | "hides"
  | "cloth"
  | "weapons"
  | "armor"
  | "ore"
  | "gems"
  | "wood"
  | "reagents"
  | "bags"
  | "lights"
  | "food"
  | "drink"
  | "bait"
  | "other"
  | "coin"
  | "haul"
  | "pin"
  | "book"
  | "craft";

const PATHS: Record<GlyphName, ReactNode> = {
  meat: <path d="M8 14c0-4 2-8 6-8 3 2 4 6 2 9-2 3-6 3-8-1Z M14 8c2 1 3 3 2 5" />,
  fish: <path d="M4 12c4-5 10-5 14-2-4 1-6 3-6 6 0-2-4-2-8-4Z M18 9l3-2v5l-3-1" />,
  herbs: <path d="M12 20V10 M12 14c-4-1-6-4-6-7 4 0 6 3 6 7Z M12 12c4-1 6-4 6-7-4 0-6 3-6 7Z" />,
  hides: <path d="M8 6c2 4 2 8 0 12 M16 6c-2 4-2 8 0 12 M7 8h10 M7 16h10" />,
  cloth: <path d="M6 7h12l-1 13H7L6 7Z M9 7c0-2 6-2 6 0" />,
  weapons: <path d="M5 19L15 9 M14 6l4 4 M8 16l-2 3 M16 8l2-2" />,
  armor: <path d="M8 5h8l2 4v6l-6 5-6-5V9l2-4Z M12 9v8" />,
  ore: <path d="M7 16l5-10 5 10H7Z M9 16l3 3 3-3" />,
  gems: <path d="M8 9h8l2 3-6 7-6-7 2-3Z M8 9l4 3 4-3" />,
  wood: <path d="M12 21V8 M12 12c-3-1-5-4-4-7 3 1 4 4 4 7Z M12 14c3-1 5-3 4-6-3 1-4 3-4 6Z" />,
  reagents: <path d="M9 4h6 M10 4v5L7 16a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4l-3-7V4" />,
  bags: <path d="M8 9h8l1 11H7L8 9Z M9 9V7a3 3 0 0 1 6 0v2" />,
  lights: <path d="M9 14a3 3 0 1 1 6 0c0 2-1 3-1 4H10c0-1-1-2-1-4Z M12 6v2 M6 10H8 M16 10h2 M12 18v2" />,
  food: <path d="M6 14h12v2a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4v-2Z M8 14c0-4 8-4 8 0" />,
  drink: <path d="M8 4h8l-1 8a3 3 0 0 1-6 0L8 4Z M10 20h4 M12 15v5" />,
  bait: <path d="M6 14c2-6 10-6 12 0-3 2-9 2-12 0Z M8 14c1 3 7 3 8 0" />,
  other: <path d="M12 5l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-5Z" />,
  coin: <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M12 8v8 M10 10h3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3" />,
  haul: <path d="M7 8h10l1 12H6L7 8Z M9 8V6h6v2 M9 12h6" />,
  pin: <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  book: <path d="M6 5h5a3 3 0 0 1 3 3v11H8a2 2 0 0 0-2 2V5Z M18 5h-5a3 3 0 0 0-3 3" />,
  craft: <path d="M14 5l5 5-8 8H6v-5l8-8Z M13 6l5 5" />,
};

export function glyphForShort(short: string): GlyphName {
  switch (short) {
    case "Meat":
      return "meat";
    case "Fish":
      return "fish";
    case "Herbs":
      return "herbs";
    case "Hides":
      return "hides";
    case "Cloth":
      return "cloth";
    case "Weapons":
      return "weapons";
    case "Armor":
      return "armor";
    case "Ore":
      return "ore";
    case "Gems":
    case "Jewelry":
      return "gems";
    case "Wood":
      return "wood";
    case "Reagents":
      return "reagents";
    case "Bags":
      return "bags";
    case "Lights":
      return "lights";
    case "Food":
      return "food";
    case "Drink":
      return "drink";
    case "Bait":
      return "bait";
    case "Other":
      return "other";
    default: {
      const exhaustive: never = short as never;
      void exhaustive;
      return "other";
    }
  }
}

export function Glyph({ name }: { name: GlyphName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}

export function ItemMark({ src, glyph }: { src?: string; glyph: GlyphName }) {
  return (
    <span className="mark">
      {src ? <img src={src} alt="" /> : <Glyph name={glyph} />}
    </span>
  );
}
