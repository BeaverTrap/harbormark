import { merchants, zoneNames } from "./catalog";

const ZONES = zoneNames(merchants);

export function ZoneField({ zone, onZone }: { zone: string; onZone: (zone: string) => void }) {
  return (
    <label className="zone">
      Zone
      <select value={zone} onChange={(event) => onZone(event.target.value)}>
        <option value="all">All zones</option>
        <option value="hubs">Night Harbor and Underdocks</option>
        {ZONES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
