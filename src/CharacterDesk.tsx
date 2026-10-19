import { useEffect, useMemo, useRef, useState } from "react";
import { skills } from "./catalog";
import { useCraftLevels } from "./crafts";
import { OutLink } from "./OutLink";
import { wikiPage, LEDGER_HOME } from "./links";
import { playedTrades } from "./played";
import { decodeShare } from "./share";
import { ShareCard } from "./ShareCard";
import { traitSlotLabel, traitStart, traitsFor, TRAIT_SLOTS, useTraits, type TraitSlot } from "./traits";
import { useCharacterLevel, useShareText, writeLevel } from "./useShare";

function ImportField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="share-box">
      Ledger share link
      <input
        type="text"
        value={value}
        placeholder="Paste a Castanova share link"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function UpdateSheet({ onImport }: { onImport: (value: string) => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);

  return (
    <form
      className="sheet-update-form"
      onSubmit={(event) => {
        event.preventDefault();
        const read = decodeShare(draft);
        if (read.status !== "ok") {
          setError(true);
          return;
        }
        setError(false);
        onImport(draft.trim());
        setDraft("");
      }}
    >
      <label className="share-box">
        New share link
        <input
          type="text"
          value={draft}
          placeholder="Paste the new Ledger share link"
          spellCheck={false}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(false);
          }}
        />
      </label>
      <button type="submit" className="text-btn">
        Update sheet
      </button>
      {error ? <p className="note">That share link can&apos;t be read. It may be cut off.</p> : null}
    </form>
  );
}

function TraitPick({
  slot,
  classCode,
  value,
  onChange,
}: {
  slot: TraitSlot;
  classCode: string | null;
  value: string;
  onChange: (slot: TraitSlot, name: string) => void;
}) {
  const options = traitsFor(slot, classCode, value);
  const picked = options.find((trait) => trait.name === value);
  return (
    <label>
      {traitSlotLabel(slot)}
      <select value={value} onChange={(event) => onChange(slot, event.target.value)}>
        <option value="">Not set</option>
        {options.map((trait) => (
          <option key={trait.name} value={trait.name}>
            {trait.name}
          </option>
        ))}
      </select>
      {picked ? <small>{picked.note}</small> : null}
    </label>
  );
}

export function CharacterDesk() {
  const [shareText, setShareText] = useShareText();
  const shared = useMemo(() => decodeShare(shareText), [shareText]);
  const character = shared.status === "ok" ? shared.character : null;
  const [level, setLevel] = useCharacterLevel(character ? Math.min(60, character.level) : 1);
  const trades = useMemo(() => playedTrades(skills), []);
  const [craftLevels, setCraftLevel] = useCraftLevels();
  const [traits, setTrait] = useTraits();
  const seenShare = useRef(shareText);

  useEffect(() => {
    if (!character) {
      seenShare.current = shareText;
      return;
    }
    localStorage.setItem("harbormark-class", character.className);
    if (seenShare.current !== shareText) {
      seenShare.current = shareText;
      writeLevel(Math.min(60, character.level));
    }
  }, [character, shareText]);

  return (
    <section className="desk">
      <div className="desk-copy">
        <h2>{character ? character.name : "Character"}</h2>
        {character ? (
          <>
            <p className="sheet-identity">
              {character.className} · {level}
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
            <p>Camps and routines use this level. Change it here after the first import.</p>
          </>
        ) : (
          <p>Import a character sheet from a Castanova Ledger share link. Trades and routines then use this level.</p>
        )}
      </div>
      {character ? <ShareCard character={character} /> : null}
      <section className="pane pane-green">
        <h3 className="subhead">Skills</h3>
        <p>The trade skills that are in the game. Type the number you have now. Leave a box empty if you have not trained it.</p>
        <div className="skill-grid">
          {trades.map((skill) => {
            const start = traitStart(traits, skill.name);
            const known = craftLevels[skill.name];
            return (
              <label key={skill.name}>
                <span>
                  {skill.name}
                  {known == null && start != null ? <small>{` starts at ${start}`}</small> : null}
                </span>
                <input
                  type="number"
                  min={0}
                  max={300}
                  inputMode="numeric"
                  aria-label={`${skill.name} skill`}
                  value={known ?? ""}
                  onChange={(event) => {
                    if (event.target.value === "") {
                      setCraftLevel(skill.name, null);
                      return;
                    }
                    const next = Number(event.target.value);
                    if (Number.isInteger(next) && next >= 0 && next <= 300) setCraftLevel(skill.name, next);
                  }}
                />
              </label>
            );
          })}
        </div>
      </section>
      <section className="pane pane-violet">
        <h3 className="subhead">Traits</h3>
        <p>
          One of each, from the <OutLink href={wikiPage("Traits")}>wiki trait list</OutLink>.
          {character ? ` Showing traits a ${character.className} can take.` : " Import a sheet to hide traits your class cannot take."} Racial
          abilities are granted by race and are not chosen here.
          {character?.classCode === "ARC" ? " Archers also have High Ground. It does not use one of these picks." : ""}
        </p>
        <div className="trait-picks">
          {TRAIT_SLOTS.map((slot) => (
            <TraitPick
              key={slot}
              slot={slot}
              classCode={character?.classCode ?? null}
              value={traits[slot]}
              onChange={setTrait}
            />
          ))}
        </div>
      </section>
      {character ? (
        <section className="pane pane-gold sheet-update">
          <h3 className="subhead">Update from the Ledger</h3>
          <p>
            The share link is the sheet. Copy share link on the Ledger again after the gear changes. That link is a new
            one. Paste it here.
          </p>
          <UpdateSheet onImport={setShareText} />
          <p className="source">
            Open the character on <OutLink href={LEDGER_HOME}>Castanova&apos;s Arcane Ledger</OutLink> and use Copy
            share link.
          </p>
        </section>
      ) : (
        <>
          <ImportField value={shareText} onChange={setShareText} />
          <p className="source">
            Open the character on <OutLink href={LEDGER_HOME}>Castanova&apos;s Arcane Ledger</OutLink> and copy its share
            link.
          </p>
        </>
      )}
      {shared.status === "bad" ? <p className="note">That share link can&apos;t be read. It may be cut off.</p> : null}
    </section>
  );
}
