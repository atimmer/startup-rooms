import type { Booking, ROOMS } from "../../data/rooms";

export interface GoogleSessionTokens {
  accessToken?: string;
  expiryDate?: number;
  refreshToken: string;
  scope?: string;
  tokenType?: string;
}

export interface ScheduleBooking extends Booking {
  calendarId: string;
  endLocal: string;
  startLocal: string;
}

export interface RoomCalendarCandidate {
  accessRole: string;
  calendarId: string | null;
  room: (typeof ROOMS)[number];
}

export interface RoomCalendarEntry {
  accessRole: string;
  calendarId: string;
  room: (typeof ROOMS)[number];
}

export interface LoaderData {
  bookings: ScheduleBooking[];
  headers: { "Set-Cookie": string } | null;
  isAuthenticated: boolean;
  roomCalendarIds: Record<string, string>;
  roomCount: number;
}

export interface ModalValues {
  bookingId?: string;
  endLocal: string;
  intent: "create" | "update";
  originalRoomId?: string;
  roomId: string;
  startLocal: string;
  title: string;
}

export interface ActionData {
  defaultValues?: ModalValues;
  error: string;
}

export type ModalState =
  | {
      kind: "create";
      values: ModalValues;
    }
  | {
      booking: ScheduleBooking;
      kind: "edit";
      values: ModalValues;
    }
  | null;
