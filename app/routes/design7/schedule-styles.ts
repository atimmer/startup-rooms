export const SIDEBAR_WIDTH = 200;
export const HOUR_WIDTH = 140;
export const ROW_HEIGHT = 72;
export const HEADER_HEIGHT = 48;
export const ACCENT = "#6366F1";

const ROOM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  stadsschouwburg: { bg: "#FFF0EB", border: "#FF5C3D", text: "#9A3412" },
  "de-vereeniging": { bg: "#F3EBFF", border: "#A675E8", text: "#6B21A8" },
  lindenberg: { bg: "#F5FAD9", border: "#B8DD5E", text: "#4D7C0F" },
  lux: { bg: "#E8FBF5", border: "#8DDEC9", text: "#0F766E" },
  merleyn: { bg: "#FFF7D6", border: "#FFD45F", text: "#92400E" },
  doornroosje: { bg: "#F1EAFE", border: "#B090FF", text: "#6D28D9" },
};

export function getRoomColor(roomId: string) {
  return ROOM_COLORS[roomId] ?? { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" };
}
