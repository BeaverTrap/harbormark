import merchantsJson from "./data/merchants.json";
import metaJson from "./data/meta.json";
import skillsJson from "./data/skills.json";
import type { Merchant, TradeSkill } from "./types";

export const merchants = merchantsJson as Merchant[];
export const skills = skillsJson as TradeSkill[];
export const meta = metaJson;

export function zoneNames(list: Merchant[]): string[] {
  const names = new Set<string>();
  for (const merchant of list) {
    for (const zone of merchant.zones) names.add(zone);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
