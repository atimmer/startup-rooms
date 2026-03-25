import { Form, Link, useLoaderData } from "react-router";

import type { Route } from "./+types/google-calendar";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Meeting Rooms" },
    { name: "description", content: "Google Calendar backed meeting room bookings." },
  ];
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface CalendarEvent {
  end: string;
  id: string;
  start: string;
  summary: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const [
    { env },
    { createAuthorizedCalendarClient },
    { commitSession, getSession, readGoogleSession },
  ] = await Promise.all([
    import("../lib/env.server"),
    import("../lib/google.server"),
    import("../lib/session.server"),
  ]);
  const session = await getSession(request);
  const googleSession = readGoogleSession(session);
  const selectedCalendarIdFromUrl = new URL(request.url).searchParams.get("calendarId");

  if (!googleSession) {
    return {
      calendars: [],
      events: [],
      headers: null,
      roomCalendarId: env.googleRoomCalendarId ?? null,
      selectedCalendarId: selectedCalendarIdFromUrl ?? env.googleRoomCalendarId ?? null,
      user: null,
    };
  }

  const { calendar, refreshedTokens } = await createAuthorizedCalendarClient(
    googleSession.googleTokens,
  );
  const calendarListResponse = await calendar.calendarList.list({
    minAccessRole: "reader",
    showDeleted: false,
    showHidden: false,
  });
  const calendars =
    calendarListResponse.data.items?.map((calendarListEntry) => ({
      accessRole: calendarListEntry.accessRole ?? "reader",
      backgroundColor: calendarListEntry.backgroundColor ?? "#dbeafe",
      id: calendarListEntry.id ?? "",
      primary: calendarListEntry.primary ?? false,
      summary: calendarListEntry.summary ?? "Unnamed calendar",
    })) ?? [];
  const firstCalendarId = calendars[0]?.id;
  const selectedCalendarId =
    selectedCalendarIdFromUrl ?? env.googleRoomCalendarId ?? firstCalendarId;

  let events: CalendarEvent[] = [];

  if (selectedCalendarId) {
    const eventsResponse = await calendar.events.list({
      calendarId: selectedCalendarId,
      maxResults: 20,
      orderBy: "startTime",
      singleEvents: true,
      timeMin: new Date().toISOString(),
    });

    events =
      eventsResponse.data.items?.flatMap((event) => {
        if (!event.id || !event.start?.dateTime || !event.end?.dateTime) {
          return [];
        }

        return [
          {
            end: event.end.dateTime,
            id: event.id,
            start: event.start.dateTime,
            summary: event.summary ?? "Untitled meeting",
          },
        ];
      }) ?? [];
  }

  session.set("googleTokens", refreshedTokens);

  return {
    calendars,
    events,
    headers: {
      "Set-Cookie": await commitSession(session),
    },
    roomCalendarId: env.googleRoomCalendarId ?? null,
    selectedCalendarId,
    user: googleSession.googleUser,
  };
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export default function GoogleCalendarRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Meeting Rooms</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                Google Calendar connection
              </h1>
              <p className="mt-4 max-w-3xl text-base text-slate-300">
                Authenticate with Google, inspect the calendars you can access, and load upcoming
                events from a room calendar without introducing a second booking system.
              </p>
            </div>
            <Link
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10"
              to="/"
            >
              Back to homepage
            </Link>
          </div>
          {data.user ? (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm text-slate-400">Signed in as</p>
                <p className="font-medium text-white">
                  {data.user.name} ({data.user.email})
                </p>
              </div>
              <Form method="post" action="/auth/logout">
                <button
                  className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10"
                  type="submit"
                >
                  Sign out
                </button>
              </Form>
            </div>
          ) : (
            <div className="mt-6">
              <Link
                className="inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                to="/auth/google"
              >
                Connect Google
              </Link>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,20rem),minmax(0,1fr)]">
          <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Calendars</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {data.roomCalendarId
                    ? `Configured room calendar: ${data.roomCalendarId}`
                    : "Set GOOGLE_ROOM_CALENDAR_ID to preselect a room calendar."}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.calendars.length === 0 ? (
                <p className="text-sm text-slate-400">Sign in to load your accessible calendars.</p>
              ) : (
                data.calendars.map((calendar) => {
                  const isSelected = calendar.id === data.selectedCalendarId;

                  return (
                    <Link
                      className={`block rounded-2xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-cyan-300 bg-cyan-300/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                      key={calendar.id}
                      to={`/google-calendar?calendarId=${encodeURIComponent(calendar.id)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: calendar.backgroundColor }}
                        />
                        <div>
                          <p className="font-medium text-white">{calendar.summary}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {calendar.accessRole}
                            {calendar.primary ? " • primary" : ""}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Upcoming events</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {data.selectedCalendarId
                    ? `Showing the next 20 events for ${data.selectedCalendarId}`
                    : "Choose a calendar to load events."}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {data.events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-sm text-slate-400">
                  No upcoming timed events were found for the selected calendar.
                </div>
              ) : (
                data.events.map((event) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                    key={event.id}
                  >
                    <p className="text-lg font-medium text-white">{event.summary}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {formatDateTime(event.start)} to {formatDateTime(event.end)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
