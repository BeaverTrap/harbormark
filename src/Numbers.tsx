import { ItemMark } from "./icons";
import { OutLink } from "./OutLink";
import { rateClass, type RatedSpell } from "./rotation";

function round(value: number): string {
  if (value >= 10) return String(Math.round(value));
  const text = value.toFixed(1);
  return text.endsWith(".0") ? text.slice(0, -2) : text;
}

function clock(value: number): string {
  return `${round(value)}s`;
}

function Detail({ row }: { row: RatedSpell }) {
  const { spell, kind, amount, seconds, perSecond, perMana } = row;
  if (kind === "weapon") {
    return (
      <p className="meta">
        {round(amount)}% of weapon damage
        {spell.skill ? ` · ${spell.skill}` : ""}
      </p>
    );
  }
  if (kind === "dot" && seconds) {
    const tick = perSecond != null ? perSecond * seconds : amount;
    return (
      <p className="meta">
        {round(tick)} every {clock(seconds)}
        {spell.duration ? ` · ${round(amount)} over ${clock(spell.duration)}` : ""}
        {perMana != null ? ` · ${round(perMana)} per mana` : ""}
      </p>
    );
  }
  return (
    <p className="meta">
      {round(amount)} {kind === "heal" ? "health" : "damage"}
      {seconds ? ` ${spell.cast != null && spell.cast > 0 ? "in" : "every"} ${clock(seconds)}` : ""}
      {spell.mana != null && spell.mana > 0 ? ` · ${spell.mana} mana` : ""}
      {perMana != null ? ` · ${round(perMana)} per mana` : ""}
      {spell.resist ? ` · ${spell.resist}` : ""}
    </p>
  );
}

function RankList({ rows, empty }: { rows: RatedSpell[]; empty: string }) {
  if (rows.length === 0) return <p className="note">{empty}</p>;
  return (
    <ol className="ranks">
      {rows.map((row, index) => (
        <li key={row.spell.name} className="rank">
          <span className="rank-n">{index + 1}</span>
          <ItemMark src={row.spell.icon} glyph={row.kind === "heal" ? "herbs" : row.kind === "weapon" ? "weapons" : "craft"} />
          <div className="row-body">
            <OutLink href={row.spell.wiki} className="item-name">
              {row.spell.name}
            </OutLink>
            <Detail row={row} />
          </div>
          <strong className="rank-rate">
            {row.perSecond != null ? `${round(row.perSecond)}/s` : row.kind === "weapon" ? `${round(row.amount)}%` : "no time"}
          </strong>
        </li>
      ))}
    </ol>
  );
}

export function Numbers({ className, level }: { className: string; level: number }) {
  const rated = rateClass(className, level);
  const timed = rated.damage.filter((row) => row.perSecond != null).slice(0, 8);
  const untimed = rated.damage.filter((row) => row.perSecond == null).slice(0, 5);
  const heals = rated.heals.slice(0, 5);
  const weapons = rated.weapons.slice(0, 5);
  const empty = timed.length === 0 && untimed.length === 0 && heals.length === 0 && weapons.length === 0;

  return (
    <section className="numbers">
      <h3 className="subhead">Cast order at level {level}</h3>
      {empty ? (
        <p className="note">The wiki has no hit-point numbers for {className} at this level.</p>
      ) : (
        <RankList rows={timed} empty={`No ${className} spell at this level has both a hit-point number and a cast or recast time.`} />
      )}
      {untimed.length > 0 ? (
        <>
          <h3 className="subhead">Damage, with no cast time published</h3>
          <RankList rows={untimed} empty="" />
        </>
      ) : null}
      {heals.length > 0 ? (
        <>
          <h3 className="subhead">Heals</h3>
          <RankList rows={heals} empty="" />
        </>
      ) : null}
      {weapons.length > 0 ? (
        <>
          <h3 className="subhead">Scales with the weapon</h3>
          <RankList rows={weapons} empty="" />
        </>
      ) : null}
    </section>
  );
}
