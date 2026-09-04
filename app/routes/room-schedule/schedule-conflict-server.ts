import { Temporal } from "@js-temporal/polyfill";
import type { calendar_v3 } from "googleapis";

import { findBookingConflict } from "./schedule-conflicts";
import type { BookingConflictEvent, BookingConflictResult } from "./schedule-conflicts";
import { resolveCreatorEmail } from "./schedule-event";
import { GOOGLE_CALENDAR_TIME_ZONE } from "./schedule-time";

function resolveEventInstant(value: calendar_v3.Schema$EventDateTime | undefined) {
  if (value?.dateTime) {
    return Temporal.Instant.from(value.dateTime).toString();
  }

  if (value?.date) {
    return Temporal.PlainDate.from(value.date)
      .toZonedDateTime(GOOGLE_CALENDAR_TIME_ZONE)
      .toInstant()
      .toString();
  }

  return null;
}

export async function findCalendarBookingConflict(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  requestedStart: string,
  requestedEnd: string,
  currentUserEmail: string,
  excludedBookingId?: string,
): Promise<BookingConflictResult> {
  const events: BookingConflictEvent[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      pageToken,
      singleEvents: true,
      timeMax: requestedEnd,
      timeMin: requestedStart,
      timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    });

    for (const event of response.data.items ?? []) {
      const start = resolveEventInstant(event.start);
      const end = resolveEventInstant(event.end);

      if (!event.id || !start || !end) {
        continue;
      }

      events.push({
        creatorEmail: resolveCreatorEmail(event),
        end,
        id: event.id,
        start,
        title: event.summary,
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return findBookingConflict(
    { end: requestedEnd, start: requestedStart },
    events,
    currentUserEmail,
    excludedBookingId,
  );
}
