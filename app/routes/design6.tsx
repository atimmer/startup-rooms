import { useState, useEffect } from "react";
import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";
import type { Route } from "./+types/design6";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Meeting Rooms" }];
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
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
  },
];

const FIRST_HOUR = HOURS[0];
const LAST_HOUR = HOURS[HOURS.length - 1] + 1; // 18 (5PM end)
const TOTAL_HOURS = LAST_HOUR - FIRST_HOUR;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function useCurrentHourFraction() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now.getHours() + now.getMinutes() / 60;
}

function generateId() {
  return "b" + Math.random().toString(36).slice(2, 10);
}

// ─── Modal types ───

type ModalState =
  | { kind: "none" }
  | { kind: "book"; roomId: string; startHour: number; endHour: number }
  | { kind: "detail"; booking: Booking };

// ─── Component ───

export default function Design6() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const currentHour = useCurrentHourFraction();

  // Booking form state
  const [formTitle, setFormTitle] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [formStart, setFormStart] = useState(8);
  const [formEnd, setFormEnd] = useState(9);

  function openBookModal(roomId: string, hour: number) {
    setFormTitle("");
    setFormOrganizer("");
    setFormStart(hour);
    setFormEnd(hour + 1);
    setModal({ kind: "book", roomId, startHour: hour, endHour: hour + 1 });
  }

  function submitBooking() {
    if (modal.kind !== "book") return;
    if (!formTitle.trim() || !formOrganizer.trim()) return;
    const newBooking: Booking = {
      id: generateId(),
      roomId: modal.roomId,
      title: formTitle.trim(),
      organizer: formOrganizer.trim(),
      startHour: formStart,
      endHour: formEnd,
      date: todayStr(),
    };
    setBookings((prev) => [...prev, newBooking]);
    setModal({ kind: "none" });
  }

  function deleteBooking(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setModal({ kind: "none" });
  }

  function roomBookings(roomId: string) {
    return bookings
      .filter((b) => b.roomId === roomId && b.date === todayStr())
      .sort((a, b) => a.startHour - b.startHour);
  }

  function closeModal() {
    setModal({ kind: "none" });
  }

  return (
    <div
      style={{
        fontFamily: '"IBM Plex Sans", sans-serif',
        background: "#F6F7F9",
        minHeight: "100vh",
        padding: "32px 24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 28px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            Meeting Rooms
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6B7280",
              margin: "4px 0 0",
            }}
          >
            {todayFormatted()}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <LegendItem color="#10B981" label="Available" />
          <LegendItem color="#EF4444" label="Booked" />
          <LegendItem color="#3B82F6" label="Now" line />
        </div>
      </div>

      {/* Room Grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        {ROOMS.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            bookings={roomBookings(room.id)}
            currentHour={currentHour}
            onSlotClick={(hour) => openBookModal(room.id, hour)}
            onBookingClick={(b) => setModal({ kind: "detail", booking: b })}
          />
        ))}
      </div>

      {/* Modal */}
      {modal.kind !== "none" && (
        <ModalBackdrop onClose={closeModal}>
          {modal.kind === "book" && (
            <BookingFormModal
              room={ROOMS.find((r) => r.id === modal.roomId)!}
              formTitle={formTitle}
              setFormTitle={setFormTitle}
              formOrganizer={formOrganizer}
              setFormOrganizer={setFormOrganizer}
              formStart={formStart}
              setFormStart={setFormStart}
              formEnd={formEnd}
              setFormEnd={setFormEnd}
              onSubmit={submitBooking}
              onCancel={closeModal}
            />
          )}
          {modal.kind === "detail" && (
            <BookingDetailModal
              booking={modal.booking}
              room={ROOMS.find((r) => r.id === modal.booking.roomId)!}
              onDelete={() => deleteBooking(modal.booking.id)}
              onClose={closeModal}
            />
          )}
        </ModalBackdrop>
      )}
    </div>
  );
}

// ─── Legend ───

function LegendItem({
  color,
  label,
  line,
}: {
  color: string;
  label: string;
  line?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {line ? (
        <div
          style={{
            width: 16,
            height: 2,
            background: color,
            borderRadius: 1,
          }}
        />
      ) : (
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: color,
          }}
        />
      )}
      <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
    </div>
  );
}

// ─── Room Card ───

function RoomCard({
  room,
  bookings,
  currentHour,
  onSlotClick,
  onBookingClick,
}: {
  room: Room;
  bookings: Booking[];
  currentHour: number;
  onSlotClick: (hour: number) => void;
  onBookingClick: (b: Booking) => void;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: room.color,
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#111827",
              margin: 0,
            }}
          >
            {room.name}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#6B7280",
              background: "#F3F4F6",
              borderRadius: 6,
              padding: "2px 8px",
            }}
          >
            Floor {room.floor}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#3B82F6",
              background: "#EFF6FF",
              borderRadius: 6,
              padding: "2px 8px",
            }}
          >
            {room.capacity} people
          </span>
        </div>
      </div>

      {/* Amenities */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {room.amenities.map((a) => (
          <span
            key={a}
            style={{
              fontSize: 11,
              color: "#6B7280",
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            {a}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <TimelineBar
        bookings={bookings}
        currentHour={currentHour}
        onSlotClick={onSlotClick}
        onBookingClick={onBookingClick}
      />

      {/* Today's bookings list */}
      {bookings.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            borderTop: "1px solid #F3F4F6",
            paddingTop: 10,
          }}
        >
          {bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => onBookingClick(b)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                padding: "4px 0",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 12,
                  color: "#9CA3AF",
                  minWidth: 100,
                  flexShrink: 0,
                }}
              >
                {formatHour(b.startHour)} - {formatHour(b.endHour)}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.title}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginLeft: "auto",
                  flexShrink: 0,
                }}
              >
                {b.organizer}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline Bar ───

function TimelineBar({
  bookings,
  currentHour,
  onSlotClick,
  onBookingClick,
}: {
  bookings: Booking[];
  currentHour: number;
  onSlotClick: (hour: number) => void;
  onBookingClick: (b: Booking) => void;
}) {
  const nowPercent =
    currentHour >= FIRST_HOUR && currentHour <= LAST_HOUR
      ? ((currentHour - FIRST_HOUR) / TOTAL_HOURS) * 100
      : null;

  // Build occupied set
  const occupied = new Set<number>();
  for (const b of bookings) {
    for (let h = b.startHour; h < b.endHour; h++) {
      occupied.add(h);
    }
  }

  // Build segments: either a booking block or a free hour
  const segments: Array<
    { type: "free"; hour: number } | { type: "booked"; booking: Booking }
  > = [];
  const rendered = new Set<string>();

  for (const hour of HOURS) {
    const booking = bookings.find(
      (b) => hour >= b.startHour && hour < b.endHour,
    );
    if (booking) {
      if (!rendered.has(booking.id)) {
        segments.push({ type: "booked", booking });
        rendered.add(booking.id);
      }
    } else {
      segments.push({ type: "free", hour });
    }
  }

  return (
    <div>
      {/* Hour labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        {HOURS.map((h) => (
          <span
            key={h}
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10,
              color: "#9CA3AF",
              width: `${100 / TOTAL_HOURS}%`,
              textAlign: "left",
            }}
          >
            {h > 12 ? h - 12 : h}
            {h < 12 ? "a" : "p"}
          </span>
        ))}
      </div>

      {/* Bar */}
      <div
        style={{
          position: "relative",
          display: "flex",
          height: 28,
          borderRadius: 6,
          overflow: "hidden",
          background: "#F3F4F6",
        }}
      >
        {segments.map((seg) => {
          if (seg.type === "free") {
            return (
              <button
                key={`free-${seg.hour}`}
                onClick={() => onSlotClick(seg.hour)}
                title={`Book ${formatHour(seg.hour)}`}
                style={{
                  width: `${(1 / TOTAL_HOURS) * 100}%`,
                  height: "100%",
                  background: "#ECFDF5",
                  border: "none",
                  borderRight: "1px solid rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#D1FAE5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#ECFDF5")
                }
              />
            );
          }
          const b = seg.booking;
          const span = b.endHour - b.startHour;
          return (
            <button
              key={b.id}
              onClick={() => onBookingClick(b)}
              title={`${b.title} (${formatHour(b.startHour)} - ${formatHour(b.endHour)})`}
              style={{
                width: `${(span / TOTAL_HOURS) * 100}%`,
                height: "100%",
                background: "#FEE2E2",
                border: "none",
                borderRight: "1px solid rgba(0,0,0,0.04)",
                cursor: "pointer",
                padding: "0 4px",
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#991B1B",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {b.title}
              </span>
            </button>
          );
        })}

        {/* Current time line */}
        {nowPercent !== null && (
          <div
            style={{
              position: "absolute",
              left: `${nowPercent}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: "#3B82F6",
              borderRadius: 1,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Modal Backdrop ───

function ModalBackdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        animation: "fadeIn 0.15s ease",
        padding: 24,
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── Booking Form Modal ───

function BookingFormModal({
  room,
  formTitle,
  setFormTitle,
  formOrganizer,
  setFormOrganizer,
  formStart,
  setFormStart,
  formEnd,
  setFormEnd,
  onSubmit,
  onCancel,
}: {
  room: Room;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formOrganizer: string;
  setFormOrganizer: (v: string) => void;
  formStart: number;
  setFormStart: (v: number) => void;
  formEnd: number;
  setFormEnd: (v: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    outline: "none",
    fontFamily: '"IBM Plex Sans", sans-serif',
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    background: "#fff",
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 28,
        width: 400,
        maxWidth: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}
    >
      <h3
        style={{
          margin: "0 0 4px",
          fontSize: 20,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        Book {room.name}
      </h3>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 13,
          color: "#6B7280",
        }}
      >
        Floor {room.floor} &middot; {room.capacity} people
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Meeting title</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="e.g. Sprint Review"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>Organizer</label>
          <input
            type="text"
            value={formOrganizer}
            onChange={(e) => setFormOrganizer(e.target.value)}
            placeholder="Your name"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Start</label>
            <select
              value={formStart}
              onChange={(e) => {
                const v = Number(e.target.value);
                setFormStart(v);
                if (formEnd <= v) setFormEnd(v + 1);
              }}
              style={selectStyle}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>End</label>
            <select
              value={formEnd}
              onChange={(e) => setFormEnd(Number(e.target.value))}
              style={selectStyle}
            >
              {HOURS.filter((h) => h > formStart)
                .map((h) => h)
                .concat([LAST_HOUR])
                .map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 22,
        }}
      >
        <button onClick={onCancel} style={secondaryBtnStyle}>
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!formTitle.trim() || !formOrganizer.trim()}
          style={{
            ...primaryBtnStyle,
            opacity:
              !formTitle.trim() || !formOrganizer.trim() ? 0.5 : 1,
          }}
        >
          Book Room
        </button>
      </div>
    </div>
  );
}

// ─── Booking Detail Modal ───

function BookingDetailModal({
  booking,
  room,
  onDelete,
  onClose,
}: {
  booking: Booking;
  room: Room;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 28,
        width: 380,
        maxWidth: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}
    >
      <h3
        style={{
          margin: "0 0 4px",
          fontSize: 20,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {booking.title}
      </h3>
      <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
        {room.name} &middot; Floor {room.floor}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <DetailRow label="Time">
          <span
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 14,
            }}
          >
            {formatHour(booking.startHour)} - {formatHour(booking.endHour)}
          </span>
        </DetailRow>
        <DetailRow label="Organizer">
          <span style={{ fontSize: 14 }}>{booking.organizer}</span>
        </DetailRow>
        <DetailRow label="Duration">
          <span style={{ fontSize: 14 }}>
            {booking.endHour - booking.startHour}h
          </span>
        </DetailRow>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 24,
        }}
      >
        <button onClick={onClose} style={secondaryBtnStyle}>
          Close
        </button>
        <button
          onClick={onDelete}
          style={{
            ...primaryBtnStyle,
            background: "#EF4444",
          }}
        >
          Delete Booking
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#9CA3AF",
          minWidth: 72,
        }}
      >
        {label}
      </span>
      <span style={{ color: "#374151" }}>{children}</span>
    </div>
  );
}

// ─── Shared styles ───

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  marginBottom: 4,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  background: "#3B82F6",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: '"IBM Plex Sans", sans-serif',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 500,
  color: "#6B7280",
  background: "#F3F4F6",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: '"IBM Plex Sans", sans-serif',
};
