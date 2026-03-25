export interface Room {
  id: string;
  name: string;
  calendarSummary: string;
  capacityLabel: string;
  color: string;
}

export interface Booking {
  id: string;
  roomId: string;
  title: string;
  organizer: string;
  startHour: number;
  endHour: number;
  date: string;
}

export const ROOMS: Room[] = [
  {
    id: "stadsschouwburg",
    name: "Stadsschouwburg",
    calendarSummary: "Stadsschouwburg (1-6 personen)",
    capacityLabel: "1-6 personen",
    color: "#FF5C3D",
  },
  {
    id: "de-vereeniging",
    name: "De Vereeniging",
    calendarSummary: "De Vereeniging (1-40 personen)",
    capacityLabel: "1-40 personen",
    color: "#A675E8",
  },
  {
    id: "lindenberg",
    name: "Lindenberg",
    calendarSummary: "Lindenberg (1-4 personen)",
    capacityLabel: "1-4 personen",
    color: "#B8DD5E",
  },
  {
    id: "lux",
    name: "LUX",
    calendarSummary: "LUX (1-6 personen)",
    capacityLabel: "1-6 personen",
    color: "#8DDEC9",
  },
  {
    id: "merleyn",
    name: "Merleyn",
    calendarSummary: "Merleyn (1-4 personen)",
    capacityLabel: "1-4 personen",
    color: "#FFD45F",
  },
  {
    id: "doornroosje",
    name: "Doornroosje",
    calendarSummary: "Doornroosje (1-6 personen)",
    capacityLabel: "1-6 personen",
    color: "#B090FF",
  },
] as const;

export const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);

export function formatHour(value: number) {
  const hour = Math.floor(value);
  const minutes = Math.round((value - hour) * 60);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const minuteLabel = String(minutes).padStart(2, "0");

  return `${String(normalizedHour)}:${minuteLabel} ${suffix}`;
}
