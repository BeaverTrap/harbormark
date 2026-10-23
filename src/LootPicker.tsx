import { useEffect, useMemo, useState } from "react";
import { merchants } from "./catalog";
import { iconFor } from "./craft";
import { familyCounts, familyShort, goods } from "./goods";
import { glyphForShort, Glyph, ItemMark } from "./icons";
import { findBuyers, normalize } from "./match";

const TRADES = familyCounts();
const BROWSE_LIMIT = 80;
const SEARCH_LIMIT = 200;

export function LootPicker({
  picked,
  onPick,
  zone,
}: {
  picked: { name: string; qty?: number }[];
  onPick: (name: string) => void;
  zone: string;
}) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const [trimmed, setTrimmed] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setTrimmed(query.trim()), 150);
    return () => window.clearTimeout(id);
  }, [query]);
  const pickedNames = new Set(picked.map((item) => normalize(item.name)));

  const shown = useMemo(() => {
    const needle = normalize(trimmed);
    const matches = goods.filter((good) => {
      if (family && !needle && good.family !== family) return false;
      if (!needle) return Boolean(family);
      const haystack = normalize(`${good.name} ${good.note} ${familyShort(good.family)}`);
      return haystack.includes(needle);
    });
    if (!needle) return matches;
    const ranked = matches.map((good) => {
      const normalized = normalize(good.name);
      const rank = normalized === needle ? 0 : normalized.startsWith(needle) ? 1 : normalized.split(" ").includes(needle) ? 2 : 3;
      return { good, rank };
    });
    ranked.sort((a, b) => a.rank - b.rank || a.good.name.localeCompare(b.good.name));
    return ranked.map((entry) => entry.good);
  }, [family, trimmed]);

  const limit = trimmed ? SEARCH_LIMIT : BROWSE_LIMIT;
  const visible = shown.slice(0, limit);
  const visibleKey = visible.map((good) => good.name).join("\n");
  const buyers = useMemo(() => {
    const labels = new Map<string, string>();
    for (const name of visibleKey ? visibleKey.split("\n") : []) {
      const hits = findBuyers(name, merchants, zone);
      const best = hits.here[0] ?? hits.elsewhere[0];
      labels.set(normalize(name), best ? best.merchant.name : "No vendor buys this");
    }
    return labels;
  }, [visibleKey, zone]);
  const browsing = !trimmed && family === null;

  return (
    <div className="picker">
      <label className="query">
        Find a drop
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Any item: boots, bone chips, a ring…"
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
              const pickedName = pickedNames.has(normalize(good.name));
              return (
                <button
                  key={good.name}
                  type="button"
                  className={pickedName ? "good on" : "good"}
                  onClick={() => onPick(good.name)}
                >
                  <ItemMark src={iconFor(good.name)} glyph={glyphForShort(familyShort(good.family))} />
                  <span className="good-copy">
                    <span className="good-name">{good.name}</span>
                    <small className="craft-hint">{buyers.get(normalize(good.name))}</small>
                  </span>
                </button>
              );
            })}
          </div>
          {shown.length === 0 ? <p className="note">No wiki item matches that.</p> : null}
          {shown.length > limit ? (
            <p className="note">
              Showing {limit} of {shown.length}. Type more of the name.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
