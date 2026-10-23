const PREFIX = "skillooth";

export function readSaved(name: string): string | null {
  const key = `${PREFIX}-${name}`;
  const saved = localStorage.getItem(key);
  if (saved != null) return saved;
  const older = localStorage.getItem(`harbormark-${name}`);
  if (older != null) localStorage.setItem(key, older);
  return older;
}

export function writeSaved(name: string, value: string): void {
  localStorage.setItem(`${PREFIX}-${name}`, value);
}
