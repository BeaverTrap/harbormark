import { useEffect, useState } from "react";
import { merchants } from "./catalog";
import { craftsUsing } from "./craft";
import { LootPicker } from "./LootPicker";
import { normalize, parseHaul, planHaul, shadyInZone, type HaulEntry } from "./match";
import { ItemLink } from "./names";
import { OutLink } from "./OutLink";
import { PlaceLine } from "./PlaceLine";
import { ZoneField } from "./ZoneField";

function CraftHint({ name }: { name: string }) {
  const crafts = craftsUsing(name);
  if (crafts.length === 0) return null;
  const names = crafts.slice(0, 2).map((recipe) => recipe.product);
  const extra = crafts.length - names.length;
  return (
    <small className="craft-hint">
      Crafts into {names.join(", ")}
      {extra > 0 ? ` +${extra}` : ""}
    </small>
  );
}

function readBag(): HaulEntry[] {
  const raw = localStorage.getItem("harbormark-haul");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (line): line is HaulEntry =>
          typeof line === "object" &&
          line !== null &&
          "name" in line &&
          "qty" in line &&
          typeof line.name === "string" &&
          typeof line.qty === "number",
      );
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
    localStorage.setItem("harbormark-haul", JSON.stringify(bag));
  }, [bag]);

  const add = (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return;
    setBag((current) => {
      const key = normalize(cleaned);
      const existing = current.find((line) => normalize(line.name) === key);
      if (!existing) return [...current, { name: cleaned, qty: 1 }];
      return current.map((line) => (line === existing ? { ...line, qty: line.qty + 1 } : line));
    });
  };

  const setQty = (name: string, qty: number) => {
    const key = normalize(name);
    setBag((current) =>
      qty < 1
        ? current.filter((line) => normalize(line.name) !== key)
        : current.map((line) => (normalize(line.name) === key ? { ...line, qty } : line)),
    );
  };

  const plan = planHaul(bag.map((line) => `${line.qty} ${line.name}`).join("\n"), merchants, zone);
  const shady = shadyInZone(merchants, zone);

  return (
    <section className="desk">
      <div className="desk-copy">
        <h2>Sell</h2>
        <p>Add what you are carrying. One stop per buyer, in the zone you picked.</p>
      </div>
      <ZoneField zone={zone} onZone={onZone} />
      <div className="haul-layout">
        <LootPicker picked={bag} onPick={add} />
        <div className="bag">
          <h3>In the bag</h3>
          {bag.length === 0 ? <p className="note">Nothing picked yet.</p> : null}
          <ul className="pile">
            {bag.map((line) => (
              <li key={line.name}>
                <strong>
                  <ItemLink name={line.name} />
                  <CraftHint name={line.name} />
                </strong>
                <span className="qty">
                  <button type="button" onClick={() => setQty(line.name, line.qty - 1)} aria-label={`Remove one ${line.name}`}>
                    −
                  </button>
                  {line.qty}
                  <button type="button" onClick={() => setQty(line.name, line.qty + 1)} aria-label={`Add one ${line.name}`}>
                    +
                  </button>
                </span>
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
      {bag.length === 0 ? null : (
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
                    <li key={`${line.name}-${line.qty}`}>
                      <strong>
                        {line.qty}× {line.name}
                      </strong>
                      <span>{line.reasons[0]}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ) : null,
          )}
          {plan.unmatched.lines.length > 0 ? (
            <li className="card quiet">
              <p className="card-kicker">No specialist listed</p>
              <h3>Still in the bag</h3>
              <ul className="pile">
                {plan.unmatched.lines.map((line) => (
                  <li key={`${line.name}-${line.qty}`}>
                    <strong>
                      {line.qty}× {line.name}
                    </strong>
                  </li>
                ))}
              </ul>
              {shady[0] ? (
                <p className="place">
                  <OutLink href={shady[0].wiki}>{shady[0].name}</OutLink> will take them for less. <PlaceLine merchant={shady[0]} />
                </p>
              ) : null}
            </li>
          ) : null}
        </ol>
      )}
    </section>
  );
}
