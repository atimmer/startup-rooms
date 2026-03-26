import { useEffect, useRef, useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { HOURS, ROOMS, formatHour } from "../../data/rooms";
import { ACCENT, HEADER_HEIGHT, HOUR_WIDTH, ROW_HEIGHT, getRoomColor } from "./schedule-styles";
import {
  createDefaultBookingValues,
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
  const hasAutoScrolledRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(getCurrentTimeOffset());
    }, 60_000);

    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (hasAutoScrolledRef.current || typeof window === "undefined") {
      return;
    }

    const scrollContainer = scrollRef.current;

    if (!scrollContainer || !window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    const offset = getCurrentTimeOffset();

    if (offset === null) {
      return;
    }

    hasAutoScrolledRef.current = true;

    const frameId = window.requestAnimationFrame(() => {
      scrollContainer.scrollTo({
        left: Math.max(offset - scrollContainer.clientWidth / 2, 0),
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  function scrollToNow() {
    const offset = getCurrentTimeOffset();

    if (offset !== null && scrollRef.current) {
      scrollRef.current.scrollTo({
        behavior: "smooth",
        left: Math.max(offset - scrollRef.current.clientWidth / 2, 0),
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
  const bookingsByRoom = new Map<string, ScheduleBooking[]>();
  let selectedBooking: ScheduleBooking | null = null;

  for (const booking of bookings) {
    const roomBookings = bookingsByRoom.get(booking.roomId);

    if (roomBookings) {
      roomBookings.push(booking);
    } else {
      bookingsByRoom.set(booking.roomId, [booking]);
    }

    if (modalKind === "edit" && selectedBookingId && booking.id === selectedBookingId) {
      selectedBooking = booking;
    }
  }

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
  const submittedIntent =
    navigation.formData?.get("intent") === "delete"
      ? "delete"
      : navigation.formData?.get("intent") === "create"
        ? "create"
        : navigation.formData?.get("intent") === "update"
          ? "update"
          : null;
  const isSubmitting = navigation.state === "submitting";
  const isDeleting = isSubmitting && submittedIntent === "delete";
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
      <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 md:px-6 md:py-4">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-gray-900 md:text-lg">
            Room Schedule
          </h1>
          <p className="text-xs font-medium text-gray-500 md:text-sm">{formatScheduleDate()}</p>
        </div>
        {isAuthenticated ? (
          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <Button
              size="sm"
              onClick={() => {
                openCreateModal();
              }}
              className="md:px-3 md:py-1.5 md:text-sm"
              style={{ backgroundColor: ACCENT }}
            >
              New booking
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToNow}
              className="md:px-3 md:py-1.5 md:text-sm"
            >
              Now
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            asChild
            className="shrink-0 md:px-3 md:py-1.5 md:text-sm"
            style={{ backgroundColor: ACCENT }}
          >
            <Link to="/auth/google">Connect Google</Link>
          </Button>
        )}
      </header>

      <div className="flex" style={{ height: "calc(100vh - 53px)" }}>
        <div className="w-11 shrink-0 border-r border-gray-200 md:w-[200px]">
          <div className="border-b border-gray-200" style={{ height: HEADER_HEIGHT }} />
          {ROOMS.map((room) => {
            const color = getRoomColor(room.id);

            return (
              <div
                key={room.id}
                className="flex items-center justify-center gap-3 border-b border-gray-100 px-1 md:justify-start md:px-4"
                style={{ height: ROW_HEIGHT }}
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color.border }}
                />
                <div className="hidden min-w-0 md:block">
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
              const roomBookings = bookingsByRoom.get(room.id) ?? [];
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
                            {ROOMS.find((r) => r.id === booking.roomId)?.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  {isAuthenticated && typeof roomCalendarIds[room.id] === "string" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        openCreateModal(room.id);
                      }}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
                    >
                      Add
                    </Button>
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
                  <Button asChild className="mt-4" style={{ backgroundColor: ACCENT }}>
                    <Link to="/auth/google">Connect Google</Link>
                  </Button>
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

      <Dialog
        open={modalState !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        {modalState ? (
          <DialogContent
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
            }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <DialogTitle>
                  {modalState.kind === "create" ? "Create booking" : "Edit booking"}
                </DialogTitle>
                <DialogDescription>
                  {modalState.kind === "create"
                    ? "Write a new event directly to the selected room calendar."
                    : "Update the existing Google Calendar event for this booking."}
                </DialogDescription>
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
                    <span className="font-medium">Creator:</span> {modalState.booking.creator}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Room:</span>{" "}
                    {ROOMS.find((room) => room.id === modalState.booking.roomId)?.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  This board writes straight to Google Calendar rather than a local booking store.
                </p>
              )}
            </div>

            <Form method="post">
              {modalState.values.bookingId ? (
                <input name="bookingId" type="hidden" value={modalState.values.bookingId} />
              ) : null}
              {modalState.values.originalRoomId ? (
                <input
                  name="originalRoomId"
                  type="hidden"
                  value={modalState.values.originalRoomId}
                />
              ) : null}

              <div className="mb-3">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  defaultValue={modalState.values.title}
                  name="title"
                  placeholder="Weekly founder sync"
                  required
                  type="text"
                />
              </div>

              <div className="mb-3">
                <Label htmlFor="roomId">Room</Label>
                <select
                  id="roomId"
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
              </div>

              <div className="mb-3">
                <Label htmlFor="startLocal">Start</Label>
                <Input
                  id="startLocal"
                  defaultValue={modalState.values.startLocal}
                  name="startLocal"
                  required
                  type="datetime-local"
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="endLocal">End</Label>
                <Input
                  id="endLocal"
                  defaultValue={modalState.values.endLocal}
                  name="endLocal"
                  required
                  type="datetime-local"
                />
              </div>

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

              <div className="flex justify-between gap-3">
                {modalState.kind === "edit" ? (
                  <Button
                    variant="destructive"
                    size="lg"
                    disabled={isSubmitting}
                    name="intent"
                    type="submit"
                    value="delete"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="lg"
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    disabled={isSubmitting}
                    style={{ backgroundColor: ACCENT }}
                    name="intent"
                    type="submit"
                    value={modalState.values.intent}
                  >
                    {isSubmitting
                      ? submittedIntent === "create"
                        ? "Creating..."
                        : submittedIntent === "update"
                          ? "Saving..."
                          : modalState.kind === "create"
                            ? "Creating..."
                            : "Saving..."
                      : modalState.kind === "create"
                        ? "Create booking"
                        : "Save changes"}
                  </Button>
                </div>
              </div>
            </Form>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
