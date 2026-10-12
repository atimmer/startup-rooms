import { createSession } from "react-router";
import { describe, expect, it } from "vitest";

import { DEMO_ROOM_CALENDARS, createDemoCalendarClient } from "./schedule-demo-calendar.server";

const [firstRoom, , thirdRoom] = DEMO_ROOM_CALENDARS;
const day = { timeMax: "2026-09-04T23:59:59+02:00", timeMin: "2026-09-04T00:00:00+02:00" };
const requestBody = {
  end: { dateTime: "2026-09-04T11:00:00Z" },
  start: { dateTime: "2026-09-04T10:00:00Z" },
  summary: "Standup",
};

async function listTitles(session: ReturnType<typeof createSession>, calendarId: string) {
  const { data } = await createDemoCalendarClient(session).events.list({ ...day, calendarId });

  return data.items?.map((event) => event.summary);
}

describe("createDemoCalendarClient", () => {
  it("stores bookings in the session across requests", async () => {
    const session = createSession();

    await createDemoCalendarClient(session).events.insert({
      calendarId: thirdRoom.calendarId,
      requestBody,
    });

    expect(await listTitles(session, thirdRoom.calendarId)).toEqual(["Standup"]);

    const { data } = await createDemoCalendarClient(session).events.list({
      ...day,
      calendarId: thirdRoom.calendarId,
    });
    const eventId = data.items?.[0]?.id ?? undefined;

    await createDemoCalendarClient(session).events.update({
      calendarId: thirdRoom.calendarId,
      eventId,
      requestBody: { ...requestBody, summary: "Retro" },
    });
    expect(await listTitles(session, thirdRoom.calendarId)).toEqual(["Retro"]);

    await createDemoCalendarClient(session).events.delete({
      calendarId: thirdRoom.calendarId,
      eventId,
    });
    expect(await listTitles(session, thirdRoom.calendarId)).toEqual([]);
  });

  it("shows read-only bookings by a colleague", async () => {
    const session = createSession();
    const client = createDemoCalendarClient(session);
    const { data } = await client.events.list({ ...day, calendarId: firstRoom.calendarId });
    const [colleagueEvent] = data.items ?? [];

    expect(colleagueEvent.creator?.email).toBe("colleague@preview.local");
    await expect(
      client.events.delete({ calendarId: firstRoom.calendarId, eventId: colleagueEvent.id ?? "" }),
    ).rejects.toThrow("Only your own demo bookings can be changed.");
  });
});
