import { ItemMark } from "./icons";
import { OutLink } from "./OutLink";
import { PlaceLine } from "./PlaceLine";
import type { Merchant } from "./types";

export function MerchantCard({
  merchant,
  reasons,
  heading,
  quiet,
}: {
  merchant: Merchant;
  reasons: string[];
  heading?: string;
  quiet?: boolean;
}) {
  return (
    <article className={quiet ? "card quiet row" : "card row"}>
      <ItemMark glyph={merchant.greedy ? "coin" : "haul"} />
      <div className="row-body">
      {heading ? <p className="card-kicker">{heading}</p> : null}
      <h3>
        <OutLink href={merchant.wiki} className="item-name">
          {merchant.name}
        </OutLink>
      </h3>
      <PlaceLine merchant={merchant} />
      {reasons.length > 0 ? (
        <ul className="reasons">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      </div>
    </article>
  );
}
