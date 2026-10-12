import { isDemoBackend } from "./demo-backend.server";

function getRequiredEnvValue(
  key: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "GOOGLE_REDIRECT_URI" | "SESSION_SECRET",
) {
  const value = process.env[key];

  if (!value) {
    // The demo backend never talks to Google and only keeps demo bookings in the session.
    if (isDemoBackend) {
      return `demo-${key}`;
    }

    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  googleClientId: getRequiredEnvValue("GOOGLE_CLIENT_ID"),
  googleClientSecret: getRequiredEnvValue("GOOGLE_CLIENT_SECRET"),
  googleRedirectUri: getRequiredEnvValue("GOOGLE_REDIRECT_URI"),
  googleRoomCalendarId: process.env.GOOGLE_ROOM_CALENDAR_ID,
  sessionSecret: getRequiredEnvValue("SESSION_SECRET"),
};
