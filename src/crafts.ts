import { useEffect, useState } from "react";
import { readSaved, writeSaved } from "./saved";

const EVENT = "skillooth-crafts";

export function readCraftLevels(): Record<string, number> {
  try {
    const raw: unknown = JSON.parse(readSaved("crafts") ?? "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const levels: Record<string, number> = {};
    for (const [name, value] of Object.entries(raw)) {
      if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 300) levels[name] = value;
    }
    return levels;
  } catch {
    return {};
  }
}

export function writeCraftLevel(name: string, level: number | null): void {
  const levels = readCraftLevels();
  if (level == null) delete levels[name];
  else levels[name] = level;
  writeSaved("crafts", JSON.stringify(levels));
  window.dispatchEvent(new Event(EVENT));
}

export function useCraftLevels(): [Record<string, number>, (name: string, level: number | null) => void] {
  const [levels, setLevels] = useState(readCraftLevels);

  useEffect(() => {
    const sync = () => setLevels(readCraftLevels());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [levels, writeCraftLevel];
}
