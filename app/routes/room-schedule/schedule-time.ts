import { HOURS, ROOMS, formatHour } from "../../data/rooms";
import type { ModalValues } from "./schedule-types";

export const GOOGLE_CALENDAR_TIME_ZONE = "Europe/Amsterdam";
export const SCHEDULE_DAY_LABEL = "tomorrow";

const SCHEDULE_DAY_OFFSET = 1;
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function getScheduleDayReferenceDate() {
  return new Date(Date.now() + SCHEDULE_DAY_OFFSET * ONE_DAY_IN_MILLISECONDS);
}

export function formatScheduleDate() {
  return getScheduleDayReferenceDate().toLocaleDateString("en-US", {
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatBookingWindow(startHour: number, endHour: number) {
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

export function getOffsetLabelForTimeZone(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!offset) {
    throw new Error(`Unable to determine time zone offset for ${timeZone}.`);
  }

  return offset.replace("GMT", "");
}

export function getTimeZoneOffsetLabel(date: Date) {
  return getOffsetLabelForTimeZone(GOOGLE_CALENDAR_TIME_ZONE, date);
}

export function getAmsterdamScheduleDayBounds() {
  const referenceDate = getScheduleDayReferenceDate();
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    year: "numeric",
  }).formatToParts(referenceDate);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine the schedule date in Amsterdam.");
  }

  return {
    date: `${year}-${month}-${day}`,
    timeMax: `${year}-${month}-${day}T23:59:59${getTimeZoneOffsetLabel(referenceDate)}`,
    timeMin: `${year}-${month}-${day}T00:00:00${getTimeZoneOffsetLabel(referenceDate)}`,
  };
}

export function getHourValue(dateTime: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
  }).formatToParts(new Date(dateTime));
  const hourValue = parts.find((part) => part.type === "hour")?.value;
  const minuteValue = parts.find((part) => part.type === "minute")?.value;

  if (!hourValue || !minuteValue) {
    throw new Error(`Unable to parse time value: ${dateTime}`);
  }

  return Number(hourValue) + Number(minuteValue) / 60;
}

export function clampHour(value: number) {
  const min = HOURS[0];
  const max = HOURS[HOURS.length - 1] + 1;

  return Math.min(Math.max(value, min), max);
}

export function formatDateTimeLocalInTimeZone(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!year || !month || !day || !hour || !minute) {
    throw new Error(`Unable to format date time value: ${value}`);
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function createDefaultBookingValues(roomId?: string) {
  const { date } = getAmsterdamScheduleDayBounds();
  const fallbackRoomId = ROOMS[0]?.id ?? "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
  }).formatToParts(getScheduleDayReferenceDate());
  const hourValue = parts.find((part) => part.type === "hour")?.value;

  if (!hourValue) {
    throw new Error("Unable to determine the schedule hour in Amsterdam.");
  }

  const nowHour = Number(hourValue);
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

export function convertDateTimeLocalToTimeZoneIso(value: string, timeZone: string) {
  const date = new Date(`${value}:00Z`);
  const offset = getOffsetLabelForTimeZone(timeZone, date);

  return `${value}:00${offset}`;
}
