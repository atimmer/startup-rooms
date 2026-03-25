export interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
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
    id: "aurora",
    name: "Aurora",
    capacity: 12,
    floor: 3,
    amenities: ["Projector", "Whiteboard", "Video Call"],
    color: "#E63946",
  },
  {
    id: "nebula",
    name: "Nebula",
    capacity: 8,
    floor: 2,
    amenities: ["TV Screen", "Whiteboard"],
    color: "#457B9D",
  },
  {
    id: "zenith",
    name: "Zenith",
    capacity: 4,
    floor: 1,
    amenities: ["TV Screen", "Video Call"],
    color: "#2A9D8F",
  },
  {
    id: "cosmos",
    name: "Cosmos",
    capacity: 20,
    floor: 3,
    amenities: ["Projector", "Whiteboard", "Video Call", "Sound System"],
    color: "#E9C46A",
  },
  {
    id: "prism",
    name: "Prism",
    capacity: 6,
    floor: 2,
    amenities: ["TV Screen", "Whiteboard", "Video Call"],
    color: "#F4A261",
  },
  {
    id: "vertex",
    name: "Vertex",
    capacity: 3,
    floor: 1,
    amenities: ["TV Screen"],
    color: "#264653",
  },
];

function getTodayStr() {
  const d = new Date();
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const today = getTodayStr();

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "b1",
    roomId: "aurora",
    title: "Sprint Planning",
    organizer: "Sarah Chen",
    startHour: 9,
    endHour: 10,
    date: today,
  },
  {
    id: "b2",
    roomId: "aurora",
    title: "Design Review",
    organizer: "Marcus Webb",
    startHour: 14,
    endHour: 15,
    date: today,
  },
  {
    id: "b3",
    roomId: "nebula",
    title: "1:1 with Lead",
    organizer: "Aisha Patel",
    startHour: 10,
    endHour: 11,
    date: today,
  },
  {
    id: "b4",
    roomId: "cosmos",
    title: "All Hands",
    organizer: "Jordan Lee",
    startHour: 11,
    endHour: 12,
    date: today,
  },
  {
    id: "b5",
    roomId: "cosmos",
    title: "Client Presentation",
    organizer: "Elena Ruiz",
    startHour: 15,
    endHour: 17,
    date: today,
  },
  {
    id: "b6",
    roomId: "prism",
    title: "Brainstorm Session",
    organizer: "Tom Nguyen",
    startHour: 13,
    endHour: 14,
    date: today,
  },
  {
    id: "b7",
    roomId: "zenith",
    title: "Quick Sync",
    organizer: "Lina Borg",
    startHour: 9,
    endHour: 10,
    date: today,
  },
  {
    id: "b8",
    roomId: "vertex",
    title: "Interview — Backend",
    organizer: "Raj Kapoor",
    startHour: 14,
    endHour: 15,
    date: today,
  },
];

export const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8am to 5pm

export function formatHour(h: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(display)}:00 ${suffix}`;
}
