import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { RESOURCES, TIMEZONES } from "./mockData";
import { formatRange, hoursLabel, slotsForDate, type Slot } from "./slots";

const today = DateTime.now().toISODate() ?? "";

type Toast = { kind: "ok" | "err"; text: string };

export default function App() {
  const [viewerZone, setViewerZone] = useState("Asia/Kolkata");
  const [resourceId, setResourceId] = useState(1);
  const [date, setDate] = useState(today);
  const [bookedKeys, setBookedKeys] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const resource = RESOURCES.find((r) => r.id === resourceId) ?? RESOURCES[0];
  const slots = useMemo(() => slotsForDate(resource, date), [resource, date]);

  // Two slots look taken so you can try the "already booked" case without an API.
  const demoTaken = new Set(
    slots.filter((_, i) => i === 2 || i === 5).map((s) => s.startUtc),
  );

  function keyFor(startUtc: string) {
    return `${resource.id}|${startUtc}`;
  }

  function isTaken(startUtc: string) {
    return demoTaken.has(startUtc) || bookedKeys.includes(keyFor(startUtc));
  }

  function book(slot: Slot) {
    if (isTaken(slot.startUtc)) {
      setToast({
        kind: "err",
        text: `Could not book ${formatRange(slot, viewerZone)} — that slot is already taken.`,
      });
      return;
    }
    setBookedKeys((prev) => [...prev, keyFor(slot.startUtc)]);
    setToast({
      kind: "ok",
      text: `Booked ${formatRange(slot, viewerZone)} (${viewerZone}). Mock only — not saved on the server.`,
    });
  }

  const myBookings = slots.filter((s) => bookedKeys.includes(keyFor(s.startUtc)));

  return (
    <div className="page">
      <header>
        <h1>Book a room</h1>
        <p className="sub">
          Pick a room and a date, then choose an open slot. Nothing is sent to the
          API yet.
        </p>
      </header>

      <section className="controls">
        <label>
          Your timezone
          <select value={viewerZone} onChange={(e) => setViewerZone(e.target.value)}>
            {TIMEZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>

        <label>
          Room
          <select
            value={resource.id}
            onChange={(e) => {
              setResourceId(Number(e.target.value));
              setToast(null);
            }}
          >
            {RESOURCES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setToast(null);
            }}
          />
        </label>
      </section>

      <p className="hint">
        {resource.name} hours ({resource.timezone}): {hoursLabel(resource)}.
        <br />
        Slot times below are shown in <strong>{viewerZone}</strong>.
      </p>

      <p className="legend">
        <span className="dot open" /> Open
        <span className="dot taken" /> Taken
      </p>

      {toast && (
        <p className={toast.kind === "ok" ? "banner ok" : "banner err"} role="status">
          {toast.text}
        </p>
      )}

      {slots.length === 0 ? (
        <p className="empty">This room is closed on that day. Try a weekday.</p>
      ) : (
        <div className="slots">
          {slots.map((slot) => {
            const taken = isTaken(slot.startUtc);
            return (
              <button
                key={slot.startUtc}
                type="button"
                className={taken ? "slot taken" : "slot open"}
                onClick={() => book(slot)}
              >
                <span>{formatRange(slot, viewerZone)}</span>
                <span className="tag">{taken ? "Taken" : "Open"}</span>
              </button>
            );
          })}
        </div>
      )}

      {myBookings.length > 0 && (
        <section className="mine">
          <h2>Your bookings this session</h2>
          <ul>
            {myBookings.map((slot) => (
              <li key={slot.startUtc}>
                {resource.name}: {formatRange(slot, viewerZone)} ({viewerZone})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
