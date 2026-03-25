import { useEffect, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router";

import { HOURS, ROOMS, formatHour, type Booking } from "../data/rooms";
import type { Route } from "./+types/design7";

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

const SIDEBAR_WIDTH = 200;
const HOUR_WIDTH = 140;
const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 48;
const ACCENT = "#6366F1";
const GOOGLE_CALENDAR_TIME_ZONE = "Europe/Amsterdam";

const ROOM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  stadsschouwburg: { bg: "#FFF0EB", border: "#FF5C3D", text: "#9A3412" },
  "de-vereeniging": { bg: "#F3EBFF", border: "#A675E8", text: "#6B21A8" },
  lindenberg: { bg: "#F5FAD9", border: "#B8DD5E", text: "#4D7C0F" },
  lux: { bg: "#E8FBF5", border: "#8DDEC9", text: "#0F766E" },
  merleyn: { bg: "#FFF7D6", border: "#FFD45F", text: "#92400E" },
  doornroosje: { bg: "#F1EAFE", border: "#B090FF", text: "#6D28D9" },
};

function getColor(roomId: string) {
  return ROOM_COLORS[roomId] ?? { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" };
}

function getCurrentTimeOffset(): number | null {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const startHour = HOURS[0];
  const endHour = HOURS[HOURS.length - 1] + 1;

  if (h < startHour || h >= endHour) {
    return null;
  }

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

function formatBookingWindow(startHour: number, endHour: number) {
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

function getTimeZoneOffsetLabel(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!offset) {
    throw new Error("Unable to determine Amsterdam time zone offset.");
  }

  return offset.replace("GMT", "");
}

function getAmsterdamDayBounds() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    year: "numeric",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine current date in Amsterdam.");
  }

  return {
    date: `${year}-${month}-${day}`,
    timeMax: `${year}-${month}-${day}T23:59:59${getTimeZoneOffsetLabel(now)}`,
    timeMin: `${year}-${month}-${day}T00:00:00${getTimeZoneOffsetLabel(now)}`,
  };
}

function getHourValue(dateTime: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
  }).formatToParts(new Date(dateTime));
  const hourValue = parts.find((part) => part.type === "hour")?.value;
  const minuteValue = parts.find((part) => part.type === "minute")?.value;

  if (!hourValue || !minuteValue) {
    throw new Error(`Unable to parse time value: ${dateTime}`);
  }

  return Number(hourValue) + Number(minuteValue) / 60;
}

function clampHour(value: number) {
  const min = HOURS[0];
  const max = HOURS[HOURS.length - 1] + 1;

  return Math.min(Math.max(value, min), max);
}

interface LoaderData {
  bookings: Booking[];
  isAuthenticated: boolean;
  roomCount: number;
}

export async function loader({ request }: Route.LoaderArgs): Promise<LoaderData> {
  const [{ createAuthorizedCalendarClient }, { getSession, readGoogleSession }] = await Promise.all(
    [import("../lib/google.server"), import("../lib/session.server")],
  );
  const session = await getSession(request);
  const googleSession = readGoogleSession(session);

  if (!googleSession) {
    return {
      bookings: [],
      isAuthenticated: false,
      roomCount: ROOMS.length,
    };
  }

  const { calendar } = await createAuthorizedCalendarClient(googleSession.googleTokens);
  const { date, timeMax, timeMin } = getAmsterdamDayBounds();
  const calendarListResponse = await calendar.calendarList.list({
    minAccessRole: "reader",
    showDeleted: false,
    showHidden: false,
  });
  const allCalendars = calendarListResponse.data.items ?? [];
  const roomCalendars = ROOMS.map((room) => {
    const match = allCalendars.find(
      (calendarListEntry) =>
        calendarListEntry.summary === room.calendarSummary && !calendarListEntry.primary,
    );

    return {
      calendarId: match?.id ?? null,
      room,
    };
  }).filter((entry) => entry.calendarId !== null);

  const bookingGroups = await Promise.all(
    roomCalendars.map(async ({ calendarId, room }) => {
      if (!calendarId) {
        return [];
      }

      const eventsResponse = await calendar.events.list({
        calendarId,
        maxResults: 50,
        orderBy: "startTime",
        singleEvents: true,
        timeMax,
        timeMin,
        timeZone: GOOGLE_CALENDAR_TIME_ZONE,
      });

      return (
        eventsResponse.data.items?.flatMap((event) => {
          if (!event.id || !event.start?.dateTime || !event.end?.dateTime) {
            return [];
          }

          const startHour = clampHour(getHourValue(event.start.dateTime));
          const endHour = clampHour(getHourValue(event.end.dateTime));

          if (endHour <= HOURS[0] || startHour >= HOURS[HOURS.length - 1] + 1) {
            return [];
          }

          return [
            {
              date,
              endHour,
              id: event.id,
              organizer:
                event.organizer?.displayName ??
                event.organizer?.email ??
                event.creator?.displayName ??
                event.creator?.email ??
                "Google Calendar",
              roomId: room.id,
              startHour,
              title: event.summary ?? "Reserved",
            },
          ];
        }) ?? []
      );
    }),
  );

  return {
    bookings: bookingGroups.flat().sort((left, right) => left.startHour - right.startHour),
    isAuthenticated: true,
    roomCount: roomCalendars.length,
  };
}

type ModalMode = { kind: "view"; booking: Booking } | null;

export default function Design7() {
  const { bookings, isAuthenticated, roomCount } = useLoaderData<typeof loader>();
  const [modal, setModal] = useState<ModalMode>(null);
  const [now, setNow] = useState(getCurrentTimeOffset);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(getCurrentTimeOffset());
    }, 60_000);

    return () => {
      clearInterval(id);
    };
  }, []);

  function scrollToNow() {
    const offset = getCurrentTimeOffset();

    if (offset !== null && scrollRef.current) {
      scrollRef.current.scrollTo({
        behavior: "smooth",
        left: offset - scrollRef.current.clientWidth / 2,
      });
    }
  }

  const totalWidth = HOURS.length * HOUR_WIDTH;

  return (
    <div
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      className="min-h-screen bg-white text-gray-900"
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <p className="text-sm font-medium text-gray-500">{formatDate()}</p>
        <h1 className="text-lg font-semibold tracking-tight text-gray-900">Room Schedule</h1>
        {isAuthenticated ? (
          <button
            onClick={scrollToNow}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            Now
          </button>
        ) : (
          <Link
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
            to="/auth/google"
          >
            Connect Google
          </Link>
        )}
      </header>

      <div className="flex" style={{ height: "calc(100vh - 65px)" }}>
        <div className="shrink-0 border-r border-gray-200" style={{ width: SIDEBAR_WIDTH }}>
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
                  <p className="text-xs text-gray-400">{room.capacityLabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ position: "relative", width: totalWidth }}>
            <div className="flex border-b border-gray-200" style={{ height: HEADER_HEIGHT }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="shrink-0 border-l border-gray-100 px-3 py-2 text-xs font-medium text-gray-400"
                  style={{ width: HOUR_WIDTH }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {ROOMS.map((room) => {
              const roomBookings = bookings.filter((booking) => booking.roomId === room.id);
              const color = getColor(room.id);

              return (
                <div
                  key={room.id}
                  className="relative border-b border-gray-50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-l border-gray-100"
                      style={{ left: (hour - HOURS[0]) * HOUR_WIDTH }}
                    />
                  ))}

                  {roomBookings.map((booking) => {
                    const left = (booking.startHour - HOURS[0]) * HOUR_WIDTH;
                    const width = Math.max((booking.endHour - booking.startHour) * HOUR_WIDTH, 24);

                    return (
                      <button
                        key={booking.id}
                        type="button"
                        className="absolute top-1.5 bottom-1.5 flex cursor-pointer items-center overflow-hidden rounded-lg px-3 text-left transition-shadow hover:shadow-md"
                        style={{
                          backgroundColor: color.bg,
                          borderLeft: `3px solid ${color.border}`,
                          left,
                          width,
                        }}
                        aria-label={`View booking ${booking.title} in ${room.name}`}
                        onClick={() => {
                          setModal({ kind: "view", booking });
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold leading-tight"
                            style={{ color: color.text }}
                          >
                            {booking.title}
                          </p>
                          <p
                            className="truncate text-xs"
                            style={{ color: color.text, opacity: 0.7 }}
                          >
                            {booking.organizer}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {now !== null && (
              <div
                className="pointer-events-none absolute"
                style={{
                  backgroundColor: "#EF4444",
                  bottom: 0,
                  height: HEADER_HEIGHT + ROOMS.length * ROW_HEIGHT,
                  left: now,
                  top: 0,
                  width: 2,
                  zIndex: 20,
                }}
              >
                <div
                  className="absolute -top-1 -left-1.5 h-3 w-3 rounded-full"
                  style={{ backgroundColor: "#EF4444" }}
                />
              </div>
            )}

            {!isAuthenticated && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/72 backdrop-blur-[1px]">
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-center shadow-lg">
                  <p className="text-base font-semibold text-gray-900">
                    Connect Google Calendar to load live room bookings
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    The schedule design stays the same. Only the data source changes.
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: ACCENT }}
                    to="/auth/google"
                  >
                    Connect Google
                  </Link>
                </div>
              </div>
            )}

            {isAuthenticated && bookings.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-center shadow-sm">
                  <p className="text-base font-semibold text-gray-900">No bookings today</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Checked {String(roomCount)} room calendars for today in Amsterdam time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
            aria-labelledby="booking-view-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            style={{ fontFamily: "'Source Sans 3', sans-serif", zIndex: 1 }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="booking-view-title" className="text-lg font-semibold text-gray-900">
                  {modal.booking.title}
                </h2>
                <p className="text-sm text-gray-400">
                  {ROOMS.find((room) => room.id === modal.booking.roomId)?.name} &middot;{" "}
                  {formatBookingWindow(modal.booking.startHour, modal.booking.endHour)}
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
                {formatBookingWindow(modal.booking.startHour, modal.booking.endHour)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Room:</span>{" "}
                {ROOMS.find((room) => room.id === modal.booking.roomId)?.calendarSummary}
              </p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
