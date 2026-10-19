import { useEffect, useState } from "react";

const SHARE_KEY = "harbormark-share";
const SHARE_EVENT = "harbormark-share";

export function readShare(): string {
  return localStorage.getItem(SHARE_KEY) ?? "";
}

export function writeShare(value: string): void {
  localStorage.setItem(SHARE_KEY, value);
  window.dispatchEvent(new Event(SHARE_EVENT));
}

export function useShareText(): [string, (value: string) => void] {
  const [text, setText] = useState(readShare);

  useEffect(() => {
    const sync = () => setText(readShare());
    window.addEventListener(SHARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SHARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [text, writeShare];
}

const LEVEL_KEY = "harbormark-level";
const LEVEL_EVENT = "harbormark-level";

export function readLevel(fallback: number): number {
  const saved = Number(localStorage.getItem(LEVEL_KEY));
  if (Number.isInteger(saved) && saved >= 1 && saved <= 60) return saved;
  return Math.min(60, Math.max(1, fallback));
}

export function writeLevel(level: number): void {
  const next = Math.min(60, Math.max(1, Math.round(level)));
  localStorage.setItem(LEVEL_KEY, String(next));
  window.dispatchEvent(new Event(LEVEL_EVENT));
}

export function useCharacterLevel(fallback: number): [number, (level: number) => void] {
  const [level, setLevel] = useState(() => readLevel(fallback));

  useEffect(() => {
    const sync = () => setLevel(readLevel(fallback));
    window.addEventListener(LEVEL_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LEVEL_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [fallback]);

  return [level, writeLevel];
}
