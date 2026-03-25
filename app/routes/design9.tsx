import { useState, useEffect } from "react";
import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";
import type { Route } from "./+types/design9";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Room Bookings — Floor Plan" }];
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
    href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap",
  },
];

// Floor layout definitions: position each room on the floor plan
const FLOOR_LAYOUTS: Record<
  number,
  { roomId: string; x: number; y: number; w: number; h: number; side: "left" | "right" }[]
> = {
  1: [
    { roomId: "zenith", x: 40, y: 60, w: 220, h: 180, side: "left" },
    { roomId: "vertex", x: 540, y: 60, w: 220, h: 180, side: "right" },
  ],
  2: [
    { roomId: "nebula", x: 40, y: 60, w: 260, h: 180, side: "left" },
    { roomId: "prism", x: 500, y: 60, w: 260, h: 180, side: "right" },
  ],
  3: [
    { roomId: "aurora", x: 40, y: 60, w: 280, h: 180, side: "left" },
    { roomId: "cosmos", x: 480, y: 60, w: 280, h: 180, side: "right" },
  ],
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export default function Design9() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [activeFloor, setActiveFloor] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bookingForm, setBookingForm] = useState<{
    open: boolean;
    startHour: number;
    endHour: number;
    title: string;
    organizer: string;
  }>({ open: false, startHour: 8, endHour: 9, title: "", organizer: "" });
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  const today = getTodayStr();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const selectedRoom = ROOMS.find((r) => r.id === selectedRoomId) ?? null;

  function getRoomStatus(roomId: string): {
    available: boolean;
    currentBooking: Booking | null;
  } {
    const now = getCurrentHourFraction();
    const current = bookings.find(
      (b) =>
        b.roomId === roomId &&
        b.date === today &&
        b.startHour <= now &&
        b.endHour > now,
    );
    return { available: !current, currentBooking: current ?? null };
  }

  function getRoomBookings(roomId: string): Booking[] {
    return bookings
      .filter((b) => b.roomId === roomId && b.date === today)
      .sort((a, b) => a.startHour - b.startHour);
  }

  function openRoom(roomId: string) {
    setSelectedRoomId(roomId);
    setPanelOpen(true);
    setBookingForm({ open: false, startHour: 8, endHour: 9, title: "", organizer: "" });
    setViewingBooking(null);
  }

  function closePanel() {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedRoomId(null);
      setBookingForm({ open: false, startHour: 8, endHour: 9, title: "", organizer: "" });
      setViewingBooking(null);
    }, 300);
  }

  function openBookingForm(startHour: number) {
    setBookingForm({
      open: true,
      startHour,
      endHour: startHour + 1,
      title: "",
      organizer: "",
    });
    setViewingBooking(null);
  }

  function submitBooking() {
    if (!selectedRoomId || !bookingForm.title.trim() || !bookingForm.organizer.trim()) return;
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      roomId: selectedRoomId,
      title: bookingForm.title.trim(),
      organizer: bookingForm.organizer.trim(),
      startHour: bookingForm.startHour,
      endHour: bookingForm.endHour,
      date: today,
    };
    setBookings((prev) => [...prev, newBooking]);
    setBookingForm({ open: false, startHour: 8, endHour: 9, title: "", organizer: "" });
  }

  function deleteBooking(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setViewingBooking(null);
  }

  function isSlotFree(roomId: string, hour: number): boolean {
    return !bookings.some(
      (b) =>
        b.roomId === roomId &&
        b.date === today &&
        b.startHour <= hour &&
        b.endHour > hour,
    );
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const floorRooms = FLOOR_LAYOUTS[activeFloor] ?? [];

  return (
    <div
      style={{ fontFamily: "'Figtree', sans-serif" }}
      className="min-h-screen"
      css-bg="#FAFAF8"
    >
      <style>{`
        @keyframes roomPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 16px 4px rgba(34, 197, 94, 0.2); }
        }
        .room-available { animation: roomPulse 3s ease-in-out infinite; }
        .panel-slide-in { animation: slideIn 0.3s ease-out forwards; }
        .panel-slide-out { animation: slideOut 0.3s ease-in forwards; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
      `}</style>

      <div style={{ background: "#FAFAF8" }} className="min-h-screen flex flex-col">
        {/* Top Bar */}
        <header
          style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}
          className="px-6 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold" style={{ color: "#1A1A18" }}>
              Startup Rooms
            </h1>
            <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F3F3F0" }}>
              {[1, 2, 3].map((floor) => (
                <button
                  key={floor}
                  onClick={() => setActiveFloor(floor)}
                  className="px-4 py-2 rounded-md text-sm font-semibold transition-all"
                  style={{
                    background: activeFloor === floor ? "#FFFFFF" : "transparent",
                    color: activeFloor === floor ? "#F97316" : "#6B6B65",
                    boxShadow:
                      activeFloor === floor
                        ? "0 1px 3px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  Floor {floor}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#6B6B65" }}>
            <span className="font-medium" style={{ color: "#1A1A18" }}>
              {formatTime(currentTime)}
            </span>
            <span>{formatDate(currentTime)}</span>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Floor Plan */}
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              {/* Floor label */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "#F97316" }}
                >
                  {activeFloor}
                </div>
                <span className="text-lg font-semibold" style={{ color: "#1A1A18" }}>
                  Floor {activeFloor}
                </span>
                <span className="text-sm" style={{ color: "#9B9B95" }}>
                  {activeFloor === 1
                    ? "Small meeting rooms"
                    : activeFloor === 2
                      ? "Medium meeting rooms"
                      : "Large meeting rooms"}
                </span>
              </div>

              {/* Floor plan container */}
              <div
                className="relative rounded-2xl"
                style={{
                  background: "#FFFFFF",
                  border: "2px solid #E5E5E0",
                  width: "100%",
                  height: 360,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                }}
              >
                {/* Corridor — horizontal band in the middle */}
                <div
                  className="absolute rounded"
                  style={{
                    left: 30,
                    right: 30,
                    top: 260,
                    height: 50,
                    background: "#F3F3F0",
                    border: "1px dashed #D5D5D0",
                  }}
                />
                {/* Corridor label */}
                <div
                  className="absolute text-xs font-medium flex items-center justify-center"
                  style={{
                    left: 30,
                    right: 30,
                    top: 260,
                    height: 50,
                    color: "#AEAEA8",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  Corridor
                </div>

                {/* Rooms */}
                {floorRooms.map((layout) => {
                  const room = ROOMS.find((r) => r.id === layout.roomId);
                  if (!room) return null;
                  const { available, currentBooking } = getRoomStatus(room.id);
                  const isSelected = selectedRoomId === room.id && panelOpen;

                  return (
                    <button
                      key={room.id}
                      onClick={() => openRoom(room.id)}
                      className={`absolute rounded-xl transition-all cursor-pointer ${available ? "room-available" : ""}`}
                      style={{
                        left: layout.x,
                        top: layout.y,
                        width: layout.w,
                        height: layout.h,
                        background: available
                          ? "rgba(34, 197, 94, 0.06)"
                          : "rgba(239, 68, 68, 0.06)",
                        border: `2px solid ${available ? "#22C55E" : "#EF4444"}`,
                        outline: isSelected
                          ? `3px solid ${available ? "#22C55E" : "#EF4444"}`
                          : "none",
                        outlineOffset: 2,
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
                        <span
                          className="text-lg font-bold"
                          style={{ color: "#1A1A18" }}
                        >
                          {room.name}
                        </span>

                        {/* Capacity */}
                        <div
                          className="flex items-center gap-1 text-sm"
                          style={{ color: "#6B6B65" }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span>{room.capacity}</span>
                        </div>

                        {/* Status badge */}
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: available
                              ? "rgba(34, 197, 94, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                            color: available ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {available
                            ? "Available"
                            : `${currentBooking!.title} until ${formatHour(currentBooking!.endHour)}`}
                        </div>
                      </div>

                      {/* Door indicator — small notch on the corridor side */}
                      <div
                        className="absolute rounded"
                        style={{
                          bottom: -6,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 24,
                          height: 6,
                          background: available ? "#22C55E" : "#EF4444",
                        }}
                      />
                    </button>
                  );
                })}

                {/* Legend */}
                <div
                  className="absolute bottom-3 right-4 flex items-center gap-4 text-xs"
                  style={{ color: "#9B9B95" }}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ background: "#22C55E" }}
                    />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ background: "#EF4444" }}
                    />
                    Occupied
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          {panelOpen && selectedRoom && (
            <>
              {/* Backdrop on small screens */}
              <div
                className="fixed inset-0 bg-black/20 lg:hidden z-40"
                onClick={closePanel}
              />

              <div
                className="panel-slide-in fixed right-0 top-0 bottom-0 w-full max-w-md z-50 lg:relative lg:z-auto flex flex-col"
                style={{
                  background: "#FFFFFF",
                  borderLeft: "1px solid #E5E5E0",
                  boxShadow: "-4px 0 24px rgba(0,0,0,0.06)",
                }}
              >
                {/* Panel Header */}
                <div
                  className="px-6 py-5 flex items-center justify-between"
                  style={{ borderBottom: "1px solid #F0F0EB" }}
                >
                  <div>
                    <h2
                      className="text-lg font-bold"
                      style={{ color: "#1A1A18" }}
                    >
                      {selectedRoom.name}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: "#9B9B95" }}>
                      Floor {selectedRoom.floor} &middot; {selectedRoom.capacity}{" "}
                      people
                    </p>
                  </div>
                  <button
                    onClick={closePanel}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: "#9B9B95" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F3F3F0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Amenities */}
                <div
                  className="px-6 py-4"
                  style={{ borderBottom: "1px solid #F0F0EB" }}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.amenities.map((a) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{
                          background: "#F3F3F0",
                          color: "#6B6B65",
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scrollable timeline */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: "#1A1A18" }}
                  >
                    Today&apos;s Schedule
                  </h3>

                  {/* Booking detail view */}
                  {viewingBooking && (
                    <div
                      className="mb-4 p-4 rounded-xl"
                      style={{
                        background: "rgba(239, 68, 68, 0.06)",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "#1A1A18" }}
                          >
                            {viewingBooking.title}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#6B6B65" }}
                          >
                            {viewingBooking.organizer}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#9B9B95" }}
                          >
                            {formatHour(viewingBooking.startHour)} &ndash;{" "}
                            {formatHour(viewingBooking.endHour)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteBooking(viewingBooking.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: "#EF4444" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#DC2626")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#EF4444")
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Booking form */}
                  {bookingForm.open && (
                    <div
                      className="mb-4 p-4 rounded-xl"
                      style={{
                        background: "rgba(249, 115, 22, 0.06)",
                        border: "1px solid rgba(249, 115, 22, 0.2)",
                      }}
                    >
                      <p
                        className="text-sm font-semibold mb-3"
                        style={{ color: "#1A1A18" }}
                      >
                        New Booking
                      </p>
                      <div className="flex flex-col gap-2.5">
                        <input
                          type="text"
                          placeholder="Meeting title"
                          value={bookingForm.title}
                          onChange={(e) =>
                            setBookingForm((f) => ({
                              ...f,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{
                            border: "1px solid #E5E5E0",
                            background: "#FFFFFF",
                            color: "#1A1A18",
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Organizer"
                          value={bookingForm.organizer}
                          onChange={(e) =>
                            setBookingForm((f) => ({
                              ...f,
                              organizer: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{
                            border: "1px solid #E5E5E0",
                            background: "#FFFFFF",
                            color: "#1A1A18",
                          }}
                        />
                        <div className="flex gap-2">
                          <select
                            value={bookingForm.startHour}
                            onChange={(e) =>
                              setBookingForm((f) => ({
                                ...f,
                                startHour: Number(e.target.value),
                                endHour: Math.max(
                                  f.endHour,
                                  Number(e.target.value) + 1,
                                ),
                              }))
                            }
                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                              border: "1px solid #E5E5E0",
                              background: "#FFFFFF",
                              color: "#1A1A18",
                            }}
                          >
                            {HOURS.map((h) => (
                              <option key={h} value={h}>
                                {formatHour(h)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={bookingForm.endHour}
                            onChange={(e) =>
                              setBookingForm((f) => ({
                                ...f,
                                endHour: Number(e.target.value),
                              }))
                            }
                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                              border: "1px solid #E5E5E0",
                              background: "#FFFFFF",
                              color: "#1A1A18",
                            }}
                          >
                            {HOURS.filter((h) => h > bookingForm.startHour).map(
                              (h) => (
                                <option key={h} value={h}>
                                  {formatHour(h)}
                                </option>
                              ),
                            )}
                            <option value={18}>{formatHour(18)}</option>
                          </select>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={submitBooking}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                            style={{ background: "#F97316" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#EA680C")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "#F97316")
                            }
                          >
                            Book Room
                          </button>
                          <button
                            onClick={() =>
                              setBookingForm((f) => ({ ...f, open: false }))
                            }
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                              background: "#F3F3F0",
                              color: "#6B6B65",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="relative">
                    {HOURS.map((hour) => {
                      const booking = getRoomBookings(selectedRoom.id).find(
                        (b) => b.startHour === hour,
                      );
                      const isOccupied = !isSlotFree(selectedRoom.id, hour);
                      const isMidBooking =
                        isOccupied &&
                        !booking &&
                        getRoomBookings(selectedRoom.id).some(
                          (b) => b.startHour < hour && b.endHour > hour,
                        );

                      if (isMidBooking) return null;

                      const bookingForSlot = booking;
                      const slotSpan = bookingForSlot
                        ? bookingForSlot.endHour - bookingForSlot.startHour
                        : 1;

                      return (
                        <div
                          key={hour}
                          className="flex gap-3"
                          style={{
                            minHeight: slotSpan * 52,
                          }}
                        >
                          {/* Time label */}
                          <div
                            className="w-16 text-xs font-medium pt-1 text-right shrink-0"
                            style={{ color: "#9B9B95" }}
                          >
                            {formatHour(hour)}
                          </div>

                          {/* Slot */}
                          <div className="flex-1 relative pb-1">
                            <div
                              className="absolute left-0 top-0 bottom-0 w-px"
                              style={{ background: "#F0F0EB" }}
                            />
                            {bookingForSlot ? (
                              <button
                                onClick={() => {
                                  setViewingBooking(bookingForSlot);
                                  setBookingForm((f) => ({
                                    ...f,
                                    open: false,
                                  }));
                                }}
                                className="ml-3 w-[calc(100%-12px)] rounded-lg p-3 text-left transition-all"
                                style={{
                                  background: "rgba(239, 68, 68, 0.08)",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  height: slotSpan * 52 - 4,
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 0.14)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 0.08)")
                                }
                              >
                                <p
                                  className="text-sm font-semibold"
                                  style={{ color: "#1A1A18" }}
                                >
                                  {bookingForSlot.title}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: "#6B6B65" }}
                                >
                                  {bookingForSlot.organizer}
                                </p>
                              </button>
                            ) : (
                              <button
                                onClick={() => openBookingForm(hour)}
                                className="ml-3 w-[calc(100%-12px)] rounded-lg p-3 text-left transition-all group"
                                style={{
                                  border: "1px dashed #E5E5E0",
                                  height: 48,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "rgba(34, 197, 94, 0.06)";
                                  e.currentTarget.style.borderColor = "#22C55E";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  e.currentTarget.style.borderColor = "#E5E5E0";
                                }}
                              >
                                <span
                                  className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ color: "#22C55E" }}
                                >
                                  + Book this slot
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
