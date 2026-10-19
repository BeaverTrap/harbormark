import { atlasForMerchant, atlasForZone } from "./links";
import { OutLink } from "./OutLink";
import type { Merchant } from "./types";

export function PlaceLine({ merchant }: { merchant: Merchant }) {
  return (
    <p className="place">
      {merchant.zones.map((zone, index) => {
        const href = atlasForZone(zone);
        return (
          <span key={zone}>
            {index > 0 ? ", " : null}
            {href ? <OutLink href={href}>{zone}</OutLink> : zone}
          </span>
        );
      })}
      {merchant.location ? (
        <>
          {merchant.zones.length > 0 ? " · " : null}
          {merchant.location}
        </>
      ) : null}
      {(merchant.zones.length > 0 || merchant.location) ? " · " : null}
      <OutLink href={atlasForMerchant(merchant)}>Atlas</OutLink>
    </p>
  );
}
