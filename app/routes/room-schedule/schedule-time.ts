import { Temporal } from "@js-temporal/polyfill";

import { HOURS, ROOMS, formatHour } from "../../data/rooms";
import { HOUR_WIDTH } from "./schedule-styles";
import type { ModalValues } from "./schedule-types";

export const GOOGLE_CALENDAR_TIME_ZONE = "Europe/Amsterdam";

function getCurrentAmsterdamDateTime() {
  return Temporal.Now.zonedDateTimeISO(GOOGLE_CALENDAR_TIME_ZONE);
}

function getTimeZoneDateTimeForInstant(value: string, timeZone: string) {
  return Temporal.Instant.from(value).toZonedDateTimeISO(timeZone);
}

export function getCurrentTimeOffset(): number | null {
  const now = getCurrentAmsterdamDateTime();
  const h = now.hour;
  const m = now.minute;
  const startHour = HOURS[0];
  const endHour = HOURS[HOURS.length - 1] + 1;

  if (h < startHour || h >= endHour) {
    return null;
  }

  return (h - startHour + m / 60) * HOUR_WIDTH;
}

export function formatScheduleDate() {
  return getCurrentAmsterdamDateTime().toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatBookingWindow(startHour: number, endHour: number) {
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

export function getAmsterdamDayBounds() {
  const now = getCurrentAmsterdamDateTime();

  return {
    date: now.toPlainDate().toString(),
    timeMax: now.withPlainTime("23:59:59").toString({ timeZoneName: "never" }),
    timeMin: now.startOfDay().toString({ timeZoneName: "never" }),
  };
}

export function getHourValue(dateTime: string) {
  const dateTimeInAmsterdam = getTimeZoneDateTimeForInstant(dateTime, GOOGLE_CALENDAR_TIME_ZONE);

  return dateTimeInAmsterdam.hour + dateTimeInAmsterdam.minute / 60;
}

export function clampHour(value: number) {
  const min = HOURS[0];
  const max = HOURS[HOURS.length - 1] + 1;

  return Math.min(Math.max(value, min), max);
}

export function formatDateTimeLocalInTimeZone(value: string, timeZone: string) {
  return getTimeZoneDateTimeForInstant(value, timeZone)
    .toPlainDateTime()
    .toString({ smallestUnit: "minute" });
}

export function createDefaultBookingValues(roomId?: string) {
  const { date } = getAmsterdamDayBounds();
  const fallbackRoomId = ROOMS[0]?.id ?? "";
  const nowHour = getCurrentAmsterdamDateTime().hour;
  const minHour = HOURS[0];
  const maxHour = HOURS[HOURS.length - 1];
  const startHour = Math.min(Math.max(nowHour + 1, minHour), maxHour);
  const endHour = Math.min(startHour + 1, maxHour + 1);

  return {
    endLocal: `${date}T${String(endHour).padStart(2, "0")}:00`,
    intent: "create" as const,
    roomId: roomId ?? fallbackRoomId,
    startLocal: `${date}T${String(startHour).padStart(2, "0")}:00`,
    title: "",
  } satisfies ModalValues;
}

export function parseDateTimeLocal(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}
