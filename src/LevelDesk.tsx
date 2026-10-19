import { useMemo } from "react";
import { conOf, type ConColor } from "./consider";
import { ItemLink, NameList, ZoneLink } from "./names";
import { decodeShare } from "./share";
import { levelVerdict, levelingPlan, type MaterialCamp } from "./supply";
import { useCharacterLevel, useShareText } from "./useShare";

export function LevelDesk() {
  const [shareText] = useShareText();
  const shared = useMemo(() => decodeShare(shareText), [shareText]);
  const character = shared.status === "ok" ? shared.character : null;
  const [level, setLevel] = useCharacterLevel(character ? Math.min(60, character.level) : 9);
  const plan = useMemo(() => levelingPlan(level), [level]);
  const verdict = levelVerdict(plan);

  return (
    <section className="desk">
      <div className="desk-copy">
        <h2>Where to level</h2>
        <p>
          {character ? `${character.name}, ${character.className}. ` : null}
          One zone, the camps whose levels include yours. These are wiki drop camps, not a published leveling path.
        </p>
        <label className="char-level">
          Level
          <input
            type="number"
            min={1}
            max={60}
            value={level}
            onChange={(event) => {
              if (event.target.value === "") return;
              const next = Number(event.target.value);
              if (Number.isInteger(next)) setLevel(next);
            }}
          />
        </label>
      </div>
      {plan.stay ? (
        <section className="pane pane-blue">
          <h3 className="subhead">
            Stay in <ZoneLink zone={plan.stay.zone} />
          </h3>
          <p>{verdict}</p>
          <ul className="pile">
            {plan.stay.camps.map((camp) => (
              <li key={`${camp.npc}|${camp.zone}`}>
                <strong>
                  <ItemLink name={camp.npc} />
                  {camp.items.length > 0 ? (
                    <span className="craft-hint">
                      <NameList names={camp.items} />
                    </span>
                  ) : null}
                </strong>
                <CampLevel camp={camp} you={level} />
              </li>
            ))}
          </ul>
          <p className="source">Mob levels are from the wiki. Color is an estimate until the game publishes consider bands.</p>
        </section>
      ) : (
        <p className="note">The wiki lists no camp whose level range includes {level}.</p>
      )}
      {plan.elsewhere.length > 0 ? (
        <section className="pane pane-gold">
          <h3 className="subhead">Leave these</h3>
          <p>Chasing every camp means crossing zones for the same levels. These can wait.</p>
          <ul className="pile">
            {plan.elsewhere.map((zone) => (
              <li key={zone.zone}>
                <strong>
                  <ZoneLink zone={zone.zone} />
                  <span className="craft-hint">
                    {zone.camps.length === 1 ? "1 camp" : `${zone.camps.length} camps`}
                  </span>
                </strong>
                <span>
                  {zone.camps.map((camp, index) => (
                    <span key={`${camp.npc}|${camp.zone}`}>
                      {index > 0 ? ", " : null}
                      <ItemLink name={camp.npc} />
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function CampLevel({ camp, you }: { camp: MaterialCamp; you: number }) {
  if (camp.min == null) return <span>level unknown</span>;
  const max = camp.max ?? camp.min;
  if (camp.min === max) return <span className={`con-${conOf(camp.min, you)}`}>{camp.min}</span>;
  return (
    <span>
      <Con n={camp.min} you={you} />–<Con n={max} you={you} />
    </span>
  );
}

function Con({ n, you }: { n: number; you: number }) {
  const color: ConColor = conOf(n, you);
  return <span className={`con-${color}`}>{n}</span>;
}
