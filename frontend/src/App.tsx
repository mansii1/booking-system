import { useEffect, useState } from "react";
import axios from "axios";
import { DateTime } from "luxon";
import { TIMEZONES } from "./mockData";
import { formatRange } from "./slots";

const api = axios.create({ baseURL: "http://localhost:3001" });
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
    api
      .get("/resources")
      .then((res) => {
        setRooms(res.data);
        if (res.data[0]) setResourceId(res.data[0].id);
      })
      .catch(() => setToast({ kind: "err", text: "Could not load rooms. Is the API running?" }));
  }, []);

  useEffect(() => {
    if (!resourceId || !date) return;
    api
      .get(`/resources/${resourceId}/slots`, { params: { date } })
      .then((res) => setSlots(res.data))
      .catch(() => setToast({ kind: "err", text: "Could not load slots." }));
  }, [resourceId, date]);

  async function book(slot: Slot) {
    try {
      await api.post("/bookings", {
        resourceId,
        userId: "mansi",
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
      });
      setToast({
        kind: "ok",
        text: `Booked ${formatRange(slot.startUtc, slot.endUtc, viewerZone)} (${viewerZone}).`,
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setToast({ kind: "err", text: "That slot is already booked." });
      } else {
        setToast({
          kind: "err",
          text: err.response?.data?.message || "Booking failed.",
        });
      }
    }

    const fresh = await api.get(`/resources/${resourceId}/slots`, { params: { date } });
    setSlots(fresh.data);
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
