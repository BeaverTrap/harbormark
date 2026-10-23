import { useEffect, useState } from "react";
import { merchants } from "./catalog";
import { craftsUsing } from "./craft";
import { LootPicker } from "./LootPicker";
import { findBuyers, normalize, parseHaul, planHaul, type HaulEntry } from "./match";
import { ItemLink } from "./names";
import { OutLink } from "./OutLink";
import { PlaceLine } from "./PlaceLine";
import { readSaved, writeSaved } from "./saved";
import { ZoneField } from "./ZoneField";

function skillName(skill: string): string {
  return skill.toLowerCase() === "blacksmithing" ? "Smithing" : skill;
}

function BagMark({ name, zone }: { name: string; zone: string }) {
  const crafts = craftsUsing(name);
  if (crafts.length > 0) return <small className="craft-hint">Good for {skillName(crafts[0].skill)}</small>;
  const { here, elsewhere } = findBuyers(name, merchants, zone);
  if (!here[0] && !elsewhere[0]) return <small className="craft-hint">No vendor</small>;
  return <small className="craft-hint">Junk</small>;
}

function CraftHint({ name }: { name: string }) {
  const crafts = craftsUsing(name);
  if (crafts.length === 0) return null;
  const names = crafts.slice(0, 2).map((recipe) => recipe.product);
  const extra = crafts.length - names.length;
  return (
    <small className="craft-hint">
      {skillName(crafts[0].skill)} makes {names.join(", ")}
      {extra > 0 ? ` +${extra}` : ""}
    </small>
  );
}

function readBag(): HaulEntry[] {
  const raw = readSaved("haul");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const seen = new Set<string>();
      const lines: HaulEntry[] = [];
      for (const line of parsed) {
        if (typeof line !== "object" || line === null || !("name" in line) || typeof line.name !== "string") continue;
        const name = line.name.trim();
        const key = normalize(name);
        if (!name || seen.has(key)) continue;
        seen.add(key);
        lines.push({ name, qty: 1 });
      }
      return lines;
    }
  } catch {
    return parseHaul(raw);
  }
  return [];
}

export function SellDesk({ zone, onZone }: { zone: string; onZone: (zone: string) => void }) {
  const [bag, setBag] = useState<HaulEntry[]>(readBag);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    writeSaved("haul", JSON.stringify(bag));
  }, [bag]);

  const add = (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return;
    setBag((current) => {
      const key = normalize(cleaned);
      if (current.some((line) => normalize(line.name) === key)) return current;
      return [...current, { name: cleaned, qty: 1 }];
    });
  };

  const toggle = (name: string) => {
    const key = normalize(name);
    setBag((current) =>
      current.some((line) => normalize(line.name) === key)
        ? current.filter((line) => normalize(line.name) !== key)
        : [...current, { name: name.trim(), qty: 1 }],
    );
  };

  const remove = (name: string) => {
    const key = normalize(name);
    setBag((current) => current.filter((line) => normalize(line.name) !== key));
  };

  const kept = bag.filter((line) => craftsUsing(line.name).length > 0);
  const junk = bag.filter((line) => craftsUsing(line.name).length === 0);
  const plan = planHaul(junk.map((line) => `${line.qty} ${line.name}`).join("\n"), merchants, zone);

  return (
    <section className="desk">
      <div className="desk-copy">
        <h2>Sell</h2>
        <p>
          Search any item from the wiki item list. The name under it is who buys it in the zone you picked. Anything a
          skill uses stays off the route.
        </p>
      </div>
      <ZoneField zone={zone} onZone={onZone} />
      <div className="haul-layout">
        <LootPicker picked={bag} onPick={toggle} zone={zone} />
        <div className="bag">
          <h3>In the bag</h3>
          {bag.length === 0 ? <p className="note">Nothing picked yet.</p> : null}
          <ul className="pile">
            {bag.map((line) => (
              <li key={line.name}>
                <strong>
                  <ItemLink name={line.name} />
                  <BagMark name={line.name} zone={zone} />
                </strong>
                <button type="button" className="text-btn" onClick={() => remove(line.name)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <form
            className="custom-add"
            onSubmit={(event) => {
              event.preventDefault();
              add(custom);
              setCustom("");
            }}
          >
            <input
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="A drop that is not listed"
              aria-label="A drop that is not listed"
            />
            <button type="submit" className="chip">
              Add
            </button>
          </form>
        </div>
      </div>
      {kept.length === 0 ? null : (
        <section className="pane pane-green">
          <h3 className="subhead">Good for skills</h3>
          <ul className="pile">
            {kept.map((line) => (
              <li key={line.name}>
                <strong>
                  <ItemLink name={line.name} />
                  <CraftHint name={line.name} />
                </strong>
              </li>
            ))}
          </ul>
        </section>
      )}
      {bag.length === 0 ? null : junk.length === 0 ? (
        <p className="note">Nothing in the bag is junk.</p>
      ) : (
        <ol className="route">
          {plan.stops.map((stop, index) =>
            stop.merchant ? (
              <li key={stop.merchant.id} className="card">
                <p className="card-kicker">Stop {index + 1}</p>
                <h3>
                  <OutLink href={stop.merchant.wiki}>{stop.merchant.name}</OutLink>
                </h3>
                <PlaceLine merchant={stop.merchant} />
                <ul className="pile">
                  {stop.lines.map((line) => (
                    <li key={line.name}>
                      <strong>{line.name}</strong>
                      <span>{line.reasons[0]}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ) : null,
          )}
          {plan.unmatched.lines.length > 0 ? (
            <li className="card quiet">
              <p className="card-kicker">No vendor</p>
              <h3>Nobody buys these</h3>
              <ul className="pile">
                {plan.unmatched.lines.map((line) => (
                  <li key={line.name}>
                    <strong>{line.name}</strong>
                  </li>
                ))}
              </ul>
            </li>
          ) : null}
        </ol>
      )}
    </section>
  );
}
