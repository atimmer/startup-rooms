import { Temporal } from "@js-temporal/polyfill";

export interface BookingConflictEvent {
  creatorEmail: string | null;
  end: string;
  id: string;
  start: string;
  title?: string | null;
}

export interface RequestedBookingRange {
  end: string;
  start: string;
}

export type BookingConflictResult =
  | { kind: "ok" }
  | { event: BookingConflictEvent; kind: "conflict-other" }
  | {
      kind: "conflict-own-with-suggestion";
      suggestedEnd: string;
      suggestedStart: string;
    }
  | { event: BookingConflictEvent; kind: "conflict-own-no-suggestion" };

function emailsMatch(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function findBookingConflict(
  requested: RequestedBookingRange,
  events: BookingConflictEvent[],
  currentUserEmail: string,
  excludedBookingId?: string,
): BookingConflictResult {
  const requestedStart = Temporal.Instant.from(requested.start);
  const requestedEnd = Temporal.Instant.from(requested.end);
  const overlappingEvents = events.flatMap((event) => {
    if (event.id === excludedBookingId) {
      return [];
    }

    const start = Temporal.Instant.from(event.start);
    const end = Temporal.Instant.from(event.end);
    const overlaps =
      Temporal.Instant.compare(start, requestedEnd) < 0 &&
      Temporal.Instant.compare(end, requestedStart) > 0;

    return overlaps ? [{ end, event, start }] : [];
  });

  if (overlappingEvents.length === 0) {
    return { kind: "ok" };
  }

  const otherConflict = overlappingEvents.find(
    ({ event }) =>
      event.creatorEmail === null || !emailsMatch(event.creatorEmail, currentUserEmail),
  );

  if (otherConflict) {
    return { event: otherConflict.event, kind: "conflict-other" };
  }

  let suggestedStart = requestedStart;
  let suggestedEnd = requestedEnd;

  for (const event of overlappingEvents) {
    if (
      Temporal.Instant.compare(event.start, requestedStart) < 0 &&
      Temporal.Instant.compare(event.end, suggestedStart) > 0
    ) {
      suggestedStart = event.end;
    }

    if (
      Temporal.Instant.compare(event.end, requestedEnd) > 0 &&
      Temporal.Instant.compare(event.start, suggestedEnd) < 0
    ) {
      suggestedEnd = event.start;
    }
  }

  const remainingConflict = overlappingEvents.find(
    (event) =>
      Temporal.Instant.compare(event.start, suggestedEnd) < 0 &&
      Temporal.Instant.compare(event.end, suggestedStart) > 0,
  );

  if (Temporal.Instant.compare(suggestedStart, suggestedEnd) >= 0 || remainingConflict) {
    return {
      event: remainingConflict?.event ?? overlappingEvents[0].event,
      kind: "conflict-own-no-suggestion",
    };
  }

  return {
    kind: "conflict-own-with-suggestion",
    suggestedEnd: suggestedEnd.toString(),
    suggestedStart: suggestedStart.toString(),
  };
}
