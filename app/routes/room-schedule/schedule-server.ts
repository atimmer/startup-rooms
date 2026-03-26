import { Temporal } from "@js-temporal/polyfill";
import type { calendar_v3 } from "googleapis";
import { redirect } from "react-router";

import { HOURS, ROOMS } from "../../data/rooms";
import {
  GOOGLE_CALENDAR_TIME_ZONE,
  clampHour,
  formatDateTimeLocalInTimeZone,
  getAmsterdamDayBounds,
  getHourValue,
  parseDateTimeLocal,
} from "./schedule-time";
import type {
  ActionData,
  GoogleSessionTokens,
  LoaderData,
  ModalValues,
  RoomCalendarCandidate,
  RoomCalendarEntry,
  ScheduleBooking,
} from "./schedule-types";

function normalizeCalendarSummary(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findCalendarForRoom(
  room: (typeof ROOMS)[number],
  calendars: calendar_v3.Schema$CalendarListEntry[],
) {
  const expectedSummary = normalizeCalendarSummary(room.calendarSummary);
  const expectedName = normalizeCalendarSummary(room.name);
  let fallbackMatch: calendar_v3.Schema$CalendarListEntry | undefined;

  for (const calendarListEntry of calendars) {
    if (calendarListEntry.primary || typeof calendarListEntry.summary !== "string") {
      continue;
    }

    const normalizedSummary = normalizeCalendarSummary(calendarListEntry.summary);

    if (normalizedSummary === expectedSummary) {
      return calendarListEntry;
    }

    if (
      !fallbackMatch &&
      (normalizedSummary === expectedName ||
        normalizedSummary.startsWith(expectedName) ||
        normalizedSummary.includes(expectedName))
    ) {
      fallbackMatch = calendarListEntry;
    }
  }

  return fallbackMatch;
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
  const { createAuthorizedCalendarClient } = await import("../../lib/google.server");
  const { calendar, refreshedTokens } = await createAuthorizedCalendarClient(googleTokens);
  const calendarListResponse = await calendar.calendarList.list({
    minAccessRole: "reader",
    showDeleted: false,
    showHidden: false,
  });
  const allCalendars: calendar_v3.Schema$CalendarListEntry[] =
    calendarListResponse.data.items ?? [];
  const roomCalendars: RoomCalendarCandidate[] = ROOMS.map((room) => {
    const match = findCalendarForRoom(room, allCalendars);

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

function buildActionError(error: string, defaultValues: ModalValues) {
  return {
    defaultValues,
    error,
  } satisfies ActionData;
}

export async function loadScheduleData(request: Request): Promise<LoaderData> {
  const { commitSession, getSession, readGoogleSession } = await import("../../lib/session.server");
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

export async function mutateScheduleBooking(request: Request) {
  const { commitSession, getSession, readGoogleSession } = await import("../../lib/session.server");
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
  const intent =
    intentValue === "update"
      ? "update"
      : intentValue === "create"
        ? "create"
        : intentValue === "delete"
          ? "delete"
          : null;
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

  if (!intent) {
    return buildActionError("Unknown booking action.", defaultValues);
  }

  if (intent === "delete") {
    if (!bookingId || !originalRoomId) {
      return buildActionError(
        "The existing booking could not be identified for deletion.",
        defaultValues,
      );
    }

    try {
      const { calendar, refreshedTokens, roomCalendars } = await loadRoomCalendars(
        googleSession.googleTokens,
      );
      const roomCalendarIds = buildRoomCalendarIds(roomCalendars);
      const originalCalendarId = roomCalendarIds[originalRoomId];

      if (!originalCalendarId) {
        return buildActionError(
          "The selected room calendar is not available for your Google account.",
          defaultValues,
        );
      }

      await calendar.events.delete({
        calendarId: originalCalendarId,
        eventId: bookingId,
      });

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

  if (!roomId || !startLocal || !endLocal || !title) {
    return buildActionError("Provide a title, room, start time, and end time.", defaultValues);
  }

  let startDateTime: Temporal.ZonedDateTime;
  let endDateTime: Temporal.ZonedDateTime;

  try {
    startDateTime =
      Temporal.PlainDateTime.from(startLocal).toZonedDateTime(GOOGLE_CALENDAR_TIME_ZONE);
    endDateTime = Temporal.PlainDateTime.from(endLocal).toZonedDateTime(GOOGLE_CALENDAR_TIME_ZONE);
  } catch {
    return buildActionError("The provided start or end time could not be parsed.", defaultValues);
  }

  if (Temporal.ZonedDateTime.compare(endDateTime, startDateTime) <= 0) {
    return buildActionError("End time must be later than start time.", defaultValues);
  }

  const todayInAmsterdam = getAmsterdamDayBounds().date;
  const startDateLabel = startDateTime.toPlainDate().toString();
  const endDateLabel = endDateTime.toPlainDate().toString();

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
        dateTime: endDateTime.toInstant().toString(),
        timeZone: GOOGLE_CALENDAR_TIME_ZONE,
      },
      start: {
        dateTime: startDateTime.toInstant().toString(),
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
