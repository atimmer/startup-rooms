import { useState, useEffect } from "react";
import type { Route } from "./+types/design5";
import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Room Schedule \u2014 Editorial" }];
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
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap",
  },
];

const ACCENT = "#FF2D2D";
const GRAY_FILL = "#F0F0F0";
const BORDER = "#000000";
const CELL_HEIGHT = 64;

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isCurrentHour(hour: number) {
  return new Date().getHours() === hour;
}

function isRoomOccupiedNow(roomId: string, bookings: Booking[]) {
  const now = new Date();
  const h = now.getHours();
  const today = getTodayStr();
  return bookings.some(
    (b) =>
      b.roomId === roomId &&
      b.date === today &&
      h >= b.startHour &&
      h < b.endHour,
  );
}

function currentTimePosition(): number | null {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const firstHour = HOURS[0];
  const lastHour = HOURS[HOURS.length - 1];
  if (h < firstHour || h > lastHour) return null;
  return (h - firstHour + m / 60) * CELL_HEIGHT;
}

const serif: React.CSSProperties = { fontFamily: "'Instrument Serif', serif" };
const sans: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

export default function Design5() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "view">("create");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedHour, setSelectedHour] = useState(8);
  const [formTitle, setFormTitle] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [formEnd, setFormEnd] = useState(9);
  const [timePos, setTimePos] = useState<number | null>(currentTimePosition());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimePos(currentTimePosition());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const dayNum = String(today.getDate()).padStart(2, "0");
  const monthStr = today
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const yearStr = String(today.getFullYear());

  function getBooking(roomId: string, hour: number): Booking | undefined {
    return bookings.find(
      (b) =>
        b.roomId === roomId &&
        b.date === getTodayStr() &&
        hour >= b.startHour &&
        hour < b.endHour,
    );
  }

  function isBookingStart(roomId: string, hour: number): boolean {
    return bookings.some(
      (b) =>
        b.roomId === roomId && b.date === getTodayStr() && b.startHour === hour,
    );
  }

  function getBookingSpan(booking: Booking): number {
    return booking.endHour - booking.startHour;
  }

  function openCreateModal(roomId: string, hour: number) {
    setModalMode("create");
    setSelectedRoom(roomId);
    setSelectedHour(hour);
    setFormEnd(hour + 1);
    setFormTitle("");
    setFormOrganizer("");
    setSelectedBooking(null);
    setShowModal(true);
  }

  function openViewModal(booking: Booking) {
    setModalMode("view");
    setSelectedBooking(booking);
    setShowModal(true);
  }

  function handleCreate() {
    if (!formTitle.trim() || !formOrganizer.trim()) return;
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      roomId: selectedRoom,
      title: formTitle,
      organizer: formOrganizer,
      startHour: selectedHour,
      endHour: formEnd,
      date: getTodayStr(),
    };
    setBookings((prev) => [...prev, newBooking]);
    setShowModal(false);
  }

  function handleDelete() {
    if (!selectedBooking) return;
    setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
    setShowModal(false);
  }

  const roomName = (id: string) => ROOMS.find((r) => r.id === id)?.name ?? id;

  return (
    <div
      style={{
        ...sans,
        background: "#FFFFFF",
        color: "#000000",
        minHeight: "100vh",
      }}
      className={`transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
    >
      {/* ── TOP RULE ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "48px 48px 40px",
            display: "grid",
            gridTemplateColumns: "70fr 30fr",
            gap: 48,
          }}
        >
          {/* HEADER LEFT */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
            <span
              style={{
                ...serif,
                fontSize: 200,
                lineHeight: 0.82,
                letterSpacing: "-0.04em",
              }}
            >
              {dayNum}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  ...serif,
                  fontSize: 48,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {monthStr}
              </span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#999",
                  marginTop: 4,
                }}
              >
                {yearStr}
              </span>
            </div>
            <div
              style={{
                marginLeft: "auto",
                paddingBottom: 8,
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#999",
                }}
              >
                Nijmegen Startup Rooms
              </div>
              <div
                style={{
                  ...serif,
                  fontSize: 28,
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                Room Schedule
              </div>
            </div>
          </div>

          {/* HEADER RIGHT */}
          <div
            style={{
              borderLeft: `1px solid ${BORDER}`,
              paddingLeft: 32,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              paddingBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#999",
              }}
            >
              Directory
            </span>
            <span style={{ ...serif, fontSize: 24, marginTop: 4 }}>
              {ROOMS.length} Rooms
            </span>
            <span style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
              {bookings.filter((b) => b.date === getTodayStr()).length} bookings
              today
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "70fr 30fr",
        }}
      >
        {/* ── LEFT: SCHEDULE GRID ── */}
        <div style={{ borderRight: `1px solid ${BORDER}`, padding: "0 48px" }}>
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `72px repeat(${ROOMS.length}, 1fr)`,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ padding: "16px 0" }} />
            {ROOMS.map((room) => (
              <div
                key={room.id}
                style={{
                  padding: "16px 8px",
                  borderLeft: `1px solid ${BORDER}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {room.name}
                </div>
                <div
                  style={{ fontSize: 10, color: "#999", marginTop: 2 }}
                >
                  {room.capacity} seats
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div style={{ position: "relative" }}>
            {/* Current time indicator */}
            {timePos !== null && (
              <div
                style={{
                  position: "absolute",
                  top: timePos,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: ACCENT,
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -4,
                    width: 8,
                    height: 8,
                    background: ACCENT,
                    borderRadius: "50%",
                  }}
                />
              </div>
            )}

            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{
                  display: "grid",
                  gridTemplateColumns: `72px repeat(${ROOMS.length}, 1fr)`,
                  borderBottom: "1px solid #E0E0E0",
                  height: CELL_HEIGHT,
                }}
              >
                {/* Hour label */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    paddingTop: 6,
                    paddingRight: 12,
                    justifyContent: "flex-end",
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {String(hour).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "#999",
                      marginLeft: 3,
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {hour < 12 ? "am" : "pm"}
                  </span>
                </div>

                {/* Room cells */}
                {ROOMS.map((room) => {
                  const booking = getBooking(room.id, hour);
                  const isStart = booking && isBookingStart(room.id, hour);
                  const isCurrent =
                    booking && isCurrentHour(hour) && booking.date === getTodayStr();

                  if (booking && !isStart) {
                    // Part of a multi-hour booking, skip rendering
                    return (
                      <div
                        key={room.id}
                        style={{ borderLeft: `1px solid ${BORDER}` }}
                      />
                    );
                  }

                  if (booking && isStart) {
                    const span = getBookingSpan(booking);
                    return (
                      <div
                        key={room.id}
                        style={{
                          borderLeft: `1px solid ${BORDER}`,
                          position: "relative",
                          cursor: "pointer",
                        }}
                        onClick={() => openViewModal(booking)}
                        className="group"
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 2,
                            height: span * CELL_HEIGHT - 4,
                            background: GRAY_FILL,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            padding: "4px 10px",
                            zIndex: 10,
                            borderLeft: isCurrent
                              ? `3px solid ${ACCENT}`
                              : "none",
                            transition: "background 0.15s",
                          }}
                          className="group-hover:!bg-[#E8E8E8]"
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {booking.title}
                          </div>
                          <div
                            style={{ fontSize: 10, color: "#666", marginTop: 1 }}
                          >
                            {booking.organizer}
                          </div>
                          <div
                            style={{ fontSize: 9, color: "#999", marginTop: 1 }}
                          >
                            {formatHour(booking.startHour)} &ndash;{" "}
                            {formatHour(booking.endHour)}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Empty cell
                  return (
                    <div
                      key={room.id}
                      style={{
                        borderLeft: `1px solid ${BORDER}`,
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      className="hover:bg-[#FAFAFA]"
                      onClick={() => openCreateModal(room.id, hour)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom label */}
          <div
            style={{
              padding: "16px 0",
              borderTop: `1px solid ${BORDER}`,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#999",
              }}
            >
              Schedule &mdash; {ROOMS.length} rooms &times; {HOURS.length} hours
            </span>
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#999",
              }}
            >
              Click to book
            </span>
          </div>
        </div>

        {/* ── RIGHT: SIDEBAR ── */}
        <div style={{ padding: "0 48px" }}>
          <div
            style={{
              padding: "16px 0",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#999",
              }}
            >
              Room Directory
            </span>
          </div>

          {ROOMS.map((room, i) => {
            const occupied = isRoomOccupiedNow(room.id, bookings);
            const roomBookings = bookings.filter(
              (b) => b.roomId === room.id && b.date === getTodayStr(),
            );
            return (
              <div
                key={room.id}
                style={{
                  padding: "20px 0",
                  borderBottom:
                    i < ROOMS.length - 1 ? "1px solid #E0E0E0" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      ...serif,
                      fontSize: 22,
                      lineHeight: 1,
                    }}
                  >
                    {room.name}
                  </span>
                  {occupied && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: ACCENT,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      fontSize: 11,
                      color: "#666",
                    }}
                  >
                    <span>
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#999",
                        }}
                      >
                        Floor
                      </span>{" "}
                      {room.floor}
                    </span>
                    <span>
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#999",
                        }}
                      >
                        Cap.
                      </span>{" "}
                      {room.capacity}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {room.amenities.map((a) => (
                    <span
                      key={a}
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#999",
                        border: "1px solid #DDD",
                        padding: "2px 6px",
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
                {roomBookings.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {roomBookings.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          fontSize: 11,
                          color: "#444",
                          lineHeight: 1.8,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <span style={{ color: "#999", fontVariantNumeric: "tabular-nums" }}>
                          {String(b.startHour).padStart(2, "0")}&ndash;
                          {String(b.endHour).padStart(2, "0")}
                        </span>
                        <span>{b.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer info */}
          <div style={{ padding: "24px 0", borderTop: `1px solid ${BORDER}` }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#999",
                lineHeight: 2,
              }}
            >
              Total capacity: {ROOMS.reduce((s, r) => s + r.capacity, 0)} seats
              <br />
              Floors: 1&ndash;3
              <br />
              Hours: {formatHour(HOURS[0])} &ndash;{" "}
              {formatHour(HOURS[HOURS.length - 1] + 1)}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM RULE ── */}
      <div
        style={{
          borderTop: `1px solid ${BORDER}`,
          maxWidth: 1440,
          margin: "0 auto",
          padding: "16px 48px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#999",
          }}
        >
          Swiss Editorial System
        </span>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#999",
          }}
        >
          {yearStr}
        </span>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: `1px solid ${BORDER}`,
              width: 420,
              maxWidth: "90vw",
              padding: 0,
              ...sans,
            }}
            className="animate-[fadeIn_0.15s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {modalMode === "create" ? (
              <>
                {/* Create modal header */}
                <div
                  style={{
                    padding: "24px 32px 16px",
                    borderBottom: "1px solid #E0E0E0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "#999",
                    }}
                  >
                    New Booking
                  </div>
                  <div
                    style={{
                      ...serif,
                      fontSize: 28,
                      marginTop: 4,
                    }}
                  >
                    {roomName(selectedRoom)}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {formatHour(selectedHour)} &mdash; {dayNum} {monthStr}{" "}
                    {yearStr}
                  </div>
                </div>

                {/* Form */}
                <div style={{ padding: "24px 32px" }}>
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#999",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderBottom: `1px solid ${BORDER}`,
                        padding: "8px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        ...sans,
                      }}
                      placeholder="e.g. Sprint Planning"
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#999",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Organizer
                    </label>
                    <input
                      type="text"
                      value={formOrganizer}
                      onChange={(e) => setFormOrganizer(e.target.value)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderBottom: `1px solid ${BORDER}`,
                        padding: "8px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        ...sans,
                      }}
                      placeholder="Your name"
                    />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#999",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      End Time
                    </label>
                    <select
                      value={formEnd}
                      onChange={(e) => setFormEnd(Number(e.target.value))}
                      style={{
                        border: "none",
                        borderBottom: `1px solid ${BORDER}`,
                        padding: "8px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        cursor: "pointer",
                        ...sans,
                      }}
                    >
                      {HOURS.filter((h) => h > selectedHour).map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                      <option value={HOURS[HOURS.length - 1] + 1}>
                        {formatHour(HOURS[HOURS.length - 1] + 1)}
                      </option>
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => setShowModal(false)}
                      style={{
                        background: "none",
                        border: `1px solid ${BORDER}`,
                        padding: "10px 24px",
                        fontSize: 11,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        ...sans,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      style={{
                        background: ACCENT,
                        color: "#FFFFFF",
                        border: "none",
                        padding: "10px 24px",
                        fontSize: 11,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        ...sans,
                        fontWeight: 600,
                      }}
                    >
                      Book Room
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* View modal */}
                <div
                  style={{
                    padding: "24px 32px 16px",
                    borderBottom: "1px solid #E0E0E0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "#999",
                    }}
                  >
                    Booking Details
                  </div>
                  <div
                    style={{
                      ...serif,
                      fontSize: 28,
                      marginTop: 4,
                    }}
                  >
                    {selectedBooking?.title}
                  </div>
                </div>

                <div style={{ padding: "24px 32px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 20,
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "#999",
                          marginBottom: 4,
                        }}
                      >
                        Room
                      </div>
                      <div style={{ fontSize: 14 }}>
                        {roomName(selectedBooking?.roomId ?? "")}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "#999",
                          marginBottom: 4,
                        }}
                      >
                        Organizer
                      </div>
                      <div style={{ fontSize: 14 }}>
                        {selectedBooking?.organizer}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "#999",
                          marginBottom: 4,
                        }}
                      >
                        Time
                      </div>
                      <div style={{ fontSize: 14 }}>
                        {selectedBooking &&
                          `${formatHour(selectedBooking.startHour)} \u2013 ${formatHour(selectedBooking.endHour)}`}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "#999",
                          marginBottom: 4,
                        }}
                      >
                        Date
                      </div>
                      <div style={{ fontSize: 14 }}>
                        {dayNum} {monthStr} {yearStr}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => setShowModal(false)}
                      style={{
                        background: "none",
                        border: `1px solid ${BORDER}`,
                        padding: "10px 24px",
                        fontSize: 11,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        ...sans,
                      }}
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDelete}
                      style={{
                        background: ACCENT,
                        color: "#FFFFFF",
                        border: "none",
                        padding: "10px 24px",
                        fontSize: 11,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        ...sans,
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Keyframe for modal fade-in */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
