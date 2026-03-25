import { useEffect, useRef, useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";

import { HOURS, ROOMS, formatHour } from "../../data/rooms";
import {
  ACCENT,
  HEADER_HEIGHT,
  HOUR_WIDTH,
  ROW_HEIGHT,
  SIDEBAR_WIDTH,
  getRoomColor,
} from "./schedule-styles";
import {
  createDefaultBookingValues,
  formatBookingWindow,
  formatScheduleDate,
  getCurrentTimeOffset,
} from "./schedule-time";
import type { ActionData, LoaderData, ModalState, ScheduleBooking } from "./schedule-types";

export function SchedulePage() {
  const { bookings, isAuthenticated, roomCalendarIds, roomCount } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [now, setNow] = useState(getCurrentTimeOffset);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(getCurrentTimeOffset());
    }, 60_000);

    return () => {
      clearInterval(id);
    };
  }, []);

  function scrollToNow() {
    const offset = getCurrentTimeOffset();

    if (offset !== null && scrollRef.current) {
      scrollRef.current.scrollTo({
        behavior: "smooth",
        left: offset - scrollRef.current.clientWidth / 2,
      });
    }
  }

  function openCreateModal(nextRoomId?: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("bookingId");
    nextParams.set("modal", "create");

    if (nextRoomId) {
      nextParams.set("roomId", nextRoomId);
    } else {
      nextParams.delete("roomId");
    }

    setSearchParams(nextParams);
  }

  function openEditModal(nextBookingId: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("roomId");
    nextParams.set("bookingId", nextBookingId);
    nextParams.set("modal", "edit");
    setSearchParams(nextParams);
  }

  function closeModal() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("bookingId");
    nextParams.delete("modal");
    nextParams.delete("roomId");
    setSearchParams(nextParams);
  }

  const totalWidth = HOURS.length * HOUR_WIDTH;
  const modalKind = searchParams.get("modal");
  const requestedRoomId = searchParams.get("roomId") ?? undefined;
  const selectedBookingId = searchParams.get("bookingId");
  const selectedBooking: ScheduleBooking | null =
    modalKind === "edit" && selectedBookingId
      ? (bookings.find((booking) => booking.id === selectedBookingId) ?? null)
      : null;
  const defaultActionValues = actionData?.defaultValues;
  const modalState: ModalState =
    modalKind === "create"
      ? {
          kind: "create",
          values:
            defaultActionValues?.intent === "create"
              ? defaultActionValues
              : createDefaultBookingValues(requestedRoomId),
        }
      : modalKind === "edit" && selectedBooking
        ? {
            booking: selectedBooking,
            kind: "edit",
            values:
              defaultActionValues?.intent === "update"
                ? defaultActionValues
                : {
                    bookingId: selectedBooking.id,
                    endLocal: selectedBooking.endLocal,
                    intent: "update",
                    originalRoomId: selectedBooking.roomId,
                    roomId: selectedBooking.roomId,
                    startLocal: selectedBooking.startLocal,
                    title: selectedBooking.title,
                  },
          }
        : null;
  const writableRooms = ROOMS.filter((room) => typeof roomCalendarIds[room.id] === "string");
  const isSubmitting = navigation.state === "submitting";
  const fallbackActiveRoomId = writableRooms[0]?.id || ROOMS[0]?.id || "";
  const activeRoomId =
    modalState && modalState.values.roomId.length > 0
      ? modalState.values.roomId
      : fallbackActiveRoomId;

  return (
    <div
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      className="min-h-screen bg-white text-gray-900"
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <p className="text-sm font-medium text-gray-500">{formatScheduleDate()}</p>
        <h1 className="text-lg font-semibold tracking-tight text-gray-900">Room Schedule</h1>
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                openCreateModal();
              }}
              className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              New booking
            </button>
            <button
              type="button"
              onClick={scrollToNow}
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Now
            </button>
          </div>
        ) : (
          <Link
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
            to="/auth/google"
          >
            Connect Google
          </Link>
        )}
      </header>

      <div className="flex" style={{ height: "calc(100vh - 65px)" }}>
        <div className="shrink-0 border-r border-gray-200" style={{ width: SIDEBAR_WIDTH }}>
          <div className="border-b border-gray-200" style={{ height: HEADER_HEIGHT }} />
          {ROOMS.map((room) => {
            const color = getRoomColor(room.id);

            return (
              <div
                key={room.id}
                className="flex items-center gap-3 border-b border-gray-100 px-4"
                style={{ height: ROW_HEIGHT }}
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color.border }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{room.name}</p>
                  <p className="text-xs text-gray-400">{room.capacityLabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ position: "relative", width: totalWidth }}>
            <div className="flex border-b border-gray-200" style={{ height: HEADER_HEIGHT }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="shrink-0 border-l border-gray-100 px-3 py-2 text-xs font-medium text-gray-400"
                  style={{ width: HOUR_WIDTH }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {ROOMS.map((room) => {
              const roomBookings = bookings.filter((booking) => booking.roomId === room.id);
              const color = getRoomColor(room.id);

              return (
                <div
                  key={room.id}
                  className="relative border-b border-gray-50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-l border-gray-100"
                      style={{ left: (hour - HOURS[0]) * HOUR_WIDTH }}
                    />
                  ))}

                  {roomBookings.map((booking) => {
                    const left = (booking.startHour - HOURS[0]) * HOUR_WIDTH;
                    const width = Math.max((booking.endHour - booking.startHour) * HOUR_WIDTH, 24);

                    return (
                      <button
                        key={booking.id}
                        type="button"
                        className="absolute top-1.5 bottom-1.5 flex cursor-pointer items-center overflow-hidden rounded-lg px-3 text-left transition-shadow hover:shadow-md"
                        style={{
                          backgroundColor: color.bg,
                          borderLeft: `3px solid ${color.border}`,
                          left,
                          width,
                        }}
                        aria-label={`Edit booking ${booking.title} in ${room.name}`}
                        onClick={() => {
                          openEditModal(booking.id);
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold leading-tight"
                            style={{ color: color.text }}
                          >
                            {booking.title}
                          </p>
                          <p
                            className="truncate text-xs"
                            style={{ color: color.text, opacity: 0.7 }}
                          >
                            {booking.organizer}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  {isAuthenticated && typeof roomCalendarIds[room.id] === "string" ? (
                    <button
                      type="button"
                      onClick={() => {
                        openCreateModal(room.id);
                      }}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-dashed border-gray-300 px-2 py-1 text-xs font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
                    >
                      Add
                    </button>
                  ) : null}
                </div>
              );
            })}

            {now !== null ? (
              <div
                className="pointer-events-none absolute"
                style={{
                  backgroundColor: "#EF4444",
                  bottom: 0,
                  height: HEADER_HEIGHT + ROOMS.length * ROW_HEIGHT,
                  left: now,
                  top: 0,
                  width: 2,
                  zIndex: 20,
                }}
              >
                <div
                  className="absolute -top-1 -left-1.5 h-3 w-3 rounded-full"
                  style={{ backgroundColor: "#EF4444" }}
                />
              </div>
            ) : null}

            {!isAuthenticated ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/72 backdrop-blur-[1px]">
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-center shadow-lg">
                  <p className="text-base font-semibold text-gray-900">
                    Connect Google Calendar to load live room bookings
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    The schedule design stays the same. Only the data source changes.
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: ACCENT }}
                    to="/auth/google"
                  >
                    Connect Google
                  </Link>
                </div>
              </div>
            ) : null}

            {isAuthenticated && bookings.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-center shadow-sm">
                  <p className="text-base font-semibold text-gray-900">No bookings today</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Checked {String(roomCount)} room calendars for today in Amsterdam time.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {modalState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <Form
            method="post"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-form-title"
            className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="booking-form-title" className="text-lg font-semibold text-gray-900">
                  {modalState.kind === "create" ? "Create booking" : "Edit booking"}
                </h2>
                <p className="text-sm text-gray-400">
                  {modalState.kind === "create"
                    ? "Write a new event directly to the selected room calendar."
                    : "Update the existing Google Calendar event for this booking."}
                </p>
              </div>
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: getRoomColor(activeRoomId).border }}
              />
            </div>

            <div
              className="mb-5 rounded-lg p-3"
              style={{ backgroundColor: getRoomColor(activeRoomId).bg }}
            >
              {modalState.kind === "edit" ? (
                <>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Organizer:</span> {modalState.booking.organizer}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Current slot:</span>{" "}
                    {formatBookingWindow(modalState.booking.startHour, modalState.booking.endHour)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Current room:</span>{" "}
                    {ROOMS.find((room) => room.id === modalState.booking.roomId)?.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  This board writes straight to Google Calendar rather than a local booking store.
                </p>
              )}
            </div>

            <input name="intent" type="hidden" value={modalState.values.intent} />
            {modalState.values.bookingId ? (
              <input name="bookingId" type="hidden" value={modalState.values.bookingId} />
            ) : null}
            {modalState.values.originalRoomId ? (
              <input name="originalRoomId" type="hidden" value={modalState.values.originalRoomId} />
            ) : null}

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Title</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.title}
                name="title"
                placeholder="Weekly founder sync"
                required
                type="text"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Room</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.roomId}
                name="roomId"
                required
              >
                {writableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Start</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.startLocal}
                name="startLocal"
                required
                type="datetime-local"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">End</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                defaultValue={modalState.values.endLocal}
                name="endLocal"
                required
                type="datetime-local"
              />
            </label>

            {actionData?.error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionData.error}
              </p>
            ) : null}

            {modalState.kind === "edit" ? (
              <p className="mb-4 text-sm text-gray-500">
                Changing the room recreates the event in the target room calendar and removes the
                old one.
              </p>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                style={{ backgroundColor: ACCENT }}
                type="submit"
              >
                {isSubmitting
                  ? modalState.kind === "create"
                    ? "Creating..."
                    : "Saving..."
                  : modalState.kind === "create"
                    ? "Create booking"
                    : "Save changes"}
              </button>
            </div>
          </Form>
        </div>
      ) : null}
    </div>
  );
}
