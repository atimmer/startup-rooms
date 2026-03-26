import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GOOGLE_CALENDAR_TIME_ZONE,
  formatDateTimeLocalInTimeZone,
  getAmsterdamDayBounds,
  getHourValue,
} from "./schedule-time";

describe("schedule timezone handling", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses Amsterdam time to decide what counts as today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T23:30:00.000Z"));

    expect(getAmsterdamDayBounds()).toEqual({
      date: "2026-03-26",
      timeMax: "2026-03-26T23:59:59+01:00",
      timeMin: "2026-03-26T00:00:00+01:00",
    });
  });

  it("converts Google Calendar instants into Amsterdam local wall time across DST", () => {
    const instant = "2026-03-29T01:30:00Z";

    expect(formatDateTimeLocalInTimeZone(instant, GOOGLE_CALENDAR_TIME_ZONE)).toBe(
      "2026-03-29T03:30",
    );
    expect(getHourValue(instant)).toBe(3.5);
  });
});
