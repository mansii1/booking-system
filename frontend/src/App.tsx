import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { TIMEZONES } from "./mockData";
import { formatRange } from "./slots";

const API = "http://localhost:3001";
const today = DateTime.now().toISODate() ?? "";

type Room = { id: number; name: string; iana_timezone: string };
type Slot = { startUtc: string; endUtc: string; taken: boolean };

export default function App() {
  const [viewerZone, setViewerZone] = useState("Asia/Kolkata");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const room = rooms.find((r) => r.id === resourceId);

  useEffect(() => {
    fetch(`${API}/resources`)
      .then((r) => r.json())
      .then((data) => {
        setRooms(data);
        if (data[0]) setResourceId(data[0].id);
      })
      .catch(() => setToast({ kind: "err", text: "Could not load rooms. Is the API running?" }));
  }, []);

  useEffect(() => {
    if (!resourceId || !date) return;
    fetch(`${API}/resources/${resourceId}/slots?date=${date}`)
      .then((r) => r.json())
      .then(setSlots)
      .catch(() => setToast({ kind: "err", text: "Could not load slots." }));
  }, [resourceId, date]);

  async function book(slot: Slot) {
    const res = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        userId: "mansi",
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
      }),
    });

    if (res.status === 409) {
      setToast({ kind: "err", text: "That slot is already booked." });
    } else if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setToast({ kind: "err", text: err.message || "Booking failed." });
    } else {
      setToast({
        kind: "ok",
        text: `Booked ${formatRange(slot.startUtc, slot.endUtc, viewerZone)} (${viewerZone}).`,
      });
    }

    const fresh = await fetch(`${API}/resources/${resourceId}/slots?date=${date}`);
    setSlots(await fresh.json());
  }

  return (
    <div className="page">
      <header>
        <h1>Book a room</h1>
        <p className="sub">Times are shown in your selected timezone. Bookings are saved in Postgres.</p>
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
            value={resourceId ?? ""}
            onChange={(e) => {
              setResourceId(Number(e.target.value));
              setToast(null);
            }}
          >
            {rooms.map((r) => (
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

      {room && (
        <p className="hint">
          {room.name} uses <strong>{room.iana_timezone}</strong>. You are viewing times in{" "}
          <strong>{viewerZone}</strong>.
        </p>
      )}

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
        <p className="empty">This room is closed on that day, or slots have not loaded yet.</p>
      ) : (
        <div className="slots">
          {slots.map((slot) => (
            <button
              key={slot.startUtc}
              type="button"
              className={slot.taken ? "slot taken" : "slot open"}
              onClick={() => book(slot)}
            >
              <span>{formatRange(slot.startUtc, slot.endUtc, viewerZone)}</span>
              <span className="tag">{slot.taken ? "Taken" : "Open"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
