import { type ComponentProps, forwardRef } from "react";

import { cn } from "~/lib/utils";

const NATIVE_PICKER_TYPES = new Set(["date", "datetime-local", "month", "time", "week"]);

const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, type, onClick, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400",
          className,
        )}
        ref={ref}
        onClick={(event) => {
          onClick?.(event);

          const { nativeEvent } = event;
          const isMouse =
            nativeEvent instanceof PointerEvent && nativeEvent.pointerType === "mouse";

          // Chrome 154 on Android stopped opening the native picker when the field itself is tapped.
          if (event.defaultPrevented || isMouse || !type || !NATIVE_PICKER_TYPES.has(type)) {
            return;
          }

          try {
            event.currentTarget.showPicker();
          } catch {
            // Unsupported or blocked; the browser's default tap behavior still applies.
          }
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
