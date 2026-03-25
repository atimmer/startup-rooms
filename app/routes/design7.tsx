import { useState, useEffect, useRef } from "react";
import type { Route } from "./+types/design7";
import { ROOMS, INITIAL_BOOKINGS, HOURS, formatHour, type Booking } from "../data/rooms";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Meeting Rooms" },
    { name: "description", content: "Live room schedule for today." },
  ];
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
    href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap",
  },
];

/* ---------- constants ---------- */

const SIDEBAR_WIDTH = 200;
const HOUR_WIDTH = 140;
const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 48;
const ACCENT = "#6366F1";

const ROOM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  aurora: { bg: "#FFE4E6", border: "#F43F5E", text: "#9F1239" },
  nebula: { bg: "#E0F2FE", border: "#0EA5E9", text: "#0C4A6E" },
  zenith: { bg: "#FEF3C7", border: "#F59E0B", text: "#78350F" },
  cosmos: { bg: "#D1FAE5", border: "#10B981", text: "#064E3B" },
  prism: { bg: "#EDE9FE", border: "#8B5CF6", text: "#4C1D95" },
  vertex: { bg: "#F1F5F9", border: "#64748B", text: "#1E293B" },
};

function getColor(roomId: string) {
  return ROOM_COLORS[roomId] ?? { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" };
}

/* ---------- helpers ---------- */

function getTodayStr() {
  const d = new Date();
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentTimeOffset(): number | null {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const startHour = HOURS[0];
  const endHour = HOURS[HOURS.length - 1] + 1;
  if (h < startHour || h >= endHour) return null;
  return (h - startHour + m / 60) * HOUR_WIDTH;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------- modal types ---------- */

type ModalMode =
  | { kind: "create"; roomId: string; startHour: number }
  | { kind: "view"; booking: Booking }
  | null;

/* ---------- component ---------- */

export default function Design7() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [modal, setModal] = useState<ModalMode>(null);
  const [now, setNow] = useState(getCurrentTimeOffset);
  const [hoveredSlot, setHoveredSlot] = useState<{
    roomId: string;
    hour: number;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* form state */
  const [formTitle, setFormTitle] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [formStart, setFormStart] = useState(8);
  const [formEnd, setFormEnd] = useState(9);

  /* tick the clock every minute */
  useEffect(() => {
    const id = setInterval(() => {
      setNow(getCurrentTimeOffset());
    }, 60_000);

    return () => {
      clearInterval(id);
    };
  }, []);

  function openCreateModal(roomId: string, startHour: number) {
    setFormTitle("");
    setFormOrganizer("");
    setFormStart(startHour);
    setFormEnd(Math.min(startHour + 1, HOURS[HOURS.length - 1] + 1));
    setModal({ kind: "create", roomId, startHour });
  }

  function scrollToNow() {
    const offset = getCurrentTimeOffset();
    if (offset !== null && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: offset - scrollRef.current.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }

  function handleCreate() {
    if (!formTitle.trim() || !formOrganizer.trim()) return;
    if (modal?.kind !== "create") return;
    if (formEnd <= formStart) return;
    const newBooking: Booking = {
      id: `b-${String(Date.now())}`,
      roomId: modal.roomId,
      title: formTitle.trim(),
      organizer: formOrganizer.trim(),
      startHour: formStart,
      endHour: formEnd,
      date: getTodayStr(),
    };
    setBookings((prev) => [...prev, newBooking]);
    setModal(null);
  }

  function handleDelete(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setModal(null);
  }

  const todayStr = getTodayStr();
  const todaysBookings = bookings.filter((b) => b.date === todayStr);

  const totalWidth = HOURS.length * HOUR_WIDTH;

  return (
    <div
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      className="min-h-screen bg-white text-gray-900"
    >
      {/* ========== HEADER ========== */}
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <p className="text-sm font-medium text-gray-500">{formatDate()}</p>
        <h1 className="text-lg font-semibold tracking-tight text-gray-900">Room Schedule</h1>
        <button
          onClick={scrollToNow}
          className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          Now
        </button>
      </header>

      {/* ========== GANTT AREA ========== */}
      <div className="flex" style={{ height: "calc(100vh - 65px)" }}>
        {/* --- sidebar (room labels) --- */}
        <div className="shrink-0 border-r border-gray-200" style={{ width: SIDEBAR_WIDTH }}>
          {/* spacer for hour header */}
          <div className="border-b border-gray-200" style={{ height: HEADER_HEIGHT }} />
          {ROOMS.map((room) => {
            const color = getColor(room.id);
            return (
              <div
                key={room.id}
                className="flex items-center gap-3 border-b border-gray-100 px-4"
                style={{ height: ROW_HEIGHT }}
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color.border }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{room.name}</p>
                  <p className="text-xs text-gray-400">
                    {room.capacity} seats &middot; Floor {room.floor}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- scrollable timeline --- */}
        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ width: totalWidth, position: "relative" }}>
            {/* hour headers */}
            <div className="flex border-b border-gray-200" style={{ height: HEADER_HEIGHT }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="shrink-0 border-l border-gray-100 px-3 py-2 text-xs font-medium text-gray-400"
                  style={{ width: HOUR_WIDTH }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* room rows */}
            {ROOMS.map((room) => {
              const roomBookings = todaysBookings.filter((b) => b.roomId === room.id);
              const color = getColor(room.id);

              return (
                <div
                  key={room.id}
                  className="relative border-b border-gray-50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* vertical grid lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 border-l border-gray-100"
                      style={{ left: (h - HOURS[0]) * HOUR_WIDTH }}
                    />
                  ))}

                  {/* clickable empty slots — one per hour */}
                  {HOURS.map((h) => {
                    const occupied = roomBookings.some((b) => h >= b.startHour && h < b.endHour);
                    if (occupied) return null;
                    const isHovered =
                      hoveredSlot !== null &&
                      hoveredSlot.roomId === room.id &&
                      hoveredSlot.hour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        className="absolute top-1 bottom-1 cursor-pointer transition-colors"
                        style={{
                          left: (h - HOURS[0]) * HOUR_WIDTH + 1,
                          width: HOUR_WIDTH - 2,
                          borderRadius: 6,
                          backgroundColor: isHovered ? "rgba(99,102,241,0.06)" : "transparent",
                        }}
                        aria-label={`Create booking for ${room.name} at ${formatHour(h)}`}
                        onMouseEnter={() => {
                          setHoveredSlot({ roomId: room.id, hour: h });
                        }}
                        onMouseLeave={() => {
                          setHoveredSlot(null);
                        }}
                        onClick={() => {
                          openCreateModal(room.id, h);
                        }}
                      >
                        {isHovered && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-indigo-400">
                            {formatHour(h)}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* booking blocks */}
                  {roomBookings.map((b) => {
                    const left = (b.startHour - HOURS[0]) * HOUR_WIDTH;
                    const width = (b.endHour - b.startHour) * HOUR_WIDTH;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className="absolute top-1.5 bottom-1.5 flex cursor-pointer items-center overflow-hidden rounded-lg px-3 transition-shadow hover:shadow-md"
                        style={{
                          left,
                          width,
                          backgroundColor: color.bg,
                          borderLeft: `3px solid ${color.border}`,
                        }}
                        aria-label={`View booking ${b.title} in ${room.name}`}
                        onClick={() => {
                          setModal({ kind: "view", booking: b });
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold leading-tight"
                            style={{ color: color.text }}
                          >
                            {b.title}
                          </p>
                          <p
                            className="truncate text-xs"
                            style={{ color: color.text, opacity: 0.7 }}
                          >
                            {b.organizer}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* current time indicator */}
            {now !== null && (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: now,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  height: HEADER_HEIGHT + ROOMS.length * ROW_HEIGHT,
                  backgroundColor: "#EF4444",
                  zIndex: 20,
                }}
              >
                <div
                  className="absolute -top-1 -left-1.5 h-3 w-3 rounded-full"
                  style={{ backgroundColor: "#EF4444" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== MODAL ========== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={() => {
              setModal(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            aria-labelledby={
              modal.kind === "create" ? "booking-dialog-title" : "booking-view-title"
            }
            style={{ fontFamily: "'Source Sans 3', sans-serif", zIndex: 1 }}
          >
            {modal.kind === "create" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCreate();
                }}
              >
                <h2 id="booking-dialog-title" className="mb-1 text-lg font-semibold text-gray-900">
                  New Booking
                </h2>
                <p className="mb-5 text-sm text-gray-400">
                  {ROOMS.find((r) => r.id === modal.roomId)?.name} &middot; {formatDate()}
                </p>

                <label
                  className="mb-1 block text-sm font-medium text-gray-600"
                  htmlFor="booking-title"
                >
                  Title
                </label>
                <input
                  id="booking-title"
                  type="text"
                  className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                  }}
                  placeholder="Meeting title"
                />

                <label
                  className="mb-1 block text-sm font-medium text-gray-600"
                  htmlFor="booking-organizer"
                >
                  Organizer
                </label>
                <input
                  id="booking-organizer"
                  type="text"
                  className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  value={formOrganizer}
                  onChange={(e) => {
                    setFormOrganizer(e.target.value);
                  }}
                  placeholder="Your name"
                />

                <div className="mb-5 flex gap-4">
                  <div className="flex-1">
                    <label
                      className="mb-1 block text-sm font-medium text-gray-600"
                      htmlFor="booking-start"
                    >
                      Start
                    </label>
                    <select
                      id="booking-start"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      value={formStart}
                      onChange={(e) => {
                        setFormStart(Number(e.target.value));
                      }}
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label
                      className="mb-1 block text-sm font-medium text-gray-600"
                      htmlFor="booking-end"
                    >
                      End
                    </label>
                    <select
                      id="booking-end"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      value={formEnd}
                      onChange={(e) => {
                        setFormEnd(Number(e.target.value));
                      }}
                    >
                      {HOURS.map((h) => h + 1)
                        .filter((h) => h > formStart)
                        .map((h) => (
                          <option key={h} value={h}>
                            {formatHour(h)}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModal(null);
                    }}
                    className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Book Room
                  </button>
                </div>
              </form>
            )}

            {modal.kind === "view" && (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 id="booking-view-title" className="text-lg font-semibold text-gray-900">
                      {modal.booking.title}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {ROOMS.find((r) => r.id === modal.booking.roomId)?.name} &middot;{" "}
                      {formatHour(modal.booking.startHour)} &ndash;{" "}
                      {formatHour(modal.booking.endHour)}
                    </p>
                  </div>
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: getColor(modal.booking.roomId).border }}
                  />
                </div>

                <div
                  className="mb-5 rounded-lg p-3"
                  style={{ backgroundColor: getColor(modal.booking.roomId).bg }}
                >
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Organizer:</span> {modal.booking.organizer}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Duration:</span>{" "}
                    {String(modal.booking.endHour - modal.booking.startHour)}h
                  </p>
                  {(() => {
                    const room = ROOMS.find((r) => r.id === modal.booking.roomId);

                    if (!room) {
                      return null;
                    }

                    return (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Room:</span> {room.name} (
                        {String(room.capacity)} seats, Floor {String(room.floor)})
                      </p>
                    );
                  })()}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModal(null);
                    }}
                    className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(modal.booking.id);
                    }}
                    className="cursor-pointer rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                  >
                    Delete Booking
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
