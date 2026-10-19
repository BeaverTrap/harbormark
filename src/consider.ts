export type ConColor = "green" | "blue" | "white" | "yellow" | "red";

export function conOf(mobLevel: number, you: number): ConColor {
  if (mobLevel >= you + 3) return "red";
  if (mobLevel >= you + 1) return "yellow";
  if (mobLevel === you) return "white";
  if (mobLevel >= Math.ceil(you * 0.7)) return "blue";
  return "green";
}
