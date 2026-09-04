import { DateTime } from "luxon";

export function formatRange(startUtc: string, endUtc: string, zone: string) {
  const start = DateTime.fromISO(startUtc, { zone: "utc" }).setZone(zone).toFormat("HH:mm");
  const end = DateTime.fromISO(endUtc, { zone: "utc" }).setZone(zone).toFormat("HH:mm");
  return `${start} – ${end}`;
}
