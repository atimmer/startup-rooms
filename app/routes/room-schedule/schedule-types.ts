import type { calendar_v3 } from "googleapis";

import type { Booking, ROOMS } from "../../data/rooms";

/** The subset of the Google Calendar client the schedule uses, so previews can swap in a fake. */
export interface ScheduleCalendarClient {
  events: {
    delete(params: calendar_v3.Params$Resource$Events$Delete): Promise<unknown>;
    insert(params: calendar_v3.Params$Resource$Events$Insert): Promise<unknown>;
    list(
      params: calendar_v3.Params$Resource$Events$List,
    ): Promise<{ data: calendar_v3.Schema$Events }>;
    update(params: calendar_v3.Params$Resource$Events$Update): Promise<unknown>;
  };
}

export interface GoogleSessionTokens {
  accessToken?: string;
  expiryDate?: number;
  refreshToken: string;
  scope?: string;
  tokenType?: string;
}

export interface ScheduleBooking extends Booking {
  calendarId: string;
  creatorEmail: string | null;
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
  currentUserEmail: string | null;
  date: string;
  isAuthenticated: boolean;
  isDemo: boolean;
  isToday: boolean;
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
  suggestion?: {
    endLocal: string;
    startLocal: string;
  };
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
