import type { ReactNode } from "react";
import { recipeFor, recipes } from "./craft";
import { atlasForZone, knownZones, wikiPage } from "./links";
import { OutLink } from "./OutLink";

const ITEM_NAMES = [
  ...new Set(recipes.flatMap((recipe) => [recipe.product, ...recipe.ingredients.map((ingredient) => ingredient.name)])),
]
  .filter((name) => name.length >= 4)
  .sort((a, b) => b.length - a.length);

export function ItemLink({ name }: { name: string }) {
  const href = recipeFor(name).find((recipe) => recipe.wiki)?.wiki || wikiPage(name);
  return (
    <OutLink href={href} title={`${name} on the wiki`}>
      {name}
    </OutLink>
  );
}

export function ZoneLink({ zone, children }: { zone: string; children?: ReactNode }) {
  const atlas = atlasForZone(zone);
  if (!atlas) return <ItemLink name={zone} />;
  return (
    <OutLink href={atlas} title={`${zone} on the MnM Atlas`}>
      {children ?? zone}
    </OutLink>
  );
}

export function NameList({ names }: { names: string[] }) {
  return names.map((name, index) => (
    <span key={`${name}-${index}`}>
      {index > 0 ? ", " : null}
      <ItemLink name={name} />
    </span>
  ));
}

export function LinkedText({ text, extra = [] }: { text: string; extra?: string[] }) {
  const names = extra.length > 0 ? [...extra.filter((name) => name.length >= 4), ...ITEM_NAMES] : ITEM_NAMES;
  const zones = knownZones();
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    const zoneHit = findTerm(rest, zones);
    const itemHit = findTerm(rest, names);
    const hit = earlier(zoneHit, itemHit);
    if (!hit) {
      parts.push(rest);
      break;
    }
    if (hit.at > 0) parts.push(rest.slice(0, hit.at));
    const label = rest.slice(hit.at, hit.at + hit.name.length);
    parts.push(
      hit === zoneHit ? (
        <ZoneLink key={key} zone={hit.name}>
          {label}
        </ZoneLink>
      ) : (
        <ItemLink key={key} name={hit.name} />
      ),
    );
    key += 1;
    rest = rest.slice(hit.at + hit.name.length);
  }
  return <>{parts}</>;
}

function findTerm(text: string, names: string[]): { name: string; at: number } | null {
  let best: { name: string; at: number } | null = null;
  const lower = text.toLowerCase();
  for (const name of names) {
    const at = lower.indexOf(name.toLowerCase());
    if (at === -1 || !bounded(text, at, name.length)) continue;
    if (!best || at < best.at || (at === best.at && name.length > best.name.length)) best = { name, at };
  }
  return best;
}

function earlier(
  zone: { name: string; at: number } | null,
  item: { name: string; at: number } | null,
): { name: string; at: number } | null {
  if (!zone) return item;
  if (!item) return zone;
  if (zone.at < item.at) return zone;
  if (item.at < zone.at) return item;
  return zone.name.length >= item.name.length ? zone : item;
}

function bounded(text: string, index: number, length: number): boolean {
  const before = index === 0 || /[^A-Za-z0-9']/.test(text[index - 1] ?? "");
  const after = index + length >= text.length || /[^A-Za-z0-9']/.test(text[index + length] ?? "");
  return before && after;
}

export function PlaceText({ text }: { text: string }) {
  const zones = knownZones();
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    let at = -1;
    let zone = "";
    for (const name of zones) {
      const index = rest.toLowerCase().indexOf(name.toLowerCase());
      if (index === -1) continue;
      if (at === -1 || index < at || (index === at && name.length > zone.length)) {
        at = index;
        zone = name;
      }
    }
    if (at === -1 || zone.length === 0) {
      parts.push(rest);
      break;
    }
    if (at > 0) parts.push(rest.slice(0, at));
    parts.push(<ZoneLink key={`${zone}-${key}`} zone={zone} />);
    key += 1;
    rest = rest.slice(at + zone.length);
  }
  return <>{parts}</>;
}
