import { useEffect, useRef, useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import type { calendar_v3 } from "googleapis";

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

interface GoogleSessionTokens {
  accessToken?: string;
  expiryDate?: number;
  refreshToken: string;
  scope?: string;
  tokenType?: string;
}

interface ScheduleBooking extends Booking {
  calendarId: string;
  endLocal: string;
  startLocal: string;
}

interface RoomCalendarCandidate {
  accessRole: string;
  calendarId: string | null;
  room: (typeof ROOMS)[number];
}

interface RoomCalendarEntry {
  accessRole: string;
  calendarId: string;
  room: (typeof ROOMS)[number];
}

interface LoaderData {
  bookings: ScheduleBooking[];
  headers: { "Set-Cookie": string } | null;
  isAuthenticated: boolean;
  roomCalendarIds: Record<string, string>;
  roomCount: number;
}

interface ModalValues {
  bookingId?: string;
  endLocal: string;
  intent: "create" | "update";
  originalRoomId?: string;
  roomId: string;
  startLocal: string;
  title: string;
}

interface ActionData {
  defaultValues?: ModalValues;
  error: string;
}

type ModalState =
  | {
      kind: "create";
      values: ModalValues;
    }
  | {
      booking: ScheduleBooking;
      kind: "edit";
      values: ModalValues;
    }
  | null;

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

function getOffsetLabelForTimeZone(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!offset) {
    throw new Error(`Unable to determine time zone offset for ${timeZone}.`);
  }

  return offset.replace("GMT", "");
}

function getTimeZoneOffsetLabel(date: Date) {
  return getOffsetLabelForTimeZone(GOOGLE_CALENDAR_TIME_ZONE, date);
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

function formatDateTimeLocalInTimeZone(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!year || !month || !day || !hour || !minute) {
    throw new Error(`Unable to format date time value: ${value}`);
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function createDefaultBookingValues(roomId?: string) {
  const { date } = getAmsterdamDayBounds();
  const fallbackRoomId = ROOMS[0]?.id ?? "";
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
  }).formatToParts(now);
  const hourValue = parts.find((part) => part.type === "hour")?.value;

  if (!hourValue) {
    throw new Error("Unable to determine current Amsterdam hour.");
  }

  const nowHour = Number(hourValue);
  const minHour = HOURS[0];
  const maxHour = HOURS[HOURS.length - 1];
  const startHour = Math.min(Math.max(nowHour + 1, minHour), maxHour);
  const endHour = Math.min(startHour + 1, maxHour + 1);

  return {
    endLocal: `${date}T${String(endHour).padStart(2, "0")}:00`,
    intent: "create" as const,
    roomId: roomId ?? fallbackRoomId,
    startLocal: `${date}T${String(startHour).padStart(2, "0")}:00`,
    title: "",
  } satisfies ModalValues;
}

function parseDateTimeLocal(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function convertDateTimeLocalToTimeZoneIso(value: string, timeZone: string) {
  const date = new Date(`${value}:00Z`);
  const offset = getOffsetLabelForTimeZone(timeZone, date);

  return `${value}:00${offset}`;
}

function isRoomCalendarEntry(
  roomCalendar: RoomCalendarCandidate,
): roomCalendar is RoomCalendarEntry {
  return typeof roomCalendar.calendarId === "string";
}

function getRoomCalendarEntries(roomCalendars: RoomCalendarCandidate[]) {
  return roomCalendars.filter(isRoomCalendarEntry);
}

async function loadRoomCalendars(googleTokens: GoogleSessionTokens) {
  const { createAuthorizedCalendarClient } = await import("../lib/google.server");
  const { calendar, refreshedTokens } = await createAuthorizedCalendarClient(googleTokens);
  const calendarListResponse = await calendar.calendarList.list({
    minAccessRole: "reader",
    showDeleted: false,
    showHidden: false,
  });
  const allCalendars: calendar_v3.Schema$CalendarListEntry[] =
    calendarListResponse.data.items ?? [];
  const roomCalendars: RoomCalendarCandidate[] = ROOMS.map((room) => {
    const match = allCalendars.find(
      (calendarListEntry) =>
        calendarListEntry.summary === room.calendarSummary && !calendarListEntry.primary,
    );

    return {
      accessRole: match?.accessRole ?? "reader",
      calendarId: match?.id ?? null,
      room,
    };
  });

  return {
    calendar,
    refreshedTokens,
    roomCalendars: getRoomCalendarEntries(roomCalendars),
  };
}

function buildRoomCalendarIds(roomCalendars: RoomCalendarEntry[]) {
  return roomCalendars.reduce<Record<string, string>>((accumulator, entry) => {
    accumulator[entry.room.id] = entry.calendarId;
    return accumulator;
  }, {});
}

export async function loader({ request }: Route.LoaderArgs): Promise<LoaderData> {
  const [{ commitSession, getSession, readGoogleSession }] = await Promise.all([
    import("../lib/session.server"),
  ]);
  const session = await getSession(request);
  const googleSession = readGoogleSession(session);

  if (!googleSession) {
    const emptyBookings: ScheduleBooking[] = [];

    return {
      bookings: emptyBookings,
      headers: null,
      isAuthenticated: false,
      roomCalendarIds: {},
      roomCount: ROOMS.length,
    } satisfies LoaderData;
  }

  const { calendar, refreshedTokens, roomCalendars } = await loadRoomCalendars(
    googleSession.googleTokens,
  );
  const { date, timeMax, timeMin } = getAmsterdamDayBounds();
  const roomCalendarIds = buildRoomCalendarIds(roomCalendars);
  const bookingGroups = await Promise.all(
    roomCalendars.map(async ({ calendarId, room }) => {
      const eventsResponse = await calendar.events.list({
        calendarId,
        maxResults: 50,
        orderBy: "startTime",
        singleEvents: true,
        timeMax,
        timeMin,
        timeZone: GOOGLE_CALENDAR_TIME_ZONE,
      });

      const events: calendar_v3.Schema$Event[] = eventsResponse.data.items ?? [];

      return events.flatMap((event) => {
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
            calendarId,
            date,
            endHour,
            endLocal: formatDateTimeLocalInTimeZone(event.end.dateTime, GOOGLE_CALENDAR_TIME_ZONE),
            id: event.id,
            organizer:
              event.organizer?.displayName ??
              event.organizer?.email ??
              event.creator?.displayName ??
              event.creator?.email ??
              "Google Calendar",
            roomId: room.id,
            startHour,
            startLocal: formatDateTimeLocalInTimeZone(
              event.start.dateTime,
              GOOGLE_CALENDAR_TIME_ZONE,
            ),
            title: event.summary ?? "Reserved",
          },
        ] satisfies ScheduleBooking[];
      });
    }),
  );

  session.set("googleTokens", refreshedTokens);

  const bookings: ScheduleBooking[] = bookingGroups
    .flat()
    .sort((left: ScheduleBooking, right: ScheduleBooking) => left.startHour - right.startHour);

  return {
    bookings,
    headers: {
      "Set-Cookie": await commitSession(session),
    },
    isAuthenticated: true,
    roomCalendarIds,
    roomCount: roomCalendars.length,
  } satisfies LoaderData;
}

function buildActionError(error: string, defaultValues: ModalValues) {
  return {
    defaultValues,
    error,
  } satisfies ActionData;
}

export async function action({ request }: Route.ActionArgs) {
  const [{ commitSession, getSession, readGoogleSession }] = await Promise.all([
    import("../lib/session.server"),
  ]);
  const session = await getSession(request);
  const googleSession = readGoogleSession(session);

  if (!googleSession) {
    return redirect("/auth/google");
  }

  const formData = await request.formData();
  const intentValue = formData.get("intent");
  const titleValue = formData.get("title");
  const roomIdValue = formData.get("roomId");
  const bookingIdValue = formData.get("bookingId");
  const originalRoomIdValue = formData.get("originalRoomId");
  const startLocal = parseDateTimeLocal(formData.get("startLocal"));
  const endLocal = parseDateTimeLocal(formData.get("endLocal"));
  const intent = intentValue === "update" ? "update" : intentValue === "create" ? "create" : null;
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const roomId =
    typeof roomIdValue === "string" && ROOMS.some((room) => room.id === roomIdValue)
      ? roomIdValue
      : "";
  const bookingId = typeof bookingIdValue === "string" ? bookingIdValue.trim() : "";
  const originalRoomId =
    typeof originalRoomIdValue === "string" && ROOMS.some((room) => room.id === originalRoomIdValue)
      ? originalRoomIdValue
      : roomId;
  const defaultIntent: ModalValues["intent"] = intent === "update" ? "update" : "create";
  const defaultValues: ModalValues = {
    bookingId: bookingId || undefined,
    endLocal: endLocal ?? "",
    intent: defaultIntent,
    originalRoomId: originalRoomId || undefined,
    roomId,
    startLocal: startLocal ?? "",
    title,
  };

  if (!intent || !roomId || !startLocal || !endLocal || !title) {
    return buildActionError("Provide a title, room, start time, and end time.", defaultValues);
  }

  const startDate = new Date(
    convertDateTimeLocalToTimeZoneIso(startLocal, GOOGLE_CALENDAR_TIME_ZONE),
  );
  const endDate = new Date(convertDateTimeLocalToTimeZoneIso(endLocal, GOOGLE_CALENDAR_TIME_ZONE));

  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return buildActionError("The provided start or end time could not be parsed.", defaultValues);
  }

  if (endDate <= startDate) {
    return buildActionError("End time must be later than start time.", defaultValues);
  }

  const todayInAmsterdam = getAmsterdamDayBounds().date;
  const startDateLabel = formatDateTimeLocalInTimeZone(
    startDate.toISOString(),
    GOOGLE_CALENDAR_TIME_ZONE,
  ).slice(0, 10);
  const endDateLabel = formatDateTimeLocalInTimeZone(
    endDate.toISOString(),
    GOOGLE_CALENDAR_TIME_ZONE,
  ).slice(0, 10);

  if (startDateLabel !== todayInAmsterdam || endDateLabel !== todayInAmsterdam) {
    return buildActionError(
      "This board only manages bookings for today in Amsterdam time.",
      defaultValues,
    );
  }

  try {
    const { calendar, refreshedTokens, roomCalendars } = await loadRoomCalendars(
      googleSession.googleTokens,
    );
    const roomCalendarIds = buildRoomCalendarIds(roomCalendars);
    const targetCalendarId = roomCalendarIds[roomId];

    if (!targetCalendarId) {
      return buildActionError(
        "The selected room calendar is not available for your Google account.",
        defaultValues,
      );
    }

    const requestBody = {
      end: {
        dateTime: endDate.toISOString(),
        timeZone: GOOGLE_CALENDAR_TIME_ZONE,
      },
      start: {
        dateTime: startDate.toISOString(),
        timeZone: GOOGLE_CALENDAR_TIME_ZONE,
      },
      summary: title,
    };

    if (intent === "create") {
      await calendar.events.insert({
        calendarId: targetCalendarId,
        requestBody,
      });
    } else {
      const originalCalendarId = originalRoomId ? roomCalendarIds[originalRoomId] : undefined;

      if (!bookingId || !originalCalendarId) {
        return buildActionError(
          "The existing booking could not be identified for editing.",
          defaultValues,
        );
      }

      if (originalCalendarId === targetCalendarId) {
        await calendar.events.update({
          calendarId: targetCalendarId,
          eventId: bookingId,
          requestBody,
        });
      } else {
        await calendar.events.insert({
          calendarId: targetCalendarId,
          requestBody,
        });
        await calendar.events.delete({
          calendarId: originalCalendarId,
          eventId: bookingId,
        });
      }
    }

    session.set("googleTokens", refreshedTokens);

    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Calendar rejected the booking change.";

    return buildActionError(message, defaultValues);
  }
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export default function Design7() {
  const { bookings, isAuthenticated, roomCalendarIds, roomCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
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

  function openCreateModal(nextRoomId?: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("bookingId");
    nextParams.set("modal", "create");

    if (nextRoomId) {
      nextParams.set("roomId", nextRoomId);
    } else {
      nextParams.delete("roomId");
    }

    setSearchParams(nextParams);
  }

  function openEditModal(nextBookingId: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("roomId");
    nextParams.set("bookingId", nextBookingId);
    nextParams.set("modal", "edit");
    setSearchParams(nextParams);
  }

  function closeModal() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("bookingId");
    nextParams.delete("modal");
    nextParams.delete("roomId");
    setSearchParams(nextParams);
  }

  const totalWidth = HOURS.length * HOUR_WIDTH;
  const modalKind = searchParams.get("modal");
  const requestedRoomId = searchParams.get("roomId") ?? undefined;
  const selectedBookingId = searchParams.get("bookingId");
  const selectedBooking: ScheduleBooking | null =
    modalKind === "edit" && selectedBookingId
      ? (bookings.find((booking) => booking.id === selectedBookingId) ?? null)
      : null;
  const defaultActionValues = actionData?.defaultValues;
  const modalState: ModalState =
    modalKind === "create"
      ? {
          kind: "create",
          values:
            defaultActionValues?.intent === "create"
              ? defaultActionValues
              : createDefaultBookingValues(requestedRoomId),
        }
      : modalKind === "edit" && selectedBooking
        ? {
            booking: selectedBooking,
            kind: "edit",
            values:
              defaultActionValues?.intent === "update"
                ? defaultActionValues
                : {
                    bookingId: selectedBooking.id,
                    endLocal: selectedBooking.endLocal,
                    intent: "update",
                    originalRoomId: selectedBooking.roomId,
                    roomId: selectedBooking.roomId,
                    startLocal: selectedBooking.startLocal,
                    title: selectedBooking.title,
                  },
          }
        : null;
  const writableRooms = ROOMS.filter((room) => typeof roomCalendarIds[room.id] === "string");
  const isSubmitting = navigation.state === "submitting";
  const fallbackActiveRoomId = writableRooms[0]?.id || ROOMS[0]?.id || "";
  const activeRoomId =
    modalState && modalState.values.roomId.length > 0
      ? modalState.values.roomId
      : fallbackActiveRoomId;

  return (
    <div
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      className="min-h-screen bg-white text-gray-900"
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <p className="text-sm font-medium text-gray-500">{formatDate()}</p>
        <h1 className="text-lg font-semibold tracking-tight text-gray-900">Room Schedule</h1>
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                openCreateModal();
              }}
              className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              New booking
            </button>
            <button
              type="button"
              onClick={scrollToNow}
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Now
            </button>
          </div>
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
                        aria-label={`Edit booking ${booking.title} in ${room.name}`}
                        onClick={() => {
                          openEditModal(booking.id);
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

                  {isAuthenticated && typeof roomCalendarIds[room.id] === "string" ? (
                    <button
                      type="button"
                      onClick={() => {
                        openCreateModal(room.id);
                      }}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-dashed border-gray-300 px-2 py-1 text-xs font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
                    >
                      Add
                    </button>
                  ) : null}
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

      {modalState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <Form
            method="post"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-form-title"
            className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="booking-form-title" className="text-lg font-semibold text-gray-900">
                  {modalState.kind === "create" ? "Create booking" : "Edit booking"}
                </h2>
                <p className="text-sm text-gray-400">
                  {modalState.kind === "create"
                    ? "Write a new event directly to the selected room calendar."
                    : "Update the existing Google Calendar event for this booking."}
                </p>
              </div>
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: getColor(activeRoomId).border }}
              />
            </div>

            <div
              className="mb-5 rounded-lg p-3"
              style={{ backgroundColor: getColor(activeRoomId).bg }}
            >
              {modalState.kind === "edit" ? (
                <>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Organizer:</span> {modalState.booking.organizer}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Current slot:</span>{" "}
                    {formatBookingWindow(modalState.booking.startHour, modalState.booking.endHour)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Current room:</span>{" "}
                    {ROOMS.find((room) => room.id === modalState.booking.roomId)?.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  This board writes straight to Google Calendar rather than a local booking store.
                </p>
              )}
            </div>

            <input name="intent" type="hidden" value={modalState.values.intent} />
            {modalState.values.bookingId ? (
              <input name="bookingId" type="hidden" value={modalState.values.bookingId} />
            ) : null}
            {modalState.values.originalRoomId ? (
              <input name="originalRoomId" type="hidden" value={modalState.values.originalRoomId} />
            ) : null}

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Title</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.title}
                name="title"
                placeholder="Weekly founder sync"
                required
                type="text"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Room</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.roomId}
                name="roomId"
                required
              >
                {writableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Start</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.startLocal}
                name="startLocal"
                required
                type="datetime-local"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">End</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.endLocal}
                name="endLocal"
                required
                type="datetime-local"
              />
            </label>

            {actionData?.error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionData.error}
              </p>
            ) : null}

            {modalState.kind === "edit" ? (
              <p className="mb-4 text-sm text-gray-500">
                Changing the room recreates the event in the target room calendar and removes the
                old one.
              </p>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                style={{ backgroundColor: ACCENT }}
                type="submit"
              >
                {isSubmitting
                  ? modalState.kind === "create"
                    ? "Creating..."
                    : "Saving..."
                  : modalState.kind === "create"
                    ? "Create booking"
                    : "Save changes"}
              </button>
            </div>
          </Form>
        </div>
      ) : null}
    </div>
  );
}
