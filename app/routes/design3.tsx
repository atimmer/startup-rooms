import { useState, useEffect } from "react";
import type { Route } from "./+types/design3";
import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Rooms — Organic" }];
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
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Outfit:wght@300;400;500;600&display=swap",
  },
];

const SAGE = "#7C9070";
const TERRACOTTA = "#C4704B";
const CREAM = "#FAF7F2";
const MOSS = "#4A5D3E";
const SANDY = "#D4C5A9";
const CLAY = "#B8836A";

const ROOM_COLORS: Record<string, { bg: string; accent: string; pill: string }> = {
  aurora: { bg: "#F5E6E0", accent: TERRACOTTA, pill: "#E8B4A0" },
  nebula: { bg: "#E4ECE0", accent: SAGE, pill: "#B8CCB0" },
  zenith: { bg: "#E8E4D8", accent: SANDY, pill: "#CEBFA3" },
  cosmos: { bg: "#F0E8DC", accent: CLAY, pill: "#D4AA90" },
  prism: { bg: "#E0E8E0", accent: MOSS, pill: "#A8C0A0" },
  vertex: { bg: "#EDE8E0", accent: "#8B7E6A", pill: "#C8B8A0" },
};

const PEBBLE_SHAPES = [
  "60% 40% 55% 45% / 50% 60% 40% 50%",
  "50% 50% 45% 55% / 55% 45% 50% 50%",
  "55% 45% 50% 50% / 45% 55% 50% 50%",
  "45% 55% 50% 50% / 50% 50% 55% 45%",
  "52% 48% 44% 56% / 48% 52% 50% 50%",
  "48% 52% 56% 44% / 52% 48% 45% 55%",
];

function getCurrentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Design3() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [currentTime, setCurrentTime] = useState(getCurrentHourFraction);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [formEndHour, setFormEndHour] = useState<number>(10);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getCurrentHourFraction()), 30000);
    return () => clearInterval(interval);
  }, []);

  function openBookingModal(room: Room, hour: number) {
    setSelectedRoom(room);
    setSelectedHour(hour);
    setFormEndHour(Math.min(hour + 1, 17));
    setFormTitle("");
    setFormOrganizer("");
    setDetailBooking(null);
    setModalOpen(true);
  }

  function openDetailModal(booking: Booking) {
    setDetailBooking(booking);
    setSelectedRoom(ROOMS.find((r) => r.id === booking.roomId) || null);
    setModalOpen(true);
  }

  function handleCreate() {
    if (!selectedRoom || !formTitle.trim() || !formOrganizer.trim()) return;
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      roomId: selectedRoom.id,
      title: formTitle.trim(),
      organizer: formOrganizer.trim(),
      startHour: selectedHour,
      endHour: formEndHour,
      date: getTodayStr(),
    };
    setBookings((prev) => [...prev, newBooking]);
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setModalOpen(false);
  }

  function closeModal() {
    setModalOpen(false);
    setDetailBooking(null);
  }

  const today = getTodayStr();

  return (
    <>
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
          25% { transform: translate(30px, -40px) scale(1.05); border-radius: 50% 50% 45% 55% / 55% 45% 50% 50%; }
          50% { transform: translate(-20px, 20px) scale(0.95); border-radius: 45% 55% 50% 50% / 50% 50% 55% 45%; }
          75% { transform: translate(15px, 30px) scale(1.02); border-radius: 55% 45% 50% 50% / 45% 55% 50% 50%; }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); border-radius: 50% 50% 45% 55% / 55% 45% 50% 50%; }
          33% { transform: translate(-40px, 30px) scale(1.08); border-radius: 55% 45% 50% 50% / 50% 50% 55% 45%; }
          66% { transform: translate(25px, -20px) scale(0.96); border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); border-radius: 45% 55% 50% 50% / 50% 50% 55% 45%; }
          40% { transform: translate(20px, 40px) scale(1.04); border-radius: 50% 50% 45% 55% / 55% 45% 50% 50%; }
          80% { transform: translate(-30px, -15px) scale(0.97); border-radius: 55% 45% 50% 50% / 45% 55% 50% 50%; }
        }
        @keyframes blob4 {
          0%, 100% { transform: translate(0, 0) scale(1); border-radius: 52% 48% 44% 56% / 48% 52% 50% 50%; }
          50% { transform: translate(-15px, 25px) scale(1.06); border-radius: 48% 52% 56% 44% / 52% 48% 45% 55%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          background: CREAM,
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Floating Blobs */}
        <div
          style={{
            position: "fixed",
            top: "-10%",
            right: "-5%",
            width: "500px",
            height: "500px",
            background: "rgba(124, 144, 112, 0.08)",
            animation: "blob1 20s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "fixed",
            bottom: "-8%",
            left: "-8%",
            width: "600px",
            height: "600px",
            background: "rgba(196, 112, 75, 0.06)",
            animation: "blob2 25s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "fixed",
            top: "40%",
            left: "50%",
            width: "400px",
            height: "400px",
            background: "rgba(212, 197, 169, 0.07)",
            animation: "blob3 18s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "fixed",
            top: "10%",
            left: "15%",
            width: "300px",
            height: "300px",
            background: "rgba(74, 93, 62, 0.05)",
            animation: "blob4 22s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, padding: "48px 40px 80px" }}>
          {/* Header */}
          <header
            style={{
              animation: "fadeUp 0.8s ease-out both",
              marginBottom: "48px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 300,
                color: MOSS,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              find your space
            </h1>
            <p
              style={{
                fontSize: "1.05rem",
                fontWeight: 300,
                color: SAGE,
                letterSpacing: "0.04em",
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </header>

          {/* Room Cards — Flowing layout */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "28px",
              justifyContent: "center",
              alignItems: "flex-start",
              maxWidth: "1400px",
              margin: "0 auto",
            }}
          >
            {ROOMS.map((room, idx) => {
              const colors = ROOM_COLORS[room.id] || ROOM_COLORS.aurora;
              const roomBookings = bookings.filter(
                (b) => b.roomId === room.id && b.date === today,
              );
              const sizeScale = Math.max(0.85, Math.min(1.15, room.capacity / 10));
              const baseWidth = 380 * sizeScale;

              return (
                <div
                  key={room.id}
                  style={{
                    animation: `fadeUp 0.7s ease-out ${0.1 * idx}s both`,
                    width: `${baseWidth}px`,
                    maxWidth: "100%",
                    minWidth: "320px",
                    flex: `0 1 ${baseWidth}px`,
                    marginTop: idx % 2 === 1 ? "20px" : "0",
                  }}
                >
                  <div
                    className="group"
                    style={{
                      background: colors.bg,
                      borderRadius: PEBBLE_SHAPES[idx % PEBBLE_SHAPES.length],
                      padding: "28px 24px 24px",
                      boxShadow: "0 4px 24px rgba(74, 93, 62, 0.06), 0 1px 4px rgba(0,0,0,0.03)",
                      transition: "transform 0.4s ease, box-shadow 0.4s ease",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.02) translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 40px rgba(74, 93, 62, 0.1), 0 2px 8px rgba(0,0,0,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1) translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 24px rgba(74, 93, 62, 0.06), 0 1px 4px rgba(0,0,0,0.03)";
                    }}
                  >
                    {/* Room Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontFamily: "'Fraunces', serif",
                            fontSize: "1.5rem",
                            fontWeight: 400,
                            color: colors.accent,
                            marginBottom: "4px",
                          }}
                        >
                          {room.name}
                        </h2>
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "rgba(74, 93, 62, 0.6)",
                            fontWeight: 400,
                          }}
                        >
                          {room.capacity} seats &middot; Floor {room.floor}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                          maxWidth: "140px",
                        }}
                      >
                        {room.amenities.map((a) => (
                          <span
                            key={a}
                            style={{
                              fontSize: "0.68rem",
                              padding: "3px 8px",
                              borderRadius: "20px",
                              background: "rgba(255,255,255,0.6)",
                              color: "rgba(74, 93, 62, 0.7)",
                              fontWeight: 400,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ position: "relative" }}>
                      {/* Hour labels */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                          padding: "0 2px",
                        }}
                      >
                        {HOURS.map((h) => (
                          <span
                            key={h}
                            style={{
                              fontSize: "0.62rem",
                              color: "rgba(74, 93, 62, 0.4)",
                              fontWeight: 400,
                              width: `${100 / HOURS.length}%`,
                              textAlign: "center",
                            }}
                          >
                            {h > 12 ? h - 12 : h}
                            {h < 12 ? "a" : "p"}
                          </span>
                        ))}
                      </div>

                      {/* Timeline bar */}
                      <div
                        style={{
                          position: "relative",
                          height: "36px",
                          background: "rgba(255,255,255,0.5)",
                          borderRadius: "20px",
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const pct = x / rect.width;
                          const hour = Math.floor(8 + pct * HOURS.length);
                          const clampedHour = Math.max(8, Math.min(hour, 16));
                          // Check if clicking on a booking
                          const clickedBooking = roomBookings.find(
                            (b) => clampedHour >= b.startHour && clampedHour < b.endHour,
                          );
                          if (!clickedBooking) {
                            openBookingModal(room, clampedHour);
                          }
                        }}
                      >
                        {/* Hour grid lines */}
                        {HOURS.slice(1).map((h) => (
                          <div
                            key={h}
                            style={{
                              position: "absolute",
                              left: `${((h - 8) / HOURS.length) * 100}%`,
                              top: 0,
                              bottom: 0,
                              width: "1px",
                              background: "rgba(74, 93, 62, 0.06)",
                            }}
                          />
                        ))}

                        {/* Bookings */}
                        {roomBookings.map((booking) => {
                          const left = ((booking.startHour - 8) / HOURS.length) * 100;
                          const width =
                            ((booking.endHour - booking.startHour) / HOURS.length) * 100;
                          return (
                            <div
                              key={booking.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(booking);
                              }}
                              style={{
                                position: "absolute",
                                left: `${left}%`,
                                width: `${width}%`,
                                top: "4px",
                                bottom: "4px",
                                background: colors.pill,
                                borderRadius: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 8px",
                                cursor: "pointer",
                                transition: "filter 0.3s ease, transform 0.3s ease",
                                overflow: "hidden",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.filter = "brightness(0.95)";
                                e.currentTarget.style.transform = "scaleY(1.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.filter = "brightness(1)";
                                e.currentTarget.style.transform = "scaleY(1)";
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 500,
                                  color: "rgba(0,0,0,0.55)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {booking.title}
                              </span>
                            </div>
                          );
                        })}

                        {/* Current time indicator */}
                        {currentTime >= 8 && currentTime <= 18 && (
                          <div
                            style={{
                              position: "absolute",
                              left: `${((currentTime - 8) / HOURS.length) * 100}%`,
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: TERRACOTTA,
                              boxShadow: `0 0 0 3px rgba(196, 112, 75, 0.25)`,
                              animation: "pulse 2.5s ease-in-out infinite",
                              zIndex: 5,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div
            onClick={closeModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(74, 93, 62, 0.2)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "24px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(250, 247, 242, 0.88)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "32px",
                padding: "36px 32px",
                width: "100%",
                maxWidth: "420px",
                boxShadow: "0 24px 64px rgba(74, 93, 62, 0.12), 0 4px 12px rgba(0,0,0,0.04)",
                animation: "modalIn 0.35s ease-out both",
                border: "1px solid rgba(255,255,255,0.6)",
              }}
            >
              {detailBooking ? (
                /* Detail View */
                <div>
                  <h3
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: "1.5rem",
                      fontWeight: 400,
                      color: MOSS,
                      marginBottom: "20px",
                    }}
                  >
                    {detailBooking.title}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                    <DetailRow label="Room" value={selectedRoom?.name || ""} />
                    <DetailRow label="Organizer" value={detailBooking.organizer} />
                    <DetailRow
                      label="Time"
                      value={`${formatHour(detailBooking.startHour)} — ${formatHour(detailBooking.endHour)}`}
                    />
                    <DetailRow label="Date" value={detailBooking.date} />
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => handleDelete(detailBooking.id)}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "20px",
                        border: `1.5px solid ${CLAY}`,
                        background: "transparent",
                        color: CLAY,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = CLAY;
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = CLAY;
                      }}
                    >
                      Remove booking
                    </button>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "20px",
                        border: "none",
                        background: SAGE,
                        color: "#fff",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = MOSS;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = SAGE;
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Create Booking Form */
                <div>
                  <h3
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: "1.5rem",
                      fontWeight: 400,
                      color: MOSS,
                      marginBottom: "6px",
                    }}
                  >
                    new booking
                  </h3>
                  <p
                    style={{
                      fontSize: "0.88rem",
                      color: SAGE,
                      marginBottom: "24px",
                      fontWeight: 300,
                    }}
                  >
                    {selectedRoom?.name} &middot; {formatHour(selectedHour)}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                    <input
                      type="text"
                      placeholder="Meeting title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = SAGE;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(124, 144, 112, 0.12)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(124, 144, 112, 0.2)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formOrganizer}
                      onChange={(e) => setFormOrganizer(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = SAGE;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(124, 144, 112, 0.12)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(124, 144, 112, 0.2)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: SAGE,
                            fontWeight: 400,
                            marginBottom: "4px",
                            display: "block",
                          }}
                        >
                          Start
                        </label>
                        <select
                          value={selectedHour}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setSelectedHour(v);
                            if (formEndHour <= v) setFormEndHour(Math.min(v + 1, 17));
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
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: SAGE,
                            fontWeight: 400,
                            marginBottom: "4px",
                            display: "block",
                          }}
                        >
                          End
                        </label>
                        <select
                          value={formEndHour}
                          onChange={(e) => setFormEndHour(Number(e.target.value))}
                          style={selectStyle}
                        >
                          {HOURS.filter((h) => h > selectedHour)
                            .concat(selectedHour < 17 ? [17] : [])
                            .filter((h, i, arr) => arr.indexOf(h) === i)
                            .map((h) => (
                              <option key={h} value={h}>
                                {formatHour(h)}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "20px",
                        border: `1.5px solid rgba(124, 144, 112, 0.25)`,
                        background: "transparent",
                        color: SAGE,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "0.9rem",
                        fontWeight: 400,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = SAGE;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(124, 144, 112, 0.25)";
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "20px",
                        border: "none",
                        background: SAGE,
                        color: "#fff",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        opacity: formTitle.trim() && formOrganizer.trim() ? 1 : 0.5,
                      }}
                      onMouseEnter={(e) => {
                        if (formTitle.trim() && formOrganizer.trim()) {
                          e.currentTarget.style.background = MOSS;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = SAGE;
                      }}
                    >
                      Book space
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.82rem", color: SAGE, fontWeight: 300 }}>{label}</span>
      <span style={{ fontSize: "0.88rem", color: MOSS, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: "18px",
  border: "1.5px solid rgba(124, 144, 112, 0.2)",
  background: "rgba(255, 255, 255, 0.6)",
  fontFamily: "'Outfit', sans-serif",
  fontSize: "0.9rem",
  color: MOSS,
  outline: "none",
  transition: "all 0.3s ease",
  width: "100%",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "16px",
  border: "1.5px solid rgba(124, 144, 112, 0.2)",
  background: "rgba(255, 255, 255, 0.6)",
  fontFamily: "'Outfit', sans-serif",
  fontSize: "0.85rem",
  color: MOSS,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};
