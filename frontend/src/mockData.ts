export const SLOT_LENGTH_MINUTES = 30;

export const TIMEZONES = [
  "Asia/Kolkata",
  "Europe/London",
  "America/New_York",
];

export type Resource = {
  id: number;
  name: string;
  timezone: string;
  hours: { weekday: number; start: string; end: string }[];
};

/** Same seed as backend/db/init.sql. weekday: 0 = Sunday … 6 = Saturday */
export const RESOURCES: Resource[] = [
  {
    id: 1,
    name: "Room A — London",
    timezone: "Europe/London",
    hours: [
      { weekday: 1, start: "09:00", end: "17:00" },
      { weekday: 2, start: "09:00", end: "17:00" },
      { weekday: 3, start: "09:00", end: "17:00" },
      { weekday: 4, start: "09:00", end: "17:00" },
      { weekday: 5, start: "09:00", end: "17:00" },
    ],
  },
  {
    id: 2,
    name: "Room B — New York",
    timezone: "America/New_York",
    hours: [
      { weekday: 1, start: "08:00", end: "16:00" },
      { weekday: 2, start: "08:00", end: "16:00" },
      { weekday: 3, start: "08:00", end: "16:00" },
      { weekday: 4, start: "08:00", end: "16:00" },
      { weekday: 5, start: "08:00", end: "16:00" },
    ],
  },
  {
    id: 3,
    name: "Room C — Mumbai",
    timezone: "Asia/Kolkata",
    hours: [
      { weekday: 1, start: "10:00", end: "18:00" },
      { weekday: 2, start: "10:00", end: "18:00" },
      { weekday: 3, start: "10:00", end: "18:00" },
      { weekday: 4, start: "10:00", end: "18:00" },
      { weekday: 5, start: "10:00", end: "18:00" },
      { weekday: 6, start: "10:00", end: "18:00" },
    ],
  },
];
