import { DateTime } from "luxon";
import { SLOT_LENGTH_MINUTES, type Resource } from "./mockData";

export type Slot = {
  startUtc: string;
  endUtc: string;
};

function jsWeekday(luxonWeekday: number) {
  // Luxon: 1 = Monday … 7 = Sunday
  // Our data: 0 = Sunday … 6 = Saturday
  return luxonWeekday === 7 ? 0 : luxonWeekday;
}

function parseHourMinute(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

export function slotsForDate(resource: Resource, date: string): Slot[] {
  const day = DateTime.fromISO(date, { zone: resource.timezone });
  if (!day.isValid) return [];

  const rule = resource.hours.find((h) => h.weekday === jsWeekday(day.weekday));
  if (!rule) return [];

  const startHm = parseHourMinute(rule.start);
  const endHm = parseHourMinute(rule.end);

  let current = DateTime.fromObject(
    {
      year: day.year,
      month: day.month,
      day: day.day,
      hour: startHm.hour,
      minute: startHm.minute,
    },
    { zone: resource.timezone },
  );

  const end = DateTime.fromObject(
    {
      year: day.year,
      month: day.month,
      day: day.day,
      hour: endHm.hour,
      minute: endHm.minute,
    },
    { zone: resource.timezone },
  );

  const slots: Slot[] = [];

  while (current.isValid && current < end) {
    const next = current.plus({ minutes: SLOT_LENGTH_MINUTES });
    if (!next.isValid) break;

    const startUtc = current.toUTC().toISO();
    const endUtc = next.toUTC().toISO();
    if (startUtc && endUtc) {
      slots.push({ startUtc, endUtc });
    }

    current = next;
  }

  return slots;
}

export function formatTime(isoUtc: string, zone: string) {
  return DateTime.fromISO(isoUtc, { zone: "utc" }).setZone(zone).toFormat("HH:mm");
}

export function formatRange(slot: Slot, zone: string) {
  return `${formatTime(slot.startUtc, zone)} – ${formatTime(slot.endUtc, zone)}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function hoursLabel(resource: Resource) {
  if (resource.hours.length === 0) return "Closed";
  const days = resource.hours.map((h) => WEEKDAYS[h.weekday]).join(", ");
  const first = resource.hours[0];
  return `${days} ${first.start}–${first.end}`;
}
