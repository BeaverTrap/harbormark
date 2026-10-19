import { ItemLink, NameList } from "./names";
import {
  BODY_SLOTS,
  gearScore,
  primaryWeapon,
  slotLabel,
  WEAPON_SLOTS,
  wornStats,
  type SharedCharacter,
} from "./share";

const SHEET_SLOTS = [...BODY_SLOTS, ...WEAPON_SLOTS];

export function ShareCard({ character }: { character: SharedCharacter }) {
  const bySlot = new Map(character.worn.map((piece) => [piece.slot, piece]));
  const filled = SHEET_SLOTS.filter((id) => bySlot.has(id)).length;
  const stats = wornStats(character);
  const weapon = primaryWeapon(character);
  const points = gearScore(character);

  return (
    <article className="card gear-sheet pane-violet">
      <h3>Gear</h3>
      <div className="gear-body">
        <div className="doll">
          <div className="doll-core" aria-hidden="true">
            <strong>{filled}</strong>
            <span>{filled === SHEET_SLOTS.length ? "all slots filled" : `of ${SHEET_SLOTS.length} slots`}</span>
          </div>
          {BODY_SLOTS.map((id) => (
            <Slot key={id} id={id} piece={bySlot.get(id)} />
          ))}
          <div className="weapons">
            {WEAPON_SLOTS.map((id) => (
              <Slot key={id} id={id} piece={bySlot.get(id)} />
            ))}
          </div>
        </div>
        <aside className="stat-sheet">
          <h4>Stats from gear</h4>
          {stats.length > 0 ? (
            <dl>
              {stats.map((row) => (
                <div key={row.key}>
                  <dt>{row.key}</dt>
                  <dd>{formatStat(row.value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>Nothing worn yet.</p>
          )}
          {weapon ? (
            <p>
              Weapon <b>{weapon}</b>
            </p>
          ) : null}
          {points > 0 ? (
            <p className="stat-total">
              Worn stat points <b>{points}</b>
            </p>
          ) : null}
          <p className="stat-note">Gear only. Base and race stats are not included.</p>
        </aside>
      </div>
      {character.wants.length > 0 ? (
        <p className="meta">
          Looking for <NameList names={character.wants.map((item) => item.name)} />.
        </p>
      ) : null}
    </article>
  );
}

function Slot({ id, piece }: { id: string; piece: SharedCharacter["worn"][number] | undefined }) {
  return (
    <div className={piece ? `slot-tile filled pos-${id}` : `slot-tile pos-${id}`}>
      <span className="slot-label">{slotLabel(id)}</span>
      {piece ? (
        <>
          <ItemLink name={piece.item.name} />
          {piece.item.stats ? <span className="slot-stats">{shortStats(piece.item.stats)}</span> : null}
        </>
      ) : (
        <span className="slot-empty">Empty</span>
      )}
    </div>
  );
}

function shortStats(stats: string): string {
  return stats.split(" · ").slice(0, 3).join(" · ");
}

function formatStat(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
