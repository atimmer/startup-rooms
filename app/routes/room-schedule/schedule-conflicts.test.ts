import { describe, expect, it } from "vitest";

import type { BookingConflictEvent } from "./schedule-conflicts";
import { findBookingConflict } from "./schedule-conflicts";

const currentUserEmail = "anton@example.com";
const requested = {
  end: "2026-09-04T12:00:00Z",
  start: "2026-09-04T10:00:00Z",
};

function event(
  id: string,
  start: string,
  end: string,
  creatorEmail: string | null = currentUserEmail,
): BookingConflictEvent {
  return { creatorEmail, end, id, start, title: `Booking ${id}` };
}

describe("findBookingConflict", () => {
  it("allows events that only touch the requested edges", () => {
    const events = [
      event("previous", "2026-09-04T09:00:00Z", requested.start),
      event("next", requested.end, "2026-09-04T13:00:00Z"),
    ];

    expect(findBookingConflict(requested, events, currentUserEmail)).toEqual({ kind: "ok" });
  });

  it("rejects an overlap created by someone else", () => {
    const conflict = event(
      "other",
      "2026-09-04T10:30:00Z",
      "2026-09-04T11:30:00Z",
      "someone@example.com",
    );

    expect(findBookingConflict(requested, [conflict], currentUserEmail)).toEqual({
      event: conflict,
      kind: "conflict-other",
    });
  });

  it("suggests starting after the user's previous booking", () => {
    const conflict = event("previous", "2026-09-04T09:30:00Z", "2026-09-04T10:30:00Z");

    expect(findBookingConflict(requested, [conflict], currentUserEmail)).toEqual({
      kind: "conflict-own-with-suggestion",
      suggestedEnd: requested.end,
      suggestedStart: "2026-09-04T10:30:00Z",
    });
  });

  it("suggests ending before the user's next booking", () => {
    const conflict = event("next", "2026-09-04T11:30:00Z", "2026-09-04T12:30:00Z");

    expect(findBookingConflict(requested, [conflict], currentUserEmail)).toEqual({
      kind: "conflict-own-with-suggestion",
      suggestedEnd: "2026-09-04T11:30:00Z",
      suggestedStart: requested.start,
    });
  });

  it("trims the suggestion between the user's bookings on both sides", () => {
    const events = [
      event("previous", "2026-09-04T09:30:00Z", "2026-09-04T10:30:00Z"),
      event("next", "2026-09-04T11:30:00Z", "2026-09-04T12:30:00Z"),
    ];

    expect(findBookingConflict(requested, events, currentUserEmail)).toEqual({
      kind: "conflict-own-with-suggestion",
      suggestedEnd: "2026-09-04T11:30:00Z",
      suggestedStart: "2026-09-04T10:30:00Z",
    });
  });

  it("does not suggest around an own booking fully inside the request", () => {
    const conflict = event("inside", "2026-09-04T10:30:00Z", "2026-09-04T11:00:00Z");

    expect(findBookingConflict(requested, [conflict], currentUserEmail)).toEqual({
      event: conflict,
      kind: "conflict-own-no-suggestion",
    });
  });

  it("excludes the booking being updated", () => {
    const conflict = event("self", requested.start, requested.end);

    expect(findBookingConflict(requested, [conflict], currentUserEmail, "self")).toEqual({
      kind: "ok",
    });
  });

  it("treats a null creator email as someone else's booking", () => {
    const conflict = event("unknown", "2026-09-04T10:30:00Z", "2026-09-04T11:30:00Z", null);

    expect(findBookingConflict(requested, [conflict], currentUserEmail)).toEqual({
      event: conflict,
      kind: "conflict-other",
    });
  });
});
