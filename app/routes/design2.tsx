import { useState, useEffect } from "react";
import type { Route } from "./+types/design2";
import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Rooms — Art Deco" }];
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
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Raleway:wght@300;400;600&display=swap",
  },
];

// ---------- color palette ----------
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#E8D48B";
const CREAM = "#F5F0E8";
const BURGUNDY = "#5C0A1A";
const BLACK = "#0A0A0A";
const BLACK_CARD = "#111111";
const BLACK_SLOT = "#0D0D0D";

// ---------- inline keyframes (injected once) ----------
const keyframeCSS = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes goldShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes fanReveal {
  from { clip-path: polygon(50% 100%, 50% 100%, 50% 100%); }
  to   { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
}
@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 4px ${GOLD}44; }
  50%      { box-shadow: 0 0 16px ${GOLD}88; }
}
@keyframes tickerSlide {
  from { transform: translateX(100%); }
  to   { transform: translateX(-100%); }
}
`;

// ---------- helper components ----------

function ArtDecoFan({ size = 60, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size / 2} viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const angle = -90 + i * 30;
        const rad = (angle * Math.PI) / 180;
        const x2 = 60 + Math.cos(rad) * 58;
        const y2 = 60 + Math.sin(rad) * 58;
        return <line key={i} x1="60" y1="60" x2={x2} y2={y2} stroke={color} strokeWidth="1.2" opacity="0.7" />;
      })}
      {[20, 40, 58].map((r) => (
        <path
          key={r}
          d={`M ${60 - r} 60 A ${r} ${r} 0 0 1 ${60 + r} 60`}
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.5"
        />
      ))}
    </svg>
  );
}

function SunburstDivider() {
  return (
    <div className="flex items-center justify-center my-8 gap-4" style={{ fontFamily: "'Raleway', sans-serif" }}>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}88)` }} />
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1="20"
              y1="20"
              x2={20 + Math.cos(angle) * 18}
              y2={20 + Math.sin(angle) * 18}
              stroke={GOLD}
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}
        <circle cx="20" cy="20" r="3" fill={GOLD} opacity="0.8" />
      </svg>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD}88)` }} />
    </div>
  );
}

function ChevronBorder() {
  const count = 24;
  return (
    <svg width="100%" height="12" viewBox={`0 0 ${count * 20} 12`} preserveAspectRatio="none" style={{ display: "block" }}>
      {Array.from({ length: count }).map((_, i) => (
        <polyline
          key={i}
          points={`${i * 20},12 ${i * 20 + 10},0 ${i * 20 + 20},12`}
          fill="none"
          stroke={GOLD}
          strokeWidth="1"
          opacity="0.4"
        />
      ))}
    </svg>
  );
}

function DecoCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const flip = position.includes("r") ? "scaleX(-1)" : "";
  const flipY = position.includes("b") ? "scaleY(-1)" : "";
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className="absolute"
      style={{
        top: position.includes("t") ? -1 : undefined,
        bottom: position.includes("b") ? -1 : undefined,
        left: position.includes("l") ? -1 : undefined,
        right: position.includes("r") ? -1 : undefined,
        transform: `${flip} ${flipY}`,
      }}
    >
      <path d="M0 0 L28 0 L28 4 L4 4 L4 28 L0 28 Z" fill={GOLD} opacity="0.6" />
      <path d="M0 0 L12 0 L12 2 L2 2 L2 12 L0 12 Z" fill={GOLD} opacity="0.9" />
    </svg>
  );
}

// ---------- types ----------
interface ModalState {
  mode: "create" | "view";
  roomId: string;
  hour: number;
  booking?: Booking;
}

// ---------- main component ----------
export default function Design2() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [now, setNow] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const currentHourFrac = now.getHours() + now.getMinutes() / 60;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function getBookingsForRoom(roomId: string) {
    return bookings.filter((b) => b.roomId === roomId && b.date === todayStr);
  }

  function getBookingAtHour(roomId: string, hour: number) {
    return bookings.find(
      (b) => b.roomId === roomId && b.date === todayStr && hour >= b.startHour && hour < b.endHour,
    );
  }

  function handleSlotClick(roomId: string, hour: number) {
    const existing = getBookingAtHour(roomId, hour);
    if (existing) {
      setModal({ mode: "view", roomId, hour, booking: existing });
    } else {
      setFormTitle("");
      setFormOrganizer("");
      setModal({ mode: "create", roomId, hour });
    }
  }

  function handleCreate() {
    if (!modal || !formTitle.trim() || !formOrganizer.trim()) return;
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      roomId: modal.roomId,
      title: formTitle.trim(),
      organizer: formOrganizer.trim(),
      startHour: modal.hour,
      endHour: modal.hour + 1,
      date: todayStr,
    };
    setBookings((prev) => [...prev, newBooking]);
    setModal(null);
  }

  function handleDelete(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setModal(null);
  }

  const roomByModal = modal ? ROOMS.find((r) => r.id === modal.roomId) : null;

  return (
    <>
      {/* inject keyframes */}
      <style dangerouslySetInnerHTML={{ __html: keyframeCSS }} />

      <div
        className="min-h-screen w-full"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, #1a1510 0%, ${BLACK} 70%),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 59px,
              ${GOLD}08 59px,
              ${GOLD}08 60px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 59px,
              ${GOLD}06 59px,
              ${GOLD}06 60px
            )
          `,
          fontFamily: "'Raleway', sans-serif",
          color: CREAM,
        }}
      >
        {/* ===== GRAND HEADER ===== */}
        <header
          className="relative pt-12 pb-8 text-center overflow-hidden"
          style={{
            animation: mounted ? "fadeSlideUp 0.8s ease-out both" : "none",
          }}
        >
          {/* Top chevron border */}
          <ChevronBorder />

          {/* Decorative fan behind title */}
          <div className="flex justify-center mt-6 mb-2 opacity-40">
            <ArtDecoFan size={160} />
          </div>

          {/* Subtitle above */}
          <p
            className="tracking-[0.5em] uppercase text-xs mb-2"
            style={{ color: GOLD, fontFamily: "'Raleway', sans-serif", fontWeight: 300 }}
          >
            Nijmegen Startup Rooms
          </p>

          {/* Main title */}
          <h1
            className="text-5xl md:text-7xl font-black tracking-wide"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: CREAM,
              textShadow: `0 0 40px ${GOLD}44, 0 2px 0 ${GOLD}22`,
            }}
          >
            THE GRAND SCHEDULE
          </h1>

          {/* Gold line under title */}
          <div className="flex justify-center mt-4">
            <div
              className="h-px w-64"
              style={{
                background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
              }}
            />
          </div>

          {/* Date */}
          <p className="mt-3 text-sm tracking-widest uppercase opacity-60" style={{ fontWeight: 300 }}>
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>

          {/* Current time */}
          <div className="flex items-center justify-center mt-2 gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: GOLD, animation: "pulseGold 2s ease-in-out infinite" }}
            />
            <span className="text-xs tracking-widest" style={{ color: GOLD }}>
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Bottom chevron */}
          <div className="mt-6">
            <ChevronBorder />
          </div>
        </header>

        <SunburstDivider />

        {/* ===== ROOM GRID ===== */}
        <main className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {ROOMS.map((room, roomIndex) => (
              <RoomCard
                key={room.id}
                room={room}
                index={roomIndex}
                mounted={mounted}
                bookings={getBookingsForRoom(room.id)}
                currentHourFrac={currentHourFrac}
                onSlotClick={handleSlotClick}
                getBookingAtHour={getBookingAtHour}
              />
            ))}
          </div>
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="pb-12 text-center">
          <SunburstDivider />
          <p className="text-xs tracking-[0.4em] uppercase opacity-30" style={{ fontWeight: 300 }}>
            Est. MMXXVI
          </p>
        </footer>
      </div>

      {/* ===== MODAL ===== */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: `${BLACK}dd`,
            backdropFilter: "blur(8px)",
            animation: "fadeSlideUp 0.3s ease-out both",
          }}
          onClick={() => setModal(null)}
        >
          <div
            className="relative w-full max-w-md p-8"
            style={{
              background: `linear-gradient(145deg, #141414, ${BLACK_CARD})`,
              border: `2px solid ${GOLD}66`,
              boxShadow: `0 0 60px ${GOLD}22, inset 0 1px 0 ${GOLD}33`,
              animation: "fadeSlideUp 0.4s ease-out both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ornamental corners */}
            <DecoCorner position="tl" />
            <DecoCorner position="tr" />
            <DecoCorner position="bl" />
            <DecoCorner position="br" />

            {/* Fan */}
            <div className="flex justify-center mb-4 opacity-30">
              <ArtDecoFan size={80} />
            </div>

            {/* Room name */}
            <h2
              className="text-center text-2xl font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', serif", color: CREAM }}
            >
              {roomByModal?.name}
            </h2>
            <p className="text-center text-xs tracking-[0.3em] uppercase mb-6" style={{ color: GOLD, opacity: 0.7 }}>
              {modal.mode === "create" ? "New Reservation" : "Reservation Details"}
            </p>

            {/* Thin divider */}
            <div className="mb-6 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}44, transparent)` }} />

            {modal.mode === "create" ? (
              <>
                {/* Time display */}
                <div
                  className="text-center mb-6 py-3 px-4"
                  style={{
                    border: `1px solid ${GOLD}33`,
                    background: `${GOLD}08`,
                  }}
                >
                  <span className="text-xs tracking-[0.3em] uppercase block mb-1" style={{ color: GOLD, opacity: 0.6 }}>
                    Time Slot
                  </span>
                  <span className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatHour(modal.hour)} &mdash; {formatHour(modal.hour + 1)}
                  </span>
                </div>

                {/* Form fields */}
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, opacity: 0.7 }}>
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Enter title..."
                      className="w-full px-4 py-3 text-sm outline-none"
                      style={{
                        background: `${BLACK}cc`,
                        border: `1px solid ${GOLD}33`,
                        color: CREAM,
                        fontFamily: "'Raleway', sans-serif",
                        transition: "border-color 0.3s",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = `${GOLD}88`)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = `${GOLD}33`)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, opacity: 0.7 }}>
                      Organizer
                    </label>
                    <input
                      type="text"
                      value={formOrganizer}
                      onChange={(e) => setFormOrganizer(e.target.value)}
                      placeholder="Your name..."
                      className="w-full px-4 py-3 text-sm outline-none"
                      style={{
                        background: `${BLACK}cc`,
                        border: `1px solid ${GOLD}33`,
                        color: CREAM,
                        fontFamily: "'Raleway', sans-serif",
                        transition: "border-color 0.3s",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = `${GOLD}88`)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = `${GOLD}33`)}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-3 text-xs tracking-[0.2em] uppercase cursor-pointer"
                    style={{
                      background: "transparent",
                      border: `1px solid ${CREAM}22`,
                      color: CREAM,
                      opacity: 0.6,
                      fontFamily: "'Raleway', sans-serif",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.borderColor = `${CREAM}55`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.6";
                      e.currentTarget.style.borderColor = `${CREAM}22`;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 py-3 text-xs tracking-[0.2em] uppercase cursor-pointer font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}44)`,
                      border: `1px solid ${GOLD}88`,
                      color: GOLD,
                      fontFamily: "'Raleway', sans-serif",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${GOLD}44, ${GOLD}66)`;
                      e.currentTarget.style.boxShadow = `0 0 20px ${GOLD}33`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${GOLD}22, ${GOLD}44)`;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    Reserve
                  </button>
                </div>
              </>
            ) : modal.booking ? (
              <>
                {/* Booking ticket display */}
                <div
                  className="mb-6 p-5 relative"
                  style={{
                    border: `1px solid ${GOLD}44`,
                    background: `linear-gradient(135deg, ${GOLD}08, transparent)`,
                  }}
                >
                  {/* Dashed ticket edge */}
                  <div
                    className="absolute top-0 bottom-0 right-0 w-px"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to bottom, ${GOLD}44 0, ${GOLD}44 6px, transparent 6px, transparent 12px)`,
                    }}
                  />

                  <div className="mb-3">
                    <span className="text-xs tracking-[0.2em] uppercase block mb-1" style={{ color: GOLD, opacity: 0.6 }}>
                      Event
                    </span>
                    <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {modal.booking.title}
                    </span>
                  </div>

                  <div className="flex gap-6">
                    <div>
                      <span className="text-xs tracking-[0.2em] uppercase block mb-1" style={{ color: GOLD, opacity: 0.6 }}>
                        Host
                      </span>
                      <span className="text-sm">{modal.booking.organizer}</span>
                    </div>
                    <div>
                      <span className="text-xs tracking-[0.2em] uppercase block mb-1" style={{ color: GOLD, opacity: 0.6 }}>
                        Time
                      </span>
                      <span className="text-sm">
                        {formatHour(modal.booking.startHour)} &mdash; {formatHour(modal.booking.endHour)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-3 text-xs tracking-[0.2em] uppercase cursor-pointer"
                    style={{
                      background: "transparent",
                      border: `1px solid ${CREAM}22`,
                      color: CREAM,
                      fontFamily: "'Raleway', sans-serif",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${CREAM}55`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${CREAM}22`;
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDelete(modal.booking!.id)}
                    className="flex-1 py-3 text-xs tracking-[0.2em] uppercase cursor-pointer"
                    style={{
                      background: `${BURGUNDY}44`,
                      border: `1px solid ${BURGUNDY}`,
                      color: "#ff6b6b",
                      fontFamily: "'Raleway', sans-serif",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${BURGUNDY}88`;
                      e.currentTarget.style.boxShadow = `0 0 20px ${BURGUNDY}55`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${BURGUNDY}44`;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    Cancel Booking
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Room Card ----------
function RoomCard({
  room,
  index,
  mounted,
  bookings,
  currentHourFrac,
  onSlotClick,
  getBookingAtHour,
}: {
  room: Room;
  index: number;
  mounted: boolean;
  bookings: Booking[];
  currentHourFrac: number;
  onSlotClick: (roomId: string, hour: number) => void;
  getBookingAtHour: (roomId: string, hour: number) => Booking | undefined;
}) {
  return (
    <div
      className="relative"
      style={{
        animation: mounted ? `fadeSlideUp 0.6s ease-out ${index * 0.1}s both` : "none",
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, #161616, ${BLACK_CARD})`,
          border: `1px solid ${GOLD}33`,
          boxShadow: `0 4px 30px ${BLACK}88`,
          transition: "all 0.4s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${GOLD}66`;
          e.currentTarget.style.boxShadow = `0 8px 40px ${GOLD}15, 0 0 1px ${GOLD}44`;
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${GOLD}33`;
          e.currentTarget.style.boxShadow = `0 4px 30px ${BLACK}88`;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Ornamental corners */}
        <DecoCorner position="tl" />
        <DecoCorner position="tr" />
        <DecoCorner position="bl" />
        <DecoCorner position="br" />

        {/* ---- Card Header ---- */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          {/* Background fan */}
          <div className="absolute inset-x-0 top-0 flex justify-center opacity-15 pointer-events-none">
            <ArtDecoFan size={200} />
          </div>

          {/* Double line top */}
          <div className="flex justify-center mb-4">
            <div className="w-16 flex flex-col gap-1">
              <div className="h-px" style={{ background: GOLD, opacity: 0.5 }} />
              <div className="h-px" style={{ background: GOLD, opacity: 0.3 }} />
            </div>
          </div>

          {/* Room name */}
          <h2
            className="text-2xl font-bold tracking-wider uppercase relative z-10"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: CREAM,
              textShadow: `0 0 20px ${GOLD}33`,
            }}
          >
            {room.name}
          </h2>

          {/* Room info */}
          <div className="flex items-center justify-center gap-3 mt-2 relative z-10">
            <span className="text-xs tracking-[0.15em] uppercase" style={{ color: GOLD, opacity: 0.6 }}>
              Floor {room.floor}
            </span>
            <span style={{ color: GOLD, opacity: 0.3 }}>&#9670;</span>
            <span className="text-xs tracking-[0.15em] uppercase" style={{ color: GOLD, opacity: 0.6 }}>
              {room.capacity} Seats
            </span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap justify-center gap-2 mt-3 relative z-10">
            {room.amenities.map((a) => (
              <span
                key={a}
                className="text-[10px] tracking-[0.15em] uppercase px-2 py-0.5"
                style={{
                  border: `1px solid ${GOLD}22`,
                  color: CREAM,
                  opacity: 0.5,
                }}
              >
                {a}
              </span>
            ))}
          </div>

          {/* Bottom divider */}
          <div className="mt-4">
            <ChevronBorder />
          </div>
        </div>

        {/* ---- Timeline ---- */}
        <div className="px-4 pb-5">
          {HOURS.map((hour) => {
            const booking = getBookingAtHour(room.id, hour);
            const isBooked = !!booking;
            const isStartOfBooking = booking && booking.startHour === hour;
            const isContinuation = booking && booking.startHour < hour;
            const isCurrentHour = currentHourFrac >= hour && currentHourFrac < hour + 1;

            // skip continuation slots visually (they're merged into the start block)
            if (isContinuation) return null;

            const blockHeight = booking ? (booking.endHour - booking.startHour) : 1;

            return (
              <div
                key={hour}
                className="flex gap-3 relative cursor-pointer group"
                style={{
                  minHeight: `${blockHeight * 44}px`,
                  transition: "all 0.2s",
                }}
                onClick={() => onSlotClick(room.id, hour)}
              >
                {/* Time label */}
                <div
                  className="w-14 shrink-0 text-right pt-1"
                  style={{ fontSize: "10px", letterSpacing: "0.1em", color: isCurrentHour ? GOLD : `${CREAM}55` }}
                >
                  {formatHour(hour)}
                </div>

                {/* Current time indicator */}
                {isCurrentHour && (
                  <div
                    className="absolute left-16 right-0 h-px z-10 pointer-events-none"
                    style={{
                      top: `${((currentHourFrac - hour) / blockHeight) * 100}%`,
                      background: GOLD,
                      boxShadow: `0 0 8px ${GOLD}88`,
                    }}
                  >
                    <div
                      className="absolute -left-1 -top-1 w-2 h-2 rounded-full"
                      style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }}
                    />
                  </div>
                )}

                {/* Slot / Booking block */}
                <div className="flex-1 relative">
                  {isBooked && isStartOfBooking ? (
                    <div
                      className="w-full p-3 relative overflow-hidden"
                      style={{
                        height: `${blockHeight * 44 - 4}px`,
                        background: `linear-gradient(135deg, ${GOLD}11, ${GOLD}06)`,
                        borderLeft: `2px solid ${GOLD}88`,
                        borderTop: `1px solid ${GOLD}22`,
                        borderBottom: `1px solid ${GOLD}22`,
                        borderRight: `1px solid ${GOLD}22`,
                        transition: "all 0.3s",
                      }}
                    >
                      {/* Deco ticket dashes on right */}
                      <div
                        className="absolute top-2 bottom-2 right-3 w-px"
                        style={{
                          backgroundImage: `repeating-linear-gradient(to bottom, ${GOLD}33 0, ${GOLD}33 4px, transparent 4px, transparent 8px)`,
                        }}
                      />
                      <div className="text-sm font-semibold truncate pr-6" style={{ color: CREAM, fontFamily: "'Playfair Display', serif" }}>
                        {booking!.title}
                      </div>
                      <div className="text-[10px] tracking-wider mt-1 truncate" style={{ color: GOLD, opacity: 0.7 }}>
                        {booking!.organizer}
                      </div>
                      {blockHeight > 1 && (
                        <div className="text-[10px] tracking-wider mt-1" style={{ color: `${CREAM}44` }}>
                          {formatHour(booking!.startHour)} &mdash; {formatHour(booking!.endHour)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-full h-10 border-b flex items-center justify-center"
                      style={{
                        borderColor: `${GOLD}11`,
                        background: BLACK_SLOT,
                        transition: "all 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${GOLD}0a`;
                        e.currentTarget.style.borderColor = `${GOLD}33`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = BLACK_SLOT;
                        e.currentTarget.style.borderColor = `${GOLD}11`;
                      }}
                    >
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                        style={{ color: GOLD }}
                      >
                        + Reserve
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
