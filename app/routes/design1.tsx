import { useState, useMemo } from "react";

import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";
import type { Route } from "./+types/design1";

// ---------------------------------------------------------------------------
// Route meta & links
// ---------------------------------------------------------------------------

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ROOMS — Brutalist" }];
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
    href: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap",
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLOT_HEIGHT = 64; // px per hour slot
const ROOM_COL_WIDTH = 180; // px – room label column
const RED = "#FF0000";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const CONCRETE_BG = "#E8E4DF";
const CONCRETE_DARK = "#B0AAA0";

const FONT_MONO = "'Space Mono', monospace";
const FONT_DISPLAY = "'Bebas Neue', sans-serif";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function bookingId(): string {
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Modal types
// ---------------------------------------------------------------------------

interface BookingModalState {
  mode: "create";
  roomId: string;
  startHour: number;
}

interface DetailModalState {
  mode: "detail";
  booking: Booking;
}

type ModalState = BookingModalState | DetailModalState | null;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConcreteNoise() {
  // CSS-only concrete texture overlay
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background: `
          repeating-conic-gradient(${CONCRETE_DARK}22 0% 25%, transparent 0% 50%) 0 0 / 4px 4px,
          linear-gradient(170deg, ${CONCRETE_BG} 0%, #D5D0C8 40%, ${CONCRETE_BG} 70%, #CDC7BD 100%)
        `,
        opacity: 1,
      }}
    />
  );
}

function CurrentTimeLine({ startHour }: { startHour: number }) {
  const now = currentHourFraction();
  const first = HOURS[0];
  const last = HOURS[HOURS.length - 1] + 1;
  if (now < first || now > last) return null;
  const pct = ((now - first) / (last - first)) * 100;
  return (
    <div
      aria-label="Current time"
      style={{
        position: "absolute",
        top: `${pct}%`,
        left: 0,
        right: 0,
        height: 3,
        background: RED,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -6,
          top: -5,
          width: 12,
          height: 12,
          background: RED,
          border: `2px solid ${BLACK}`,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Design1() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [modal, setModal] = useState<ModalState>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");

  const today = useMemo(getTodayStr, []);

  // Bookings lookup: roomId -> hour -> Booking
  const bookingMap = useMemo(() => {
    const map = new Map<string, Map<number, Booking>>();
    for (const b of bookings) {
      if (b.date !== today) continue;
      if (!map.has(b.roomId)) map.set(b.roomId, new Map());
      const roomMap = map.get(b.roomId)!;
      for (let h = b.startHour; h < b.endHour; h++) {
        roomMap.set(h, b);
      }
    }
    return map;
  }, [bookings, today]);

  // Handlers
  function openCreate(roomId: string, startHour: number) {
    setFormTitle("");
    setFormOrganizer("");
    setModal({ mode: "create", roomId, startHour });
  }

  function openDetail(booking: Booking) {
    setModal({ mode: "detail", booking });
  }

  function handleCreate() {
    if (!modal || modal.mode !== "create") return;
    if (!formTitle.trim() || !formOrganizer.trim()) return;
    const newBooking: Booking = {
      id: bookingId(),
      roomId: modal.roomId,
      title: formTitle.trim(),
      organizer: formOrganizer.trim(),
      startHour: modal.startHour,
      endHour: modal.startHour + 1,
      date: today,
    };
    setBookings((prev) => [...prev, newBooking]);
    setModal(null);
  }

  function handleDelete(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setModal(null);
  }

  function closeModal() {
    setModal(null);
  }

  function roomById(id: string): Room | undefined {
    return ROOMS.find((r) => r.id === id);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        color: BLACK,
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ConcreteNoise />

      {/* ---- HEADER ---- */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          borderBottom: `6px solid ${BLACK}`,
          padding: "48px 32px 24px",
          background: `linear-gradient(135deg, ${CONCRETE_BG} 0%, #CDC7BD 100%)`,
        }}
      >
        {/* Decorative rotated label */}
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 40,
            fontFamily: FONT_MONO,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            transform: "rotate(-90deg)",
            transformOrigin: "top right",
            color: CONCRETE_DARK,
          }}
        >
          NIJMEGEN STARTUP ROOMS / {today}
        </div>

        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(72px, 12vw, 160px)",
            lineHeight: 0.9,
            letterSpacing: -2,
            margin: 0,
            color: BLACK,
          }}
        >
          BOOK A ROOM
        </h1>

        {/* Overlapping red block */}
        <div
          style={{
            display: "inline-block",
            background: RED,
            color: WHITE,
            fontFamily: FONT_MONO,
            fontSize: 14,
            fontWeight: 700,
            padding: "8px 20px",
            marginTop: -8,
            border: `3px solid ${BLACK}`,
            position: "relative",
            zIndex: 2,
          }}
        >
          {ROOMS.length} ROOMS AVAILABLE — TODAY
        </div>

        {/* Decorative thick line */}
        <div
          style={{
            width: 120,
            height: 8,
            background: BLACK,
            marginTop: 16,
          }}
        />
      </header>

      {/* ---- ROOM LABELS (rotated, overlapping) ---- */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          gap: 0,
          borderBottom: `4px solid ${BLACK}`,
          background: `linear-gradient(180deg, #D5D0C8 0%, ${CONCRETE_BG} 100%)`,
          overflow: "hidden",
        }}
      >
        {ROOMS.map((room, i) => (
          <div
            key={room.id}
            style={{
              flex: 1,
              borderRight: i < ROOMS.length - 1 ? `3px solid ${BLACK}` : "none",
              padding: "20px 12px 32px",
              position: "relative",
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(28px, 4vw, 52px)",
                display: "block",
                transform: `rotate(-${3 + (i % 4) * 2}deg)`,
                transformOrigin: "bottom left",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {room.name.toUpperCase()}
            </span>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                fontWeight: 700,
                marginTop: 8,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: CONCRETE_DARK,
              }}
            >
              FL{room.floor} / {room.capacity}P
            </div>
            {/* Amenity tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {room.amenities.slice(0, 2).map((a) => (
                <span
                  key={a}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: FONT_MONO,
                    border: `2px solid ${BLACK}`,
                    padding: "1px 5px",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ---- TIMELINE GRID ---- */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          borderBottom: `4px solid ${BLACK}`,
        }}
      >
        {/* Time labels column */}
        <div
          style={{
            width: ROOM_COL_WIDTH,
            minWidth: ROOM_COL_WIDTH,
            borderRight: `4px solid ${BLACK}`,
            background: BLACK,
            color: WHITE,
          }}
        >
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{
                height: SLOT_HEIGHT,
                borderBottom: `2px solid ${WHITE}22`,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                padding: "4px 12px 0 0",
                fontFamily: FONT_DISPLAY,
                fontSize: 28,
                lineHeight: 1,
                letterSpacing: 1,
              }}
            >
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Room columns */}
        <div style={{ flex: 1, display: "flex", position: "relative" }}>
          {/* Current time indicator */}
          <CurrentTimeLine startHour={HOURS[0]} />

          {ROOMS.map((room, roomIdx) => {
            // Find bookings that START in each hour (for rendering blocks)
            const roomBookings = bookings.filter(
              (b) => b.roomId === room.id && b.date === today,
            );
            const startHours = new Set(roomBookings.map((b) => b.startHour));

            return (
              <div
                key={room.id}
                style={{
                  flex: 1,
                  position: "relative",
                  borderRight:
                    roomIdx < ROOMS.length - 1
                      ? `3px solid ${BLACK}`
                      : "none",
                }}
              >
                {HOURS.map((hour) => {
                  const booked = bookingMap.get(room.id)?.get(hour);
                  const isBookingStart = booked && booked.startHour === hour;
                  const isBookingContinuation = booked && booked.startHour !== hour;

                  // If this is a continuation of a multi-hour booking, render empty (the block covers it)
                  if (isBookingContinuation) {
                    return (
                      <div
                        key={hour}
                        style={{
                          height: SLOT_HEIGHT,
                          borderBottom: `2px solid ${BLACK}33`,
                        }}
                      />
                    );
                  }

                  // Booking block
                  if (isBookingStart && booked) {
                    const span = booked.endHour - booked.startHour;
                    return (
                      <div
                        key={hour}
                        style={{
                          height: SLOT_HEIGHT,
                          borderBottom: `2px solid ${BLACK}33`,
                          position: "relative",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openDetail(booked)}
                          style={{
                            position: "absolute",
                            top: 2,
                            left: 2,
                            right: 2,
                            height: SLOT_HEIGHT * span - 4,
                            background: BLACK,
                            color: WHITE,
                            border: `3px solid ${RED}`,
                            padding: "4px 8px",
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            fontWeight: 700,
                            textAlign: "left",
                            cursor: "pointer",
                            zIndex: 10,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            transition: "background 0.15s, color 0.15s",
                            lineHeight: 1.3,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = RED;
                            e.currentTarget.style.color = WHITE;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = BLACK;
                            e.currentTarget.style.color = WHITE;
                          }}
                        >
                          <span
                            style={{
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {booked.title}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              opacity: 0.7,
                              marginTop: 2,
                            }}
                          >
                            {booked.organizer}
                          </span>
                        </button>
                      </div>
                    );
                  }

                  // Empty slot – clickable
                  return (
                    <div
                      key={hour}
                      style={{
                        height: SLOT_HEIGHT,
                        borderBottom: `2px solid ${BLACK}33`,
                        position: "relative",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openCreate(room.id, hour)}
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "transparent",
                          border: "none",
                          cursor: "crosshair",
                          fontFamily: FONT_MONO,
                          fontSize: 0,
                          color: "transparent",
                          transition: "background 0.1s, color 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${RED}15`;
                          e.currentTarget.style.fontSize = "10px";
                          e.currentTarget.style.color = RED;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.fontSize = "0";
                          e.currentTarget.style.color = "transparent";
                        }}
                        aria-label={`Book ${room.name} at ${formatHour(hour)}`}
                      >
                        + BOOK
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: BLACK,
          color: WHITE,
          fontFamily: FONT_MONO,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        <span>BRUTALIST ROOM SYSTEM V1.0</span>
        <span style={{ color: RED }}>
          {bookings.filter((b) => b.date === today).length} BOOKINGS TODAY
        </span>
        <span>{today}</span>
      </footer>

      {/* ---- MODAL OVERLAY ---- */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${BLACK}E6`,
          }}
        >
          {/* Backdrop click */}
          <div
            style={{ position: "absolute", inset: 0 }}
            onClick={closeModal}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeModal();
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close modal"
          />

          {/* Modal panel */}
          <div
            style={{
              position: "relative",
              background: WHITE,
              border: `6px solid ${BLACK}`,
              width: "90%",
              maxWidth: 480,
              fontFamily: FONT_MONO,
              boxShadow: `12px 12px 0 ${RED}`,
            }}
          >
            {/* Modal header */}
            <div
              style={{
                background: BLACK,
                color: WHITE,
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 32,
                  letterSpacing: 2,
                }}
              >
                {modal.mode === "create" ? "NEW BOOKING" : "BOOKING DETAIL"}
              </span>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: `2px solid ${WHITE}`,
                  color: WHITE,
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "4px 12px",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = RED;
                  e.currentTarget.style.borderColor = RED;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = WHITE;
                }}
              >
                X
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 24 }}>
              {modal.mode === "create" && (
                <CreateForm
                  room={roomById(modal.roomId)}
                  startHour={modal.startHour}
                  formTitle={formTitle}
                  setFormTitle={setFormTitle}
                  formOrganizer={formOrganizer}
                  setFormOrganizer={setFormOrganizer}
                  onCreate={handleCreate}
                />
              )}

              {modal.mode === "detail" && (
                <DetailView
                  booking={modal.booking}
                  room={roomById(modal.booking.roomId)}
                  onDelete={() => handleDelete(modal.booking.id)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

interface CreateFormProps {
  room: Room | undefined;
  startHour: number;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formOrganizer: string;
  setFormOrganizer: (v: string) => void;
  onCreate: () => void;
}

function CreateForm({
  room,
  startHour,
  formTitle,
  setFormTitle,
  formOrganizer,
  setFormOrganizer,
  onCreate,
}: CreateFormProps) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `3px solid ${BLACK}`,
    padding: "10px 12px",
    fontFamily: FONT_MONO,
    fontSize: 14,
    fontWeight: 700,
    background: WHITE,
    color: BLACK,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 6,
    color: CONCRETE_DARK,
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate();
      }}
    >
      {/* Room name (read-only) */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>ROOM</label>
        <div
          style={{
            ...inputStyle,
            background: `${CONCRETE_BG}`,
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            letterSpacing: 2,
            padding: "8px 12px",
          }}
        >
          {room?.name.toUpperCase() ?? "UNKNOWN"}
        </div>
      </div>

      {/* Time slot (read-only) */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>TIME SLOT</label>
        <div
          style={{
            ...inputStyle,
            background: `${CONCRETE_BG}`,
          }}
        >
          {formatHour(startHour)} — {formatHour(startHour + 1)}
        </div>
      </div>

      {/* Meeting title */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>MEETING TITLE</label>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="ENTER TITLE"
          required
          style={inputStyle}
        />
      </div>

      {/* Organizer */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>ORGANIZER</label>
        <input
          type="text"
          value={formOrganizer}
          onChange={(e) => setFormOrganizer(e.target.value)}
          placeholder="YOUR NAME"
          required
          style={inputStyle}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        style={{
          width: "100%",
          background: BLACK,
          color: WHITE,
          border: `3px solid ${BLACK}`,
          padding: "14px 0",
          fontFamily: FONT_DISPLAY,
          fontSize: 28,
          letterSpacing: 4,
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = RED;
          e.currentTarget.style.borderColor = RED;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = BLACK;
          e.currentTarget.style.borderColor = BLACK;
        }}
      >
        CONFIRM BOOKING
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------

interface DetailViewProps {
  booking: Booking;
  room: Room | undefined;
  onDelete: () => void;
}

function DetailView({ booking, room, onDelete }: DetailViewProps) {
  const rowStyle: React.CSSProperties = {
    display: "flex",
    borderBottom: `2px solid ${BLACK}22`,
    padding: "10px 0",
  };

  const labelStyle: React.CSSProperties = {
    width: 100,
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: CONCRETE_DARK,
    flexShrink: 0,
    paddingTop: 3,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: FONT_MONO,
    fontSize: 14,
    fontWeight: 700,
  };

  return (
    <div>
      <div style={rowStyle}>
        <span style={labelStyle}>ROOM</span>
        <span
          style={{
            ...valueStyle,
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            letterSpacing: 2,
          }}
        >
          {room?.name.toUpperCase() ?? "UNKNOWN"}
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>TIME</span>
        <span style={valueStyle}>
          {formatHour(booking.startHour)} — {formatHour(booking.endHour)}
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>TITLE</span>
        <span style={valueStyle}>{booking.title.toUpperCase()}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>BY</span>
        <span style={valueStyle}>{booking.organizer}</span>
      </div>

      <button
        type="button"
        onClick={onDelete}
        style={{
          width: "100%",
          marginTop: 24,
          background: RED,
          color: WHITE,
          border: `3px solid ${BLACK}`,
          padding: "14px 0",
          fontFamily: FONT_DISPLAY,
          fontSize: 28,
          letterSpacing: 4,
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = BLACK;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = RED;
        }}
      >
        DELETE BOOKING
      </button>
    </div>
  );
}
