import type { calendar_v3 } from "googleapis";

export function resolveCreatorEmail(event: calendar_v3.Schema$Event): string | null {
  return event.creator?.email ?? event.organizer?.email ?? null;
}
