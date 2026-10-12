// Vercel previews store bookings in the session cookie instead of Google Calendar,
// so they can be tested on a phone without Google credentials.
export const isDemoBackend =
  process.env.VERCEL_ENV === "preview" || process.env.DEMO_BACKEND === "1";
