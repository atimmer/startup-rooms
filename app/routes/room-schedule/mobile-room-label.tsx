import { cn } from "~/lib/utils";
import type { getRoomColor } from "./schedule-styles";

export const MOBILE_ROOM_LABEL_VARIANTS = [
  { id: 1, name: "Filled badge" },
  { id: 2, name: "Letters + dot" },
  { id: 3, name: "Color stripe" },
  { id: 4, name: "Tinted cell" },
  { id: 5, name: "Outlined ring" },
] as const;

export type MobileRoomLabelVariant = (typeof MOBILE_ROOM_LABEL_VARIANTS)[number]["id"];

interface MobileRoomLabelProps {
  color: ReturnType<typeof getRoomColor>;
  name: string;
  variant: MobileRoomLabelVariant;
}

export function MobileRoomLabel({ color, name, variant }: MobileRoomLabelProps) {
  const letters = name.slice(0, 2).toUpperCase();

  switch (variant) {
    case 1:
      return (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-gray-900"
          style={{ backgroundColor: color.border }}
        >
          {letters}
        </span>
      );
    case 2:
      return (
        <span className="flex flex-col items-center gap-1">
          <span className="text-[13px] leading-none font-bold text-gray-800">{letters}</span>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color.border }} />
        </span>
      );
    case 3:
      return (
        <>
          <span
            className="absolute inset-y-0 left-0 w-1.5"
            style={{ backgroundColor: color.border }}
          />
          <span className="pl-1 text-[13px] font-bold" style={{ color: color.text }}>
            {letters}
          </span>
        </>
      );
    case 4:
      return (
        <>
          <span
            className="absolute inset-0"
            style={{ backgroundColor: color.bg, borderLeft: `3px solid ${color.border}` }}
          />
          <span className="relative text-[13px] font-bold" style={{ color: color.text }}>
            {letters}
          </span>
        </>
      );
    case 5:
      return (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] bg-white text-[11px] font-bold text-gray-800"
          style={{ borderColor: color.border }}
        >
          {letters}
        </span>
      );
  }
}

interface MobileRoomLabelSwitcherProps {
  onChange: (variant: MobileRoomLabelVariant) => void;
  variant: MobileRoomLabelVariant;
}

export function MobileRoomLabelSwitcher({ onChange, variant }: MobileRoomLabelSwitcherProps) {
  const activeName = MOBILE_ROOM_LABEL_VARIANTS.find((option) => option.id === variant)?.name;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center md:hidden">
      <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur">
        <span className="px-2 text-xs font-medium text-gray-500">{activeName}</span>
        {MOBILE_ROOM_LABEL_VARIANTS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "h-8 w-8 rounded-full text-sm font-semibold",
              option.id === variant ? "bg-gray-900 text-white" : "text-gray-600",
            )}
            onClick={() => {
              onChange(option.id);
            }}
          >
            {option.id}
          </button>
        ))}
      </div>
    </div>
  );
}
