# Nijmegen Startup Rooms

Internal room-booking board for the Nijmegen Startup community. The app shows a day view for the shared meeting rooms, reads live availability from Google Calendar, and lets signed-in users create, update, or delete bookings directly against the underlying room calendars.

Built with React Router 7, React 19, TypeScript, Vite, Tailwind CSS v4, and Google Calendar OAuth.

## What it does

- Shows a room schedule board for the configured startup rooms.
- Uses Google OAuth to connect a user account.
- Reads room events from the Google calendars the signed-in user can access.
- Creates and updates bookings directly in those calendars.
- Uses Europe/Amsterdam time for date boundaries and display logic.
- Supports day navigation, mobile horizontal scrolling, and lightweight client-side schedule caching.

## Room model

The rooms are defined in [`app/data/rooms.ts`](/Users/anton/Code/nijmegen-startup-rooms/app/data/rooms.ts). Each room includes:

- a stable internal `id`
- the visible room name
- the expected Google Calendar summary
- a capacity label
- a color used in the schedule UI

When a user signs in, the app loads that user's Google Calendar list and matches calendars to rooms by summary. The matching logic is in [`app/routes/room-schedule/schedule-server.ts`](/Users/anton/Code/nijmegen-startup-rooms/app/routes/room-schedule/schedule-server.ts).

## Requirements

- Node.js 20+
- `pnpm`
- A Google Cloud project with OAuth credentials
- A Google account that has access to the room calendars

Enable `corepack` once if needed:

```bash
corepack enable
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Optional fallback when the incoming request origin is unavailable.
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
SESSION_SECRET=
GOOGLE_ROOM_CALENDAR_ID=
```

Notes:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are required for Google OAuth.
- `GOOGLE_REDIRECT_URI` is an optional fallback for environments where the app cannot infer its public origin from the incoming request.
- `SESSION_SECRET` is required and should be a long random string.
- `GOOGLE_ROOM_CALENDAR_ID` exists in the example file but is not currently used by the app.

## Google setup

1. Create a Google Cloud project.
2. Enable the Google Calendar API.
3. Create an OAuth client for a web application.
4. Add `http://localhost:5173/auth/google/callback` as an authorized redirect URI for local development.
5. Add `https://startup-rooms.24letters.com/auth/google/callback` as an authorized redirect URI for production.
6. Make sure the Google account you sign in with can read and write the room calendars.
7. Make sure the room calendar names match the expected summaries in [`app/data/rooms.ts`](/Users/anton/Code/nijmegen-startup-rooms/app/data/rooms.ts).

The app requests these scopes:

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`

## Local development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

The app runs at `http://localhost:5173`.

Open the root route and connect Google to load live room data.

## Scripts

- `pnpm dev` starts the local dev server.
- `pnpm build` creates the production build.
- `pnpm start` serves the built app.
- `pnpm test` runs the Vitest suite.
- `pnpm typecheck` generates route types and runs TypeScript.
- `pnpm lint` runs ESLint.
- `pnpm format` formats the repo with `oxfmt`.
- `pnpm presubmit` runs tests, typecheck, lint, and format checks.

## Important behavior

- The schedule is server-rendered and uses React Router data loaders/actions.
- The visible schedule is date-based and uses Amsterdam timezone rules, including DST handling.
- If Google refresh tokens become invalid, the app clears the session and sends the user through OAuth again.
- Schedule writes go straight to Google Calendar. There is no local booking database.

## Project structure

- [`app/routes/room-schedule.tsx`](/Users/anton/Code/nijmegen-startup-rooms/app/routes/room-schedule.tsx): route module for the main board
- [`app/routes/room-schedule/schedule-page.tsx`](/Users/anton/Code/nijmegen-startup-rooms/app/routes/room-schedule/schedule-page.tsx): UI for the schedule board and booking dialog
- [`app/routes/room-schedule/schedule-server.ts`](/Users/anton/Code/nijmegen-startup-rooms/app/routes/room-schedule/schedule-server.ts): Google Calendar loading and booking mutations
- [`app/routes/room-schedule/schedule-time.ts`](/Users/anton/Code/nijmegen-startup-rooms/app/routes/room-schedule/schedule-time.ts): Amsterdam date/time helpers
- [`app/lib/google.server.ts`](/Users/anton/Code/nijmegen-startup-rooms/app/lib/google.server.ts): OAuth and authorized Google API client setup
- [`app/lib/session.server.ts`](/Users/anton/Code/nijmegen-startup-rooms/app/lib/session.server.ts): cookie-backed session storage

## Production

Build and serve the app with:

```bash
pnpm build
pnpm start
```

The repo includes Vercel React Router configuration in [`react-router.config.ts`](/Users/anton/Code/nijmegen-startup-rooms/react-router.config.ts), so Vercel is the most obvious deployment target. Any deployment that can run the built server output with the required environment variables should also work.
