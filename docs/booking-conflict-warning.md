# Booking conflict warning design

## Goal

Before creating or updating a room booking, verify current Google Calendar state for the target room. If another event overlaps the requested interval, do not write and show a useful warning in the existing booking dialog.

This is a Google-backed validation feature, not a new booking store or locking system.

## Current flow

### Schedule loading

- The route loader delegates to `loadScheduleData` (`app/routes/room-schedule.tsx:20-22`). The authenticated loader resolves the user's room calendars, then calls `calendar.events.list` once per room for the selected Amsterdam day (`app/routes/room-schedule/schedule-server.ts:194-226`).
- Loader results expand recurring events with `singleEvents: true`, but cap each room at 50 events (`app/routes/room-schedule/schedule-server.ts:214-224`). Mapping currently drops all-day events and events outside the visible 08:00-18:00 board, and clamps partially visible events (`app/routes/room-schedule/schedule-server.ts:228-258`).
- The client loader may reuse a schedule result for five minutes (`app/routes/room-schedule/schedule-client-cache.ts:3-13`, `app/routes/room-schedule.tsx:24-35`). The client action clears that cache before and after mutations (`app/routes/room-schedule.tsx:42-49`).

### Create

- "New booking", a room's "Add" button, or a drag selection opens the dialog through URL search parameters (`app/routes/room-schedule/schedule-page.tsx:538-559`, `app/routes/room-schedule/schedule-page.tsx:930-941`, `app/routes/room-schedule/schedule-page.tsx:1126-1138`).
- The dialog posts title, target room, Amsterdam-local start/end values, and `intent=create` through the route `<Form>` (`app/routes/room-schedule/schedule-page.tsx:1270-1331`, `app/routes/room-schedule/schedule-page.tsx:1357-1375`). The route action delegates directly to `mutateScheduleBooking` (`app/routes/room-schedule.tsx:38-40`).
- The action parses the form, preserves submitted values, rejects missing/invalid/non-positive/cross-day windows, and converts local wall time to `Europe/Amsterdam` zoned datetimes (`app/routes/room-schedule/schedule-server.ts:295-330`, `app/routes/room-schedule/schedule-server.ts:384-408`). It then resolves room calendars and immediately calls `events.insert` on the selected calendar (`app/routes/room-schedule/schedule-server.ts:410-440`).
- Although a prior loader request fetched that day's events, those values are not available inside this separate action request. The action currently has session data, parsed form values, the Calendar client, and resolved room calendar IDs—but no event snapshot.

### Update

- Clicking a rendered booking opens edit state and posts `bookingId`, `originalRoomId`, the possibly changed target room/time/title, and `intent=update` (`app/routes/room-schedule/schedule-page.tsx:1085-1123`, `app/routes/room-schedule/schedule-page.tsx:1270-1331`).
- A same-room edit calls `events.update`. A room change first inserts into the target calendar and then deletes from the original calendar (`app/routes/room-schedule/schedule-server.ts:441-467`). That move remains non-atomic and is outside this feature.

### Existing errors

- Every validation/provider failure uses `{ error, defaultValues }`, built with `satisfies ActionData` (`app/routes/room-schedule/schedule-server.ts:152-157`, `app/routes/room-schedule/schedule-types.ts:50-53`). The action returns data rather than redirecting, so the modal URL remains and submitted values are reused according to intent (`app/routes/room-schedule/schedule-page.tsx:606-638`).
- The dialog currently renders one red form-level error below the time fields (`app/routes/room-schedule/schedule-page.tsx:1333-1337`). Successful writes redirect with modal parameters removed (`app/routes/room-schedule/schedule-server.ts:469-475`).

## Overlap contract

Represent every requested and existing booking as an interval of absolute instants. For requested `[start, end)` and existing `[existingStart, existingEnd)`, conflict exactly when:

```text
start < existingEnd && existingStart < end
```

- Intervals are half-open. A booking ending exactly when another starts is allowed; so is a booking starting exactly when another ends.
- Only events on the selected room's resolved calendar can conflict. Other room calendars are irrelevant.
- Continue parsing `datetime-local` values as Amsterdam wall time through helpers in `schedule-time.ts`, then compare `Temporal.Instant` values. This preserves existing DST behavior (`app/routes/room-schedule/schedule-time.ts:7-15`, `app/routes/room-schedule/schedule-server.ts:388-407`).
- Timed Google events use `start.dateTime`/`end.dateTime`. All-day events use `start.date` and exclusive `end.date`; interpret those dates as Amsterdam midnights for room-booking purposes, so a one-day all-day event blocks the whole local day. Google defines event ends as exclusive and all-day ranges by date ([Google event resource](https://developers.google.com/workspace/calendar/api/v3/reference/events)).
- Ignore cancelled events. Treat every other event with a valid interval as blocking, including events marked transparent, because the board currently renders calendar events without interpreting transparency.
- With `singleEvents: true`, recurring series are expanded into the occurrences in the requested window. Compare each returned occurrence normally.
- On a same-calendar update, exclude only the returned event whose `id` equals the submitted `bookingId`. Do this only when the resolved original and target calendar IDs are equal. On a room move, do not exclude an identically named/ID-like event from the target calendar.
- If a non-cancelled returned event cannot be normalized to a valid interval, fail closed with "Could not verify room availability. Try again." and perform no write.

## Server-side design

### Recommended source: a fresh exact-window `events.list`

After existing form/time/calendar validation and before any insert/update:

1. Query only `targetCalendarId` with `timeMin` equal to the requested start instant, `timeMax` equal to the requested end instant, `singleEvents: true`, `showDeleted: false`, `orderBy: "startTime"`, and `timeZone: GOOGLE_CALENDAR_TIME_ZONE`.
2. Follow every `nextPageToken`; do not copy the loader's 50-event cap. Google may return a partial page even below `maxResults` ([Google `events.list`](https://developers.google.com/calendar/api/v3/reference/events/list)).
3. Normalize timed and all-day intervals, skip the same event for a same-calendar update, and apply the half-open predicate. Return the earliest conflict.
4. If there is a conflict, return action data immediately. Do not call `events.insert`, `events.update`, or either operation of a room move.
5. If there is no conflict, continue through the current write and redirect path.

Google's `events.list` filters match the desired boundary semantics: `timeMin` is an exclusive lower bound on event end and `timeMax` is an exclusive upper bound on event start. Still apply the local predicate so the rule is explicit, testable, and resilient to malformed data.

Put pure interval comparison and Amsterdam all-day normalization helpers in `schedule-time.ts`; keep Google event traversal/querying in `schedule-server.ts`. This avoids coupling client-safe time logic to Google API types.

The prior day load is not suitable as server authority: it belongs to an earlier request, may be five minutes old, is limited to 50, omits all-day and out-of-board events, and may represent a different date. Passing client-loaded events back would also trust mutable client input. Re-running `loadScheduleData` would make six room queries and still apply view-oriented filtering.

`freebusy.query` is also rejected. It provides inclusive-start/exclusive-end busy ranges, but no event ID or title ([Google FreeBusy](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query)); therefore it cannot produce the required warning or safely exclude the event being edited. The recommended `events.list` costs one extra request in the normal case but minimizes staleness and supports both needs.

### Action result

Preserve the existing plain `ActionData` convention and add one optional discriminator:

```ts
export interface ActionData {
  defaultValues?: ModalValues;
  error: string;
  errorCode?: "booking-conflict";
}
```

Extend `buildActionError` with an optional typed `errorCode`; use `satisfies ActionData`. Do not add casts or `any`. Other errors remain unchanged and omit the code.

Conflict text:

```text
“Weekly founder sync” already books Stadsschouwburg from 10:00–11:00. Choose another room or time.
```

Format the title, room name, and interval on the server with Amsterdam-local helpers. Use 24-hour time; include both dates when the conflicting event crosses midnight; render all-day intervals as "all day on 4 September" (or a date range). If details are restricted or `summary` is absent, use the existing fallback title "Reserved" (`app/routes/room-schedule/schedule-server.ts:255`).

Do not introduce HTTP-specific response handling just for this case; a plain action-data result matches every current validation failure and lets `useActionData` preserve the established flow.

## Client UX

- Show the conflict as a form-level amber warning in the existing error location below End. It is cross-field: changing Room, Start, or End can resolve it, so attaching it to only one field would be misleading. Keep non-conflict errors in the current red treatment.
- Keep the dialog open and preserve all submitted values. The existing action-data/default-values flow already does this; the conflict path must return rather than redirect.
- Give the warning `id="booking-form-error"`, `role="alert"`, and `tabIndex={-1}`. After a failed submission, focus its element via a ref/effect so keyboard and screen-reader users land on the result. Add `aria-describedby="booking-form-error"` and `aria-invalid` to Room, Start, and End only for `errorCode === "booking-conflict"`.
- Leave both room and time controls enabled so correction takes one edit and one resubmit. The action remains the source of truth.
- Optional, not part of the minimal first pass: compare the currently loaded `bookings` for the selected room on input/change or submit and show "Possible conflict—Google Calendar will verify when you submit." This must be advisory and must not prevent submission, because the client list is cached, view-filtered, and omits all-day/out-of-window events. Reuse the same half-open helper; never duplicate the predicate.

## Edge cases and guarantees

- **Two users racing:** the fresh read sharply reduces stale acceptance but `events.list` plus `events.insert/update` is not atomic. Two simultaneous empty checks can both write. A process-local lock is insufficient on Vercel. A strict guarantee requires an authoritative transactional store/lock per room and interval (and a policy for edits made directly in Google Calendar); that is a separate architecture decision.
- **Midnight/day boundaries:** the existing action still rejects requested cross-day bookings. Existing Google events may span midnight or begin outside the visible day; the exact instant query still finds them and the warning includes dates where needed.
- **Outside the visible board/window:** validate against raw exact-window API results before the loader's 08:00-18:00 clamp, so hidden early/late/all-day events still block.
- **Restricted details:** start/end remain available for availability checks; missing titles display as "Reserved" without leaking guessed details.
- **Recurring events:** `singleEvents: true` returns occurrences. A same-room occurrence edit excludes its exact event ID, not the whole recurring series.
- **Calendar/API failure:** fail closed through action data and make no mutation. Preserve invalid-grant reauthentication behavior.
- **Multiple conflicts:** report the earliest returned overlap; one actionable warning is enough. Pagination ensures the answer is complete.

## Test plan

Tests stay colocated and use the existing Vitest `describe`/`it`/`expect` style (`app/routes/room-schedule/schedule-time.test.ts:1-40`, `app/lib/session.server.test.ts:1-37`). There are no action-level tests today, so add focused mocks rather than a new test framework.

### Pure/unit tests

Add overlap/normalization cases to `schedule-time.test.ts` (or a colocated `schedule-conflicts.test.ts` if the helper is split):

- partial overlap at either edge;
- requested interval contained by, containing, or equal to an existing interval;
- exact end-to-start and start-to-end touching (no conflict);
- separated intervals (no conflict);
- Amsterdam all-day one-day and multi-day exclusive-end bounds;
- an existing event spanning midnight;
- spring-forward/fall-back comparisons by instant;
- cancelled event ignored;
- same-calendar matching ID excluded on update, but another event still conflicts;
- target-room move does not exclude an event from the target calendar;
- missing summary formats as "Reserved".

### Action-level tests

Add `schedule-server.test.ts` and mock the dynamically imported session/Google modules and Calendar methods:

- overlapping create returns `errorCode: "booking-conflict"`, includes title/time/default values, and never calls `insert`;
- touching create proceeds to `insert` and redirects;
- same-room update excludes itself and calls `update` when no other conflict exists;
- same-room update overlapping another event returns a conflict and does not call `update`;
- room move conflict calls neither target `insert` nor original `delete`;
- all-day, restricted-title, recurring occurrence, and paginated-list fixtures are handled;
- list/normalization failure returns an availability error and performs no write;
- invalid-grant handling still reauthenticates.

Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` (the repository's `pnpm presubmit` combines these at `package.json:13-17`).

## Implementation checklist

1. Add the optional conflict error discriminator (and any small interval type) in `app/routes/room-schedule/schedule-types.ts`.
2. Add/export the half-open comparison, all-day Amsterdam normalization, and conflict-window formatting helpers in `app/routes/room-schedule/schedule-time.ts`; cover them in `schedule-time.test.ts`.
3. Add a paginated exact-window event query and event-normalization helper in `app/routes/room-schedule/schedule-server.ts`.
4. Invoke validation immediately before both create and update write branches; apply same-calendar event exclusion and fail closed on verification errors in `schedule-server.ts`.
5. Render and focus the typed amber warning, with Room/Start/End ARIA associations, in `app/routes/room-schedule/schedule-page.tsx`.
6. Add mocked mutation tests in `app/routes/room-schedule/schedule-server.test.ts`, including assertions that no write method runs on conflict/failure.
7. Run the full presubmit suite and manually verify create, same-room edit, room move, touching bookings, and restricted-title warnings.

## Open decision

Is best-effort Google preflight sufficient for this product, or must simultaneous submissions be strictly serialized? The former is the recommended scope here. The latter cannot be guaranteed by the current Google-only architecture and needs a separate transactional coordination design.
