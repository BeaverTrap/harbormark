import { useMemo, useState } from "react";
import { iconFor } from "./craft";
import { familyCounts, familyShort, goods } from "./goods";
import { glyphForShort, Glyph, ItemMark } from "./icons";
import { normalize } from "./match";

const TRADES = familyCounts();
const SHOW_LIMIT = 48;

export function LootPicker({
  picked,
  onPick,
}: {
  picked: { name: string; qty?: number }[];
  onPick: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const trimmed = query.trim();
  const pickedQty = new Map(picked.map((item) => [normalize(item.name), item.qty ?? 1]));

  const shown = useMemo(() => {
    const needle = normalize(trimmed);
    return goods.filter((good) => {
      if (family && !needle && good.family !== family) return false;
      if (!needle) return Boolean(family);
      const haystack = normalize(`${good.name} ${good.note} ${familyShort(good.family)}`);
      return haystack.includes(needle);
    });
  }, [family, trimmed]);

  const visible = shown.slice(0, SHOW_LIMIT);
  const browsing = !trimmed && family === null;

  return (
    <div className="picker">
      <label className="query">
        Find a drop
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pelt, bushmeat, bone chips…"
          autoComplete="off"
        />
      </label>

      {browsing ? (
        <div className="trade-grid">
          {TRADES.map((trade) => (
            <button key={trade.label} type="button" className="trade-card" onClick={() => setFamily(trade.label)}>
              <span className="mark">
                <Glyph name={glyphForShort(trade.short)} />
              </span>
              <strong>{trade.short}</strong>
              <span>
                {trade.count} {trade.count === 1 ? "good" : "goods"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="samples">
            <button type="button" className="chip" onClick={() => { setFamily(null); setQuery(""); }}>
              All trades
            </button>
            {TRADES.map((trade) => (
              <button
                key={trade.label}
                type="button"
                className={trade.label === family && !trimmed ? "chip on" : "chip"}
                onClick={() => {
                  setFamily(trade.label);
                  setQuery("");
                }}
              >
                {trade.short}
              </button>
            ))}
          </div>
          <div className="goods">
            {visible.map((good) => {
              const qty = pickedQty.get(normalize(good.name));
              return (
                <button
                  key={good.name}
                  type="button"
                  className={qty ? "good on" : "good"}
                  onClick={() => onPick(good.name)}
                >
                  <ItemMark src={iconFor(good.name)} glyph={glyphForShort(familyShort(good.family))} />
                  <span className="good-name">{good.name}</span>
                  {qty ? <em>{qty}</em> : null}
                </button>
              );
            })}
          </div>
          {shown.length === 0 ? <p className="note">Nothing in the merchant lists matches that.</p> : null}
          {shown.length > SHOW_LIMIT ? (
            <p className="note">
              Showing {SHOW_LIMIT} of {shown.length}. Narrow it with a trade or a few more letters.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
