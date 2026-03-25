import { useState, useEffect, useRef } from "react";
import type { Route } from "./+types/design4";
import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ROOM_SYS v4.2.1" }];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Orbitron:wght@400;700;900&display=swap",
  },
];

// ---------- helpers ----------

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayDisplay() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function currentHour() {
  return new Date().getHours();
}

function roomBookings(bookings: Booking[], roomId: string) {
  return bookings.filter((b) => b.roomId === roomId && b.date === todayStr());
}

function bookingAt(bookings: Booking[], roomId: string, hour: number) {
  return bookings.find(
    (b) =>
      b.roomId === roomId &&
      b.date === todayStr() &&
      hour >= b.startHour &&
      hour < b.endHour,
  );
}

function isRoomBusy(bookings: Booking[], roomId: string) {
  const h = currentHour();
  return bookings.some(
    (b) =>
      b.roomId === roomId &&
      b.date === todayStr() &&
      h >= b.startHour &&
      h < b.endHour,
  );
}

function nextBooking(bookings: Booking[], roomId: string) {
  const h = currentHour();
  const upcoming = bookings
    .filter(
      (b) => b.roomId === roomId && b.date === todayStr() && b.startHour > h,
    )
    .sort((a, b) => a.startHour - b.startHour);
  return upcoming[0] ?? null;
}

function currentBooking(bookings: Booking[], roomId: string) {
  const h = currentHour();
  return bookings.find(
    (b) =>
      b.roomId === roomId &&
      b.date === todayStr() &&
      h >= b.startHour &&
      h < b.endHour,
  );
}

// ---------- typing animation hook ----------

function useTypewriter(text: string, speed: number, startDelay: number) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const startTimer = setTimeout(() => {
      const tick = () => {
        if (idx <= text.length) {
          setDisplayed(text.slice(0, idx));
          idx++;
          timer = setTimeout(tick, speed);
        } else {
          setDone(true);
        }
      };
      tick();
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(timer);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ---------- CRT style tag ----------

const CRT_STYLES = `
  @keyframes flicker {
    0%   { opacity: 0.97; }
    5%   { opacity: 0.95; }
    10%  { opacity: 0.98; }
    15%  { opacity: 0.96; }
    20%  { opacity: 0.99; }
    50%  { opacity: 1; }
    80%  { opacity: 0.98; }
    90%  { opacity: 0.96; }
    100% { opacity: 0.97; }
  }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  @keyframes bootGlow {
    0%   { text-shadow: 0 0 2px #00FF41; }
    50%  { text-shadow: 0 0 8px #00FF41, 0 0 16px #00FF41; }
    100% { text-shadow: 0 0 2px #00FF41; }
  }

  @keyframes statusBlink {
    0%, 70% { opacity: 1; }
    71%, 100% { opacity: 0.3; }
  }

  .crt-screen {
    animation: flicker 4s infinite;
    position: relative;
    font-family: 'JetBrains Mono', monospace;
    background: #0D0D0D;
    color: #00FF41;
    border-radius: 8px;
    box-shadow:
      inset 0 0 60px rgba(0, 255, 65, 0.05),
      0 0 20px rgba(0, 255, 65, 0.1),
      0 0 60px rgba(0, 255, 65, 0.05);
  }

  .crt-screen::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 65, 0.03) 2px,
      rgba(0, 255, 65, 0.03) 4px
    );
    pointer-events: none;
    z-index: 50;
  }

  .glow {
    text-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41;
  }

  .glow-amber {
    text-shadow: 0 0 5px #FFB000, 0 0 10px #FFB000;
    color: #FFB000;
  }

  .glow-cyan {
    text-shadow: 0 0 5px #00FFFF, 0 0 10px #00FFFF;
    color: #00FFFF;
  }

  .glow-red {
    text-shadow: 0 0 5px #FF0040, 0 0 10px #FF0040;
    color: #FF0040;
  }

  .heading-font {
    font-family: 'Orbitron', sans-serif;
  }

  .cursor-blink::after {
    content: "█";
    animation: blink 1s step-end infinite;
  }

  .status-blink {
    animation: statusBlink 2s ease-in-out infinite;
  }

  .boot-glow {
    animation: bootGlow 1.5s ease-in-out infinite;
  }

  .terminal-btn {
    background: transparent;
    border: 1px solid #00FF41;
    color: #00FF41;
    font-family: 'JetBrains Mono', monospace;
    padding: 6px 16px;
    cursor: pointer;
    text-shadow: 0 0 5px #00FF41;
    transition: all 0.15s;
  }
  .terminal-btn:hover {
    background: #00FF41;
    color: #0D0D0D;
    text-shadow: none;
    box-shadow: 0 0 15px #00FF41;
  }

  .terminal-btn-red {
    border-color: #FF0040;
    color: #FF0040;
    text-shadow: 0 0 5px #FF0040;
  }
  .terminal-btn-red:hover {
    background: #FF0040;
    color: #0D0D0D;
    text-shadow: none;
    box-shadow: 0 0 15px #FF0040;
  }

  .terminal-btn-amber {
    border-color: #FFB000;
    color: #FFB000;
    text-shadow: 0 0 5px #FFB000;
  }
  .terminal-btn-amber:hover {
    background: #FFB000;
    color: #0D0D0D;
    text-shadow: none;
    box-shadow: 0 0 15px #FFB000;
  }

  .terminal-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid #00FF41;
    color: #00FF41;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    outline: none;
    padding: 4px 0;
    text-shadow: 0 0 5px #00FF41;
    width: 100%;
    caret-color: #00FF41;
  }

  .terminal-input::placeholder {
    color: #003B00;
  }

  .grid-cell {
    border: 1px solid #003B00;
    transition: all 0.15s;
    cursor: pointer;
    min-height: 40px;
  }
  .grid-cell:hover {
    background: rgba(0, 255, 65, 0.05);
    border-color: #00FF41;
    box-shadow: inset 0 0 10px rgba(0, 255, 65, 0.1);
  }
  .grid-cell-booked {
    background: rgba(0, 255, 65, 0.08);
    border-color: #00FF41;
  }
  .grid-cell-booked:hover {
    background: rgba(0, 255, 65, 0.15);
  }

  .modal-overlay {
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(2px);
  }
`;

// ---------- Boot sequence ----------

function BootSequence({ onDone }: { onDone: () => void }) {
  const line1 = useTypewriter("INITIALIZING ROOM_SYS v4.2.1...", 35, 200);
  const line2 = useTypewriter("LOADING ROOM DATABASE...", 35, 1600);
  const line3 = useTypewriter("CONNECTING TO BUILDING NETWORK...", 35, 2800);
  const line4 = useTypewriter("ALL SYSTEMS NOMINAL. WELCOME.", 35, 4200);

  useEffect(() => {
    if (line4.done) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [line4.done, onDone]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
      <div className="space-y-2 p-8 text-sm">
        <div className="glow">
          {line1.displayed}
          {!line1.done && <span className="cursor-blink" />}
        </div>
        {line1.done && (
          <div className="glow">
            {line2.displayed}
            {!line2.done && <span className="cursor-blink" />}
          </div>
        )}
        {line2.done && (
          <div className="glow">
            {line3.displayed}
            {!line3.done && <span className="cursor-blink" />}
          </div>
        )}
        {line3.done && (
          <div className="boot-glow">
            {line4.displayed}
            {!line4.done && <span className="cursor-blink" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Status bar ----------

function StatusBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#003B00] px-4 py-2 text-xs">
      <span className="heading-font glow text-sm font-bold tracking-wider">
        ROOM_SYS v4.2.1
      </span>
      <span className="text-[#003B00]">│</span>
      <span className="glow">
        UPTIME: <span className="glow-amber">847d 13h 42m</span>
      </span>
      <span className="text-[#003B00]">│</span>
      <span className="glow">
        ROOMS:{" "}
        <span className="glow-cyan">
          {ROOMS.length}/{ROOMS.length} ONLINE
        </span>
      </span>
      <span className="text-[#003B00]">│</span>
      <span className="glow">
        DATE: <span className="glow-amber">{todayDisplay()}</span>
      </span>
      <span className="text-[#003B00]">│</span>
      <span className="glow">
        MEM:{" "}
        <span className="glow-cyan">
          {(Math.random() * 20 + 60).toFixed(1)}% USED
        </span>
      </span>
      <span className="text-[#003B00]">│</span>
      <span className="status-blink glow" style={{ color: "#00FF41" }}>
        ● SYSTEM ACTIVE
      </span>
    </div>
  );
}

// ---------- Room panel ----------

function RoomPanel({
  room,
  bookings,
}: {
  room: Room;
  bookings: Booking[];
}) {
  const busy = isRoomBusy(bookings, room.id);
  const current = currentBooking(bookings, room.id);
  const next = nextBooking(bookings, room.id);
  const rb = roomBookings(bookings, room.id);

  return (
    <div
      className="border border-[#003B00] p-3 text-xs"
      style={{
        background: "rgba(0, 59, 0, 0.1)",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="heading-font glow text-sm font-bold tracking-wide">
          {room.name.toUpperCase()}
        </span>
        <span
          className={`text-[10px] font-bold ${busy ? "glow-red" : "glow"}`}
        >
          <span className={busy ? "status-blink" : ""}>●</span>{" "}
          {busy ? "IN USE" : "AVAILABLE"}
        </span>
      </div>

      <pre className="glow mb-2 text-[10px] leading-tight">
        {`┌──────────────────────┐\n`}
        {`│ CAP: ${String(room.capacity).padEnd(2)} │ FLR: ${room.floor}     │\n`}
        {`│ BOOKINGS TODAY: ${String(rb.length).padEnd(4)}│\n`}
        {`└──────────────────────┘`}
      </pre>

      {current ? (
        <div className="glow-amber text-[10px]">
          NOW: {current.title.toUpperCase()}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{formatHour(current.startHour)}-
          {formatHour(current.endHour)}
        </div>
      ) : next ? (
        <div className="glow text-[10px]" style={{ color: "#00FFFF" }}>
          NEXT: {next.title.toUpperCase()}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{formatHour(next.startHour)}-
          {formatHour(next.endHour)}
        </div>
      ) : (
        <div className="text-[10px]" style={{ color: "#003B00" }}>
          NO UPCOMING SESSIONS
        </div>
      )}

      <div className="mt-2 text-[10px]" style={{ color: "#003B00" }}>
        [{room.amenities.map((a) => a.toUpperCase()).join("] [")}]
      </div>
    </div>
  );
}

// ---------- Timeline grid ----------

function TimelineGrid({
  bookings,
  onCellClick,
  onBookingClick,
}: {
  bookings: Booking[];
  onCellClick: (roomId: string, hour: number) => void;
  onBookingClick: (booking: Booking) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="glow border border-[#003B00] px-2 py-1 text-left text-xs font-normal">
              ROOM
            </th>
            {HOURS.map((h) => (
              <th
                key={h}
                className="glow border border-[#003B00] px-1 py-1 text-center font-normal whitespace-nowrap"
              >
                {h > 12 ? h - 12 : h}
                {h >= 12 ? "P" : "A"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROOMS.map((room) => {
            // track which hours are part of a multi-hour span so we skip them
            const spanned = new Set<number>();
            const cells: React.ReactNode[] = [];

            for (const h of HOURS) {
              if (spanned.has(h)) continue;

              const booking = bookingAt(bookings, room.id, h);
              if (booking && h === booking.startHour) {
                const span = booking.endHour - booking.startHour;
                for (let s = 1; s < span; s++) spanned.add(h + s);
                cells.push(
                  <td
                    key={h}
                    colSpan={span}
                    className="grid-cell grid-cell-booked cursor-pointer px-1 py-1 text-center"
                    onClick={() => onBookingClick(booking)}
                    title={`${booking.title} (${booking.organizer})`}
                  >
                    <div className="glow-amber truncate text-[10px] font-bold">
                      {booking.title.toUpperCase()}
                    </div>
                    <div className="text-[9px]" style={{ color: "#003B00" }}>
                      {booking.organizer}
                    </div>
                  </td>,
                );
              } else if (booking) {
                // mid-booking hour already spanned
                continue;
              } else {
                cells.push(
                  <td
                    key={h}
                    className="grid-cell px-1 py-1 text-center"
                    onClick={() => onCellClick(room.id, h)}
                  >
                    <span style={{ color: "#003B00" }}>·</span>
                  </td>,
                );
              }
            }

            return (
              <tr key={room.id}>
                <td className="glow border border-[#003B00] px-2 py-1 font-bold whitespace-nowrap">
                  {room.name.toUpperCase()}
                </td>
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Create booking modal ----------

function CreateModal({
  roomId,
  hour,
  onClose,
  onCreate,
}: {
  roomId: string;
  hour: number;
  onClose: () => void;
  onCreate: (booking: Omit<Booking, "id">) => void;
}) {
  const room = ROOMS.find((r) => r.id === roomId)!;
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [endHour, setEndHour] = useState(hour + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!title.trim() || !organizer.trim()) return;
    onCreate({
      roomId,
      title: title.trim(),
      organizer: organizer.trim(),
      startHour: hour,
      endHour,
      date: todayStr(),
    });
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg border border-[#00FF41] p-6"
        style={{
          background: "#0D0D0D",
          boxShadow: "0 0 30px rgba(0,255,65,0.2), inset 0 0 30px rgba(0,255,65,0.03)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="heading-font glow mb-4 text-sm font-bold tracking-wider">
          ┌─ NEW BOOKING ─────────────────────┐
        </div>

        <div className="glow mb-1 text-xs">
          ROOM: <span className="glow-cyan">{room.name.toUpperCase()}</span>
        </div>
        <div className="glow mb-4 text-xs">
          TIME: <span className="glow-amber">{formatHour(hour)}</span>
        </div>

        <div className="mb-3">
          <label className="glow mb-1 block text-xs">
            {"> "}ENTER MEETING TITLE:
          </label>
          <input
            ref={inputRef}
            className="terminal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="SPRINT_PLANNING"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="mb-3">
          <label className="glow mb-1 block text-xs">
            {"> "}ENTER ORGANIZER:
          </label>
          <input
            className="terminal-input"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="J.DOE"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="mb-4">
          <label className="glow mb-1 block text-xs">
            {"> "}END TIME:
          </label>
          <select
            className="terminal-input cursor-pointer"
            style={{ borderBottom: "1px solid #00FF41" }}
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
          >
            {HOURS.filter((h) => h > hour).map((h) => (
              <option
                key={h}
                value={h}
                style={{ background: "#0D0D0D", color: "#00FF41" }}
              >
                {formatHour(h)}
              </option>
            ))}
            <option
              value={18}
              style={{ background: "#0D0D0D", color: "#00FF41" }}
            >
              {formatHour(18)}
            </option>
          </select>
        </div>

        <div className="flex gap-3">
          <button className="terminal-btn" onClick={handleSubmit}>
            [CONFIRM]
          </button>
          <button className="terminal-btn-amber terminal-btn" onClick={onClose}>
            [CANCEL]
          </button>
        </div>

        <div className="heading-font glow mt-4 text-sm font-bold tracking-wider">
          └───────────────────────────────────┘
        </div>
      </div>
    </div>
  );
}

// ---------- View booking modal ----------

function ViewModal({
  booking,
  onClose,
  onDelete,
}: {
  booking: Booking;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const room = ROOMS.find((r) => r.id === booking.roomId)!;

  return (
    <div
      className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg border border-[#00FF41] p-6"
        style={{
          background: "#0D0D0D",
          boxShadow: "0 0 30px rgba(0,255,65,0.2), inset 0 0 30px rgba(0,255,65,0.03)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="heading-font glow mb-4 text-sm font-bold tracking-wider">
          ┌─ BOOKING RECORD ──────────────────┐
        </div>

        <pre className="glow mb-4 text-xs leading-relaxed">
{`> TITLE:     ${booking.title.toUpperCase()}
> ORGANIZER: ${booking.organizer.toUpperCase()}
> ROOM:      ${room.name.toUpperCase()}
> FLOOR:     ${room.floor}
> TIME:      ${formatHour(booking.startHour)} - ${formatHour(booking.endHour)}
> DATE:      ${booking.date}
> ID:        ${booking.id.toUpperCase()}`}
        </pre>

        <div className="flex gap-3">
          <button
            className="terminal-btn terminal-btn-red"
            onClick={() => onDelete(booking.id)}
          >
            [DELETE]
          </button>
          <button className="terminal-btn" onClick={onClose}>
            [CANCEL]
          </button>
        </div>

        <div className="heading-font glow mt-4 text-sm font-bold tracking-wider">
          └───────────────────────────────────┘
        </div>
      </div>
    </div>
  );
}

// ---------- Main component ----------

export default function Design4() {
  const [booted, setBooted] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [createModal, setCreateModal] = useState<{
    roomId: string;
    hour: number;
  } | null>(null);
  const [viewModal, setViewModal] = useState<Booking | null>(null);

  const handleCellClick = (roomId: string, hour: number) => {
    // Don't open if there's already a booking
    if (bookingAt(bookings, roomId, hour)) return;
    setCreateModal({ roomId, hour });
  };

  const handleCreate = (data: Omit<Booking, "id">) => {
    const id = `b${Date.now()}`;
    setBookings((prev) => [...prev, { ...data, id }]);
    setCreateModal(null);
  };

  const handleDelete = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setViewModal(null);
  };

  if (!booted) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CRT_STYLES }} />
        <BootSequence onDone={() => setBooted(true)} />
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CRT_STYLES }} />

      <div className="crt-screen min-h-screen select-none">
        {/* Status bar */}
        <StatusBar />

        <div className="mx-auto max-w-7xl p-4">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="heading-font glow mb-1 text-2xl font-black tracking-[0.2em]">
              ROOM ALLOCATION SYSTEM
            </h1>
            <p className="text-xs" style={{ color: "#003B00" }}>
              ═══════════════════════════════════════════════
            </p>
          </div>

          {/* Room panels */}
          <div className="mb-6">
            <div className="glow mb-2 text-xs font-bold">
              ┌─ ROOM STATUS ─────────────────────────────────────┐
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROOMS.map((room) => (
                <RoomPanel key={room.id} room={room} bookings={bookings} />
              ))}
            </div>
            <div className="glow mt-2 text-xs font-bold">
              └──────────────────────────────────────────────────┘
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="glow mb-2 text-xs font-bold">
              ┌─ TIMELINE [{todayDisplay()}] ──────────────────────────────┐
            </div>
            <TimelineGrid
              bookings={bookings}
              onCellClick={handleCellClick}
              onBookingClick={setViewModal}
            />
            <div className="glow mt-2 text-xs font-bold">
              └────────────────────────────────────────────────────────┘
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-[#003B00] pt-2 text-center text-[10px]" style={{ color: "#003B00" }}>
            ROOM_SYS v4.2.1 // NIJMEGEN STARTUP ROOMS // CLICK EMPTY CELL TO
            BOOK // CLICK BOOKING TO VIEW/DELETE
          </div>
        </div>

        {/* Modals */}
        {createModal && (
          <CreateModal
            roomId={createModal.roomId}
            hour={createModal.hour}
            onClose={() => setCreateModal(null)}
            onCreate={handleCreate}
          />
        )}
        {viewModal && (
          <ViewModal
            booking={viewModal}
            onClose={() => setViewModal(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </>
  );
}
