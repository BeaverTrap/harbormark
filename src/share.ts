import gearJson from "./data/gear.json";

type GearRecord = {
  id: number;
  name: string;
  slot: string;
  stats?: Record<string, number>;
  dmg?: number;
  delay?: number;
};

const gear = gearJson as GearRecord[];
const byId = new Map(gear.map((item) => [item.id, item]));

const CLASS_NAMES: Record<string, string> = {
  ARC: "Archer",
  BRD: "Bard",
  BST: "Beastmaster",
  CLR: "Cleric",
  DRU: "Druid",
  ELE: "Elementalist",
  ENC: "Enchanter",
  FTR: "Fighter",
  INQ: "Inquisitor",
  MNK: "Monk",
  NEC: "Necromancer",
  PAL: "Paladin",
  RNG: "Ranger",
  ROG: "Rogue",
  SHD: "Shadow Knight",
  SHM: "Shaman",
  SPB: "Spellblade",
  WIZ: "Wizard",
};

const SLOT_ORDER = [
  "primary",
  "secondary",
  "range",
  "ammo",
  "head",
  "face",
  "neck",
  "shoulders",
  "back",
  "chest",
  "shirt",
  "arms",
  "wrist1",
  "wrist2",
  "hands",
  "waist",
  "legs",
  "feet",
  "ear1",
  "ear2",
  "finger1",
  "finger2",
];

const SLOT_LABEL: Record<string, string> = {
  primary: "Primary",
  secondary: "Off hand",
  range: "Range",
  ammo: "Ammo",
  head: "Head",
  face: "Face",
  neck: "Neck",
  shoulders: "Shoulders",
  back: "Back",
  chest: "Chest",
  shirt: "Shirt",
  arms: "Arms",
  wrist1: "Wrist",
  wrist2: "Wrist",
  hands: "Hands",
  waist: "Waist",
  legs: "Legs",
  feet: "Feet",
  ear1: "Ear",
  ear2: "Ear",
  finger1: "Finger",
  finger2: "Finger",
};

export type NamedItem = {
  id: number;
  name: string;
  stats: string;
};

export type SharedCharacter = {
  name: string;
  classCode: string;
  className: string;
  level: number;
  worn: { slot: string; label: string; item: NamedItem }[];
  wants: NamedItem[];
};

export type ShareRead =
  | { status: "empty" }
  | { status: "bad" }
  | { status: "ok"; character: SharedCharacter };

export function gearScore(character: SharedCharacter): number {
  let total = 0;
  for (const piece of character.worn) {
    const stats = gearById(piece.item.id)?.stats;
    if (!stats) continue;
    for (const value of Object.values(stats)) {
      if (value > 0) total += value;
    }
  }
  return total;
}

export const BODY_SLOTS = [
  "ear1",
  "neck",
  "head",
  "face",
  "ear2",
  "chest",
  "back",
  "shirt",
  "shoulders",
  "wrist1",
  "wrist2",
  "waist",
  "hands",
  "finger1",
  "finger2",
  "legs",
  "feet",
] as const;

export const WEAPON_SLOTS = ["primary", "secondary", "range", "ammo"] as const;

export function slotLabel(slot: string): string {
  return SLOT_LABEL[slot] ?? slot;
}

const STAT_ORDER = ["AC", "HP", "Mana", "STR", "STA", "AGI", "DEX", "WIS", "INT", "CHA"];

export function wornStats(character: SharedCharacter): { key: string; value: number }[] {
  const sums = new Map<string, number>();
  for (const piece of character.worn) {
    const stats = gearById(piece.item.id)?.stats;
    if (!stats) continue;
    for (const [key, value] of Object.entries(stats)) sums.set(key, (sums.get(key) ?? 0) + value);
  }
  return [...sums.entries()]
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => {
      const ai = STAT_ORDER.indexOf(a.key);
      const bi = STAT_ORDER.indexOf(b.key);
      return (ai === -1 ? STAT_ORDER.length : ai) - (bi === -1 ? STAT_ORDER.length : bi) || a.key.localeCompare(b.key);
    });
}

export function primaryWeapon(character: SharedCharacter): string {
  const piece = character.worn.find((item) => item.slot === "primary");
  const gear = piece ? gearById(piece.item.id) : undefined;
  if (gear?.dmg == null) return "";
  return gear.delay == null ? `${gear.dmg} dmg` : `${gear.dmg}/${gear.delay}`;
}

export function gearById(id: number): GearRecord | undefined {
  return byId.get(id);
}

export function describeGear(id: number): NamedItem {
  const item = byId.get(id);
  if (!item) return { id, name: `Unknown item ${id}`, stats: "" };
  return { id, name: item.name, stats: statLine(item) };
}

function statLine(item: GearRecord): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(item.stats ?? {})) {
    parts.push(`${key} ${value > 0 ? `+${value}` : value}`);
  }
  if (item.dmg != null && item.delay != null) parts.push(`${item.dmg} dmg / ${item.delay} delay`);
  else if (item.dmg != null) parts.push(`${item.dmg} dmg`);
  return parts.join(" · ");
}

function payloadText(input: string): string {
  const trimmed = input.trim();
  const hash = trimmed.includes("#") ? (trimmed.split("#").pop() ?? trimmed) : trimmed;
  const after = hash.includes("/share/") ? (hash.split("/share/").pop() ?? hash) : hash.replace(/^\/?share\//, "");
  return after.split(/[?#\s]/)[0] ?? "";
}

function decodeBase64Url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function decodeShare(input: string): ShareRead {
  const payload = payloadText(input);
  if (!payload) return { status: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeBase64Url(payload));
  } catch {
    return { status: "bad" };
  }
  if (!isRecord(parsed) || parsed.v !== 1) return { status: "bad" };
  const name = typeof parsed.n === "string" ? parsed.n.trim() : "";
  const classCode = typeof parsed.c === "string" ? parsed.c : "";
  const className = CLASS_NAMES[classCode];
  const level = parsed.l;
  if (!name || name.length > 60 || !className || typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 100) {
    return { status: "bad" };
  }
  if (!isRecord(parsed.e)) return { status: "bad" };
  const worn: SharedCharacter["worn"] = [];
  for (const [slot, id] of Object.entries(parsed.e)) {
    if (!isId(id)) return { status: "bad" };
    worn.push({
      slot,
      label: SLOT_LABEL[slot] ?? slot,
      item: describeGear(id),
    });
  }
  worn.sort((a, b) => slotRank(a.slot) - slotRank(b.slot) || a.label.localeCompare(b.label));
  const wants = Array.isArray(parsed.t) && parsed.t.every(isId) ? parsed.t.map(describeGear) : [];
  return { status: "ok", character: { name, classCode, className, level, worn, wants } };
}

function slotRank(slot: string): number {
  const index = SLOT_ORDER.indexOf(slot);
  return index === -1 ? SLOT_ORDER.length : index;
}
