import { Temporal } from "@js-temporal/polyfill";
import type { calendar_v3 } from "googleapis";
import type { Session } from "react-router";

import { ROOMS } from "../../data/rooms";
import { GOOGLE_CALENDAR_TIME_ZONE } from "./schedule-time";
import type { RoomCalendarEntry, ScheduleCalendarClient } from "./schedule-types";

const DEMO_EVENTS_SESSION_KEY = "demoEvents";
const COLLEAGUE_EMAIL = "colleague@preview.local";
// Demo bookings live in the ~4 KB session cookie, so only the latest ones are kept.
const MAX_STORED_EVENTS = 20;

// Read-only bookings by someone else, so conflicts with other people can be tested.
const COLLEAGUE_BOOKINGS = [
  { end: "11:00", roomId: ROOMS[0].id, start: "10:00", summary: "Investor call" },
  { end: "15:30", roomId: ROOMS[1].id, start: "14:00", summary: "Design review" },
];

export const DEMO_GOOGLE_SESSION = {
  googleTokens: { refreshToken: "demo" },
  googleUser: { email: "demo@preview.local", name: "Preview demo" },
};

export const DEMO_ROOM_CALENDARS: RoomCalendarEntry[] = ROOMS.map((room) => ({
  accessRole: "owner",
  calendarId: getDemoCalendarId(room.id),
  room,
}));

interface DemoEvent {
  calendarId: string;
  end: string;
  id: string;
  start: string;
  summary: string;
}

function getDemoCalendarId(roomId: string) {
  return `demo-${roomId}`;
}

function isDemoEvent(value: unknown): value is DemoEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "calendarId" in value &&
    typeof value.calendarId === "string" &&
    "end" in value &&
    typeof value.end === "string" &&
    "id" in value &&
    typeof value.id === "string" &&
    "start" in value &&
    typeof value.start === "string" &&
    "summary" in value &&
    typeof value.summary === "string"
  );
}

function getColleagueEvents(timeMin: Temporal.Instant, timeMax: Temporal.Instant) {
  const events: DemoEvent[] = [];
  const lastDate = timeMax.toZonedDateTimeISO(GOOGLE_CALENDAR_TIME_ZONE).toPlainDate();

  for (
    let date = timeMin.toZonedDateTimeISO(GOOGLE_CALENDAR_TIME_ZONE).toPlainDate();
    Temporal.PlainDate.compare(date, lastDate) <= 0;
    date = date.add({ days: 1 })
  ) {
    for (const [index, booking] of COLLEAGUE_BOOKINGS.entries()) {
      const toInstant = (time: string) =>
        date
          .toZonedDateTime({ plainTime: time, timeZone: GOOGLE_CALENDAR_TIME_ZONE })
          .toInstant()
          .toString();

      events.push({
        calendarId: getDemoCalendarId(booking.roomId),
        end: toInstant(booking.end),
        id: `colleague-${date.toString()}-${String(index)}`,
        start: toInstant(booking.start),
        summary: booking.summary,
      });
    }
  }

  return events;
}

function toGoogleEvent(event: DemoEvent, creatorEmail: string): calendar_v3.Schema$Event {
  const toDateTime = (instant: string) =>
    Temporal.Instant.from(instant)
      .toZonedDateTimeISO(GOOGLE_CALENDAR_TIME_ZONE)
      .toString({ timeZoneName: "never" });

  return {
    creator: { email: creatorEmail },
    end: { dateTime: toDateTime(event.end) },
    id: event.id,
    start: { dateTime: toDateTime(event.start) },
    summary: event.summary,
  };
}

function readEventTimes(requestBody: calendar_v3.Schema$Event | undefined) {
  if (!requestBody?.start?.dateTime || !requestBody.end?.dateTime) {
    throw new Error("Demo bookings need a start and end time.");
  }

  return {
    end: Temporal.Instant.from(requestBody.end.dateTime).toString(),
    start: Temporal.Instant.from(requestBody.start.dateTime).toString(),
  };
}

// Like the real client, report failures as rejected promises.
function settle<T>(run: () => T) {
  return new Promise<T>((resolve) => {
    resolve(run());
  });
}

export function createDemoCalendarClient(session: Session): ScheduleCalendarClient {
  const storedValue: unknown = session.get(DEMO_EVENTS_SESSION_KEY);
  let storedEvents = Array.isArray(storedValue) ? storedValue.filter(isDemoEvent) : [];

  function saveEvents(events: DemoEvent[]) {
    storedEvents = events
      .sort((left, right) => Temporal.Instant.compare(left.start, right.start))
      .slice(-MAX_STORED_EVENTS);
    session.set(DEMO_EVENTS_SESSION_KEY, storedEvents);
  }

  function findOwnEvent(eventId: string | undefined) {
    const event = storedEvents.find((candidate) => candidate.id === eventId);

    if (!event) {
      throw new Error("Only your own demo bookings can be changed.");
    }

    return event;
  }

  return {
    events: {
      delete: ({ eventId }) =>
        settle(() => {
          const event = findOwnEvent(eventId);

          saveEvents(storedEvents.filter((candidate) => candidate !== event));
        }),
      insert: ({ calendarId, requestBody }) =>
        settle(() => {
          saveEvents([
            ...storedEvents,
            {
              calendarId: calendarId ?? "",
              id: crypto.randomUUID().slice(0, 8),
              summary: requestBody?.summary ?? "",
              ...readEventTimes(requestBody),
            },
          ]);
        }),
      list: ({ calendarId, timeMax, timeMin }) =>
        settle(() => {
          if (!timeMin || !timeMax) {
            throw new Error("Demo bookings can only be listed for a time range.");
          }

          const min = Temporal.Instant.from(timeMin);
          const max = Temporal.Instant.from(timeMax);
          const isInRange = (event: DemoEvent) =>
            event.calendarId === calendarId &&
            Temporal.Instant.compare(event.start, max) < 0 &&
            Temporal.Instant.compare(event.end, min) > 0;
          const colleagueEvents = getColleagueEvents(min, max);
          const items = [...colleagueEvents, ...storedEvents]
            .filter(isInRange)
            .sort((left, right) => Temporal.Instant.compare(left.start, right.start))
            .map((event) =>
              toGoogleEvent(
                event,
                colleagueEvents.includes(event)
                  ? COLLEAGUE_EMAIL
                  : DEMO_GOOGLE_SESSION.googleUser.email,
              ),
            );

          return { data: { items } };
        }),
      update: ({ calendarId, eventId, requestBody }) =>
        settle(() => {
          const event = findOwnEvent(eventId);

          saveEvents([
            ...storedEvents.filter((candidate) => candidate !== event),
            {
              ...event,
              calendarId: calendarId ?? event.calendarId,
              summary: requestBody?.summary ?? event.summary,
              ...readEventTimes(requestBody),
            },
          ]);
        }),
    },
  };
}
