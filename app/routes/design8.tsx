import { useState, useMemo } from "react";
import {
  ROOMS,
  INITIAL_BOOKINGS,
  HOURS,
  formatHour,
  type Booking,
  type Room,
} from "../data/rooms";
import type { Route } from "./+types/design8";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Room Bookings — Agenda" }];
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
    href: "https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap",
  },
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFriendlyDate() {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getCurrentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function getRoomById(id: string): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}

function StatusDot({ status }: { status: "available" | "in-use" | "soon" }) {
  const colors = {
    available: "bg-green-500",
    "in-use": "bg-red-500",
    soon: "bg-yellow-500",
  };
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`}
    />
  );
}

// ---- Booking Form ----

interface BookingFormProps {
  rooms: Room[];
  preselectedRoomId?: string;
  onSubmit: (booking: Omit<Booking, "id">) => void;
  onCancel: () => void;
}

function BookingForm({
  rooms,
  preselectedRoomId,
  onSubmit,
  onCancel,
}: BookingFormProps) {
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [roomId, setRoomId] = useState(preselectedRoomId || rooms[0]?.id || "");
  const [startHour, setStartHour] = useState(HOURS[0]);
  const [endHour, setEndHour] = useState(HOURS[1]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizer.trim() || endHour <= startHour) return;
    onSubmit({
      roomId,
      title: title.trim(),
      organizer: organizer.trim(),
      startHour,
      endHour,
      date: getTodayStr(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Organizer
          </label>
          <input
            type="text"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="Your name"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Room
          </label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capacity} people)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Start
          </label>
          <select
            value={startHour}
            onChange={(e) => {
              const v = Number(e.target.value);
              setStartHour(v);
              if (endHour <= v) setEndHour(v + 1);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            End
          </label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          >
            {HOURS.filter((h) => h > startHour)
              .concat([HOURS[HOURS.length - 1] + 1])
              .map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Create Booking
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---- Booking Detail ----

interface BookingDetailProps {
  booking: Booking;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function BookingDetail({ booking, onDelete, onClose }: BookingDetailProps) {
  const room = getRoomById(booking.roomId);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{booking.title}</h3>
          <p className="text-sm text-gray-500">
            Organized by {booking.organizer}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 transition hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>
          {formatHour(booking.startHour)} &ndash; {formatHour(booking.endHour)}
        </span>
        {room && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700">
            {room.name}
          </span>
        )}
      </div>
      <button
        onClick={() => onDelete(booking.id)}
        className="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
      >
        Delete Booking
      </button>
    </div>
  );
}

// ---- Main Component ----

export default function Design8() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState<string | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [allRoomsExpanded, setAllRoomsExpanded] = useState(false);

  const now = getCurrentHourFraction();
  const today = getTodayStr();

  const todayBookings = useMemo(
    () => bookings.filter((b) => b.date === today),
    [bookings, today],
  );

  const happeningNow = useMemo(
    () => todayBookings.filter((b) => b.startHour <= now && b.endHour > now),
    [todayBookings, now],
  );

  const comingUp = useMemo(
    () =>
      todayBookings
        .filter((b) => b.startHour > now)
        .sort((a, b) => a.startHour - b.startHour)
        .slice(0, 4),
    [todayBookings, now],
  );

  const busyRoomIds = useMemo(
    () => new Set(happeningNow.map((b) => b.roomId)),
    [happeningNow],
  );

  const soonBookedRoomIds = useMemo(() => {
    const soon = new Set<string>();
    for (const b of todayBookings) {
      if (b.startHour > now && b.startHour <= now + 0.5) {
        soon.add(b.roomId);
      }
    }
    return soon;
  }, [todayBookings, now]);

  const availableRooms = useMemo(
    () => ROOMS.filter((r) => !busyRoomIds.has(r.id)),
    [busyRoomIds],
  );

  function getRoomStatus(
    roomId: string,
  ): "available" | "in-use" | "soon" {
    if (busyRoomIds.has(roomId)) return "in-use";
    if (soonBookedRoomIds.has(roomId)) return "soon";
    return "available";
  }

  function addBooking(data: Omit<Booking, "id">) {
    const id = `b${Date.now()}`;
    setBookings((prev) => [...prev, { ...data, id }]);
    setShowBookingForm(false);
    setPreselectedRoom(undefined);
  }

  function deleteBooking(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setSelectedBooking(null);
  }

  function openBookingForm(roomId?: string) {
    setPreselectedRoom(roomId);
    setShowBookingForm(true);
    setSelectedBooking(null);
  }

  function toggleRoom(roomId: string) {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }

  function getBookingsForRoom(roomId: string) {
    return todayBookings
      .filter((b) => b.roomId === roomId)
      .sort((a, b) => a.startHour - b.startHour);
  }

  const activeDetail = selectedBooking
    ? bookings.find((b) => b.id === selectedBooking)
    : null;

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Nunito Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getFriendlyDate()}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Meeting room schedule
            </p>
          </div>
          <button
            onClick={() => openBookingForm()}
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Book a Room
          </button>
        </div>

        {/* Booking Form (inline) */}
        {showBookingForm && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">
              New Booking
            </h2>
            <BookingForm
              rooms={ROOMS}
              preselectedRoomId={preselectedRoom}
              onSubmit={addBooking}
              onCancel={() => {
                setShowBookingForm(false);
                setPreselectedRoom(undefined);
              }}
            />
          </div>
        )}

        {/* Booking Detail (inline) */}
        {activeDetail && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <BookingDetail
              booking={activeDetail}
              onDelete={deleteBooking}
              onClose={() => setSelectedBooking(null)}
            />
          </div>
        )}

        {/* Happening Now */}
        {happeningNow.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
              Happening Now
            </h2>
            <div className="space-y-2">
              {happeningNow.map((b) => {
                const room = getRoomById(b.roomId);
                const minutesLeft = Math.round((b.endHour - now) * 60);
                return (
                  <button
                    key={b.id}
                    onClick={() =>
                      setSelectedBooking(
                        selectedBooking === b.id ? null : b.id,
                      )
                    }
                    className="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:bg-gray-50"
                    style={{ borderLeftWidth: 4, borderLeftColor: "#0D9488" }}
                  >
                    <div className="w-28 shrink-0 text-sm font-medium text-teal-700">
                      {formatHour(b.startHour)} &ndash;{" "}
                      {formatHour(b.endHour)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-gray-900">
                        {b.title}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        {b.organizer}
                      </div>
                    </div>
                    {room && (
                      <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                        {room.name}
                      </span>
                    )}
                    <span className="shrink-0 text-xs font-medium text-gray-400">
                      {minutesLeft}m left
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Coming Up */}
        {comingUp.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
              Coming Up
            </h2>
            <div className="space-y-2">
              {comingUp.map((b) => {
                const room = getRoomById(b.roomId);
                return (
                  <button
                    key={b.id}
                    onClick={() =>
                      setSelectedBooking(
                        selectedBooking === b.id ? null : b.id,
                      )
                    }
                    className="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:bg-gray-50"
                  >
                    <div className="w-28 shrink-0 text-sm font-medium text-gray-600">
                      {formatHour(b.startHour)} &ndash;{" "}
                      {formatHour(b.endHour)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-gray-900">
                        {b.title}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        {b.organizer}
                      </div>
                    </div>
                    {room && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                        {room.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Available Now */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
            Available Now
          </h2>
          {availableRooms.length === 0 ? (
            <p className="py-4 text-sm text-gray-400">
              All rooms are currently occupied.
            </p>
          ) : (
            <div className="space-y-2">
              {availableRooms.map((room) => {
                const status = getRoomStatus(room.id);
                return (
                  <div
                    key={room.id}
                    className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <StatusDot status={status} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900">
                        {room.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {room.capacity} people &middot;{" "}
                        {room.amenities.join(", ")}
                      </div>
                    </div>
                    <button
                      onClick={() => openBookingForm(room.id)}
                      className="shrink-0 rounded-lg border border-teal-600 px-4 py-1.5 text-sm font-semibold text-teal-600 transition hover:bg-teal-50"
                    >
                      Book Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* All Rooms */}
        <section>
          <button
            onClick={() => setAllRoomsExpanded(!allRoomsExpanded)}
            className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase transition hover:text-gray-600"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${allRoomsExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            All Rooms ({ROOMS.length})
          </button>

          {allRoomsExpanded && (
            <div className="space-y-2">
              {ROOMS.map((room) => {
                const status = getRoomStatus(room.id);
                const isExpanded = expandedRooms.has(room.id);
                const roomBookings = getBookingsForRoom(room.id);

                return (
                  <div
                    key={room.id}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                  >
                    <button
                      onClick={() => toggleRoom(room.id)}
                      className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-gray-50"
                    >
                      <StatusDot status={status} />
                      <svg
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-gray-900">
                          {room.name}
                        </span>
                        <span className="ml-2 text-sm text-gray-400">
                          Floor {room.floor} &middot; {room.capacity} people
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {roomBookings.length} booking
                        {roomBookings.length !== 1 ? "s" : ""} today
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                        {roomBookings.length === 0 ? (
                          <p className="py-2 text-sm text-gray-400">
                            No bookings today
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {roomBookings.map((b) => {
                              const isNow =
                                b.startHour <= now && b.endHour > now;
                              return (
                                <button
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBooking(
                                      selectedBooking === b.id ? null : b.id,
                                    );
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-white ${
                                    isNow ? "bg-teal-50" : ""
                                  }`}
                                >
                                  <span
                                    className={`w-28 shrink-0 font-medium ${isNow ? "text-teal-700" : "text-gray-500"}`}
                                  >
                                    {formatHour(b.startHour)} &ndash;{" "}
                                    {formatHour(b.endHour)}
                                  </span>
                                  <span className="truncate font-semibold text-gray-800">
                                    {b.title}
                                  </span>
                                  <span className="ml-auto shrink-0 text-xs text-gray-400">
                                    {b.organizer}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <button
                          onClick={() => openBookingForm(room.id)}
                          className="mt-3 text-sm font-medium text-teal-600 transition hover:text-teal-700"
                        >
                          + Add booking
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
