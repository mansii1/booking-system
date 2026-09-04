import { DateTime } from 'luxon';
import { SLOT_LENGTH_MINUTES } from './slot-length';

export function makeSlots(date: string, zone: string, hours: any[]) {
  const day = DateTime.fromISO(date, { zone });
  if (!day.isValid) return [];

  // luxon: Mon=1 ... Sun=7. we stored Sun=0 ... Sat=6
  const weekday = day.weekday === 7 ? 0 : day.weekday;
  const open = hours.find((h) => h.weekday === weekday);
  if (!open) return [];

  let t = DateTime.fromISO(`${date}T${String(open.start_time).slice(0, 5)}`, { zone });
  const close = DateTime.fromISO(`${date}T${String(open.end_time).slice(0, 5)}`, { zone });

  const out: { startUtc: string; endUtc: string }[] = [];

  while (t.isValid && t < close) {
    const next = t.plus({ minutes: SLOT_LENGTH_MINUTES });
    if (!next.isValid) break;
    out.push({
      startUtc: t.toUTC().toISO()!,
      endUtc: next.toUTC().toISO()!,
    });
    t = next;
  }

  return out;
}
