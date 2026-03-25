import { useState, useMemo, useRef, useEffect } from "react";

import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";
import type { Route } from "./+types/design10";

// ---------------------------------------------------------------------------
// Route meta & links
// ---------------------------------------------------------------------------

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Room Schedule" }];
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
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap",
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT = "'Geist Sans', Geist, system-ui, -apple-system, sans-serif";
const CHARCOAL = "#18181B";
const BLUE = "#3B82F6";
const BORDER = "#E4E4E7";
const STRIPE = "#FAFAFA";
const BOOKED_BG = "#F4F4F5";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function getBookingForCell(
  bookings: Booking[],
  roomId: string,
  hour: number,
  date: string,
): Booking | undefined {
  return bookings.find(
    (b) =>
      b.roomId === roomId &&
      b.date === date &&
      b.startHour <= hour &&
      b.endHour > hour,
  );
}

function isBookingStart(booking: Booking, hour: number): boolean {
  return booking.startHour === hour;
}

// ---------------------------------------------------------------------------
// Inline Booking Form
// ---------------------------------------------------------------------------

function InlineBookingForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string, organizer: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim() && organizer.trim()) {
      onSubmit(title.trim(), organizer.trim());
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "100%",
        fontFamily: FONT,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 3,
          padding: "2px 4px",
          fontSize: 11,
          fontFamily: FONT,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = BLUE)}
        onBlur={(e) => (e.target.style.borderColor = BORDER)}
      />
      <input
        type="text"
        placeholder="Organizer"
        value={organizer}
        onChange={(e) => setOrganizer(e.target.value)}
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 3,
          padding: "2px 4px",
          fontSize: 11,
          fontFamily: FONT,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = BLUE)}
        onBlur={(e) => (e.target.style.borderColor = BORDER)}
      />
      <div style={{ display: "flex", gap: 3 }}>
        <button
          type="submit"
          style={{
            flex: 1,
            fontSize: 10,
            fontFamily: FONT,
            fontWeight: 500,
            padding: "2px 0",
            background: CHARCOAL,
            color: "#fff",
            border: "none",
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          Book
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            fontSize: 10,
            fontFamily: FONT,
            fontWeight: 500,
            padding: "2px 0",
            background: "#fff",
            color: CHARCOAL,
            border: `1px solid ${BORDER}`,
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Booking Detail Popover
// ---------------------------------------------------------------------------

function BookingPopover({
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
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        zIndex: 50,
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: 12,
        minWidth: 200,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: room.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: CHARCOAL }}>
          {booking.title}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#71717A", lineHeight: 1.6 }}>
        <div>
          <strong>Organizer:</strong> {booking.organizer}
        </div>
        <div>
          <strong>Time:</strong> {formatHour(booking.startHour)} –{" "}
          {formatHour(booking.endHour)}
        </div>
        <div>
          <strong>Room:</strong> {room.name} (Cap. {room.capacity})
        </div>
        <div>
          <strong>Floor:</strong> {room.floor}
        </div>
        <div>
          <strong>Amenities:</strong> {room.amenities.join(", ")}
        </div>
      </div>
      <button
        onClick={onDelete}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "4px 0",
          fontSize: 11,
          fontFamily: FONT,
          fontWeight: 500,
          color: "#DC2626",
          background: "#FEF2F2",
          border: `1px solid #FECACA`,
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Delete Booking
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Design10() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [editingCell, setEditingCell] = useState<{
    roomId: string;
    hour: number;
  } | null>(null);
  const [viewingBooking, setViewingBooking] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    roomId: string;
    hour: number;
  } | null>(null);

  const today = useMemo(getTodayStr, []);
  const [currentTime, setCurrentTime] = useState(getCurrentHourFraction);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentHourFraction());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const todayFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  function handleBook(roomId: string, hour: number, title: string, organizer: string) {
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      roomId,
      title,
      organizer,
      startHour: hour,
      endHour: hour + 1,
      date: today,
    };
    setBookings((prev) => [...prev, newBooking]);
    setEditingCell(null);
  }

  function handleDelete(bookingId: string) {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    setViewingBooking(null);
  }

  function handleCellClick(roomId: string, hour: number) {
    const booking = getBookingForCell(bookings, roomId, hour, today);
    if (booking) {
      setViewingBooking(viewingBooking === booking.id ? null : booking.id);
      setEditingCell(null);
    } else {
      setEditingCell({ roomId, hour });
      setViewingBooking(null);
    }
  }

  // Current time indicator position
  const timeInRange = currentTime >= 8 && currentTime <= 17;

  return (
    <div
      style={{
        fontFamily: FONT,
        background: "#fff",
        minHeight: "100vh",
        color: CHARCOAL,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "#fff",
          borderBottom: `1px solid ${BORDER}`,
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>Room Schedule</span>
        <span style={{ fontSize: 12, color: "#71717A" }}>{todayFormatted}</span>
      </div>

      {/* Table container */}
      <div
        style={{
          overflow: "auto",
          position: "relative",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontFamily: FONT,
            fontSize: 12,
            position: "relative",
          }}
        >
          <colgroup>
            <col style={{ width: 72 }} />
            {ROOMS.map((r) => (
              <col key={r.id} />
            ))}
          </colgroup>

          {/* Sticky header */}
          <thead>
            <tr
              style={{
                position: "sticky",
                top: 41, // height of the page header
                zIndex: 20,
                background: "#fff",
              }}
            >
              <th
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 21,
                  background: "#fff",
                  borderBottom: `2px solid ${CHARCOAL}`,
                  borderRight: `1px solid ${BORDER}`,
                  padding: "6px 8px",
                  textAlign: "left",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#71717A",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Time
              </th>
              {ROOMS.map((room) => (
                <th
                  key={room.id}
                  style={{
                    borderBottom: `2px solid ${CHARCOAL}`,
                    borderRight: `1px solid ${BORDER}`,
                    padding: "6px 8px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 12,
                    color: CHARCOAL,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{room.name}</span>
                  <span
                    style={{
                      fontWeight: 400,
                      color: "#A1A1AA",
                      fontSize: 11,
                      marginLeft: 4,
                    }}
                  >
                    ({room.capacity})
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {HOURS.map((hour, rowIdx) => {
              const isStripe = rowIdx % 2 === 1;
              const rowBg = isStripe ? STRIPE : "#fff";

              // Current time indicator
              const showTimeLine =
                timeInRange &&
                currentTime >= hour &&
                currentTime < hour + 1;
              const timeLineOffset = showTimeLine
                ? `${((currentTime - hour) * 100).toFixed(1)}%`
                : undefined;

              return (
                <tr key={hour} style={{ position: "relative" }}>
                  {/* Time label — sticky left */}
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 10,
                      background: rowBg,
                      borderRight: `1px solid ${BORDER}`,
                      borderBottom: `1px solid ${BORDER}`,
                      padding: "8px 8px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#71717A",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                      height: 52,
                    }}
                  >
                    {formatHour(hour)}
                  </td>

                  {/* Room cells */}
                  {ROOMS.map((room) => {
                    const booking = getBookingForCell(
                      bookings,
                      room.id,
                      hour,
                      today,
                    );
                    const isStart = booking
                      ? isBookingStart(booking, hour)
                      : false;
                    const isEditing =
                      editingCell?.roomId === room.id &&
                      editingCell?.hour === hour;
                    const isViewing =
                      booking && viewingBooking === booking.id && isStart;
                    const isHovered =
                      hoveredCell?.roomId === room.id &&
                      hoveredCell?.hour === hour;

                    return (
                      <td
                        key={room.id}
                        onClick={() => handleCellClick(room.id, hour)}
                        onMouseEnter={() =>
                          setHoveredCell({ roomId: room.id, hour })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{
                          position: "relative",
                          borderRight: `1px solid ${BORDER}`,
                          borderBottom: `1px solid ${BORDER}`,
                          padding: 0,
                          height: 52,
                          verticalAlign: "top",
                          cursor: "pointer",
                          background: booking
                            ? BOOKED_BG
                            : isHovered && !isEditing
                              ? "#EFF6FF"
                              : rowBg,
                          borderLeft: booking
                            ? `3px solid ${room.color}`
                            : undefined,
                          transition: "background 0.1s ease",
                        }}
                      >
                        {/* Current time line */}
                        {showTimeLine && (
                          <div
                            style={{
                              position: "absolute",
                              top: timeLineOffset,
                              left: 0,
                              right: 0,
                              height: 2,
                              background: BLUE,
                              zIndex: 5,
                              pointerEvents: "none",
                            }}
                          />
                        )}

                        {/* Cell content */}
                        <div style={{ padding: "4px 6px", height: "100%", boxSizing: "border-box" }}>
                          {isEditing ? (
                            <InlineBookingForm
                              onSubmit={(title, organizer) =>
                                handleBook(room.id, hour, title, organizer)
                              }
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : booking && isStart ? (
                            <div style={{ position: "relative" }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: CHARCOAL,
                                  lineHeight: 1.3,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {booking.title}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#71717A",
                                  marginTop: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {booking.organizer}
                              </div>
                              {booking.endHour - booking.startHour > 1 && (
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: "#A1A1AA",
                                    marginTop: 1,
                                  }}
                                >
                                  until {formatHour(booking.endHour)}
                                </div>
                              )}

                              {/* Popover */}
                              {isViewing && (
                                <BookingPopover
                                  booking={booking}
                                  room={room}
                                  onDelete={() => handleDelete(booking.id)}
                                  onClose={() => setViewingBooking(null)}
                                />
                              )}
                            </div>
                          ) : booking && !isStart ? (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#A1A1AA",
                                fontStyle: "italic",
                              }}
                            >
                              (cont.)
                            </div>
                          ) : !isEditing && isHovered ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                color: BLUE,
                                fontSize: 18,
                                fontWeight: 300,
                                opacity: 0.5,
                              }}
                            >
                              +
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer status bar */}
      <div
        style={{
          borderTop: `1px solid ${BORDER}`,
          padding: "6px 16px",
          fontSize: 10,
          color: "#A1A1AA",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT,
        }}
      >
        <span>
          {ROOMS.length} rooms &middot;{" "}
          {bookings.filter((b) => b.date === today).length} bookings today
        </span>
        <span>
          {HOURS.reduce(
            (acc, h) =>
              acc +
              ROOMS.filter(
                (r) => !getBookingForCell(bookings, r.id, h, today),
              ).length,
            0,
          )}{" "}
          slots available
        </span>
      </div>
    </div>
  );
}
