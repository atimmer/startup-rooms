import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { ComponentProps } from "react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useRevalidator,
  useSearchParams,
} from "react-router";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { HOURS, ROOMS, formatHour } from "../../data/rooms";
import { ACCENT, HEADER_HEIGHT, HOUR_WIDTH, ROW_HEIGHT, getRoomColor } from "./schedule-styles";
import {
  createDefaultBookingValues,
  formatDateTimeLocalForHour,
  formatScheduleDate,
  getAdjacentDate,
  getCurrentTimeOffset,
  getTodayAmsterdamDate,
  parseDateTimeLocal,
} from "./schedule-time";
import { clearClientScheduleCache, clearClientScheduleCacheForUrl } from "./schedule-client-cache";
import type { ActionData, LoaderData, ModalState, ScheduleBooking } from "./schedule-types";

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<typeof Form>["onSubmit"]>>[0];
type ScheduleRowPointerEvent = Parameters<NonNullable<ComponentProps<"div">["onPointerDown"]>>[0];
const PULL_REFRESH_MAX_DISTANCE = 96;
const PULL_REFRESH_THRESHOLD = 52;
const PULL_REFRESH_TRIGGER_DISTANCE = 52;
const DRAG_CREATE_MIN_DISTANCE = 6;
const DRAG_CREATE_SLOT_MINUTES = 15;
const SKELETON_BLOCK_OFFSETS = [0.08, 0.38, 0.68] as const;
const SKELETON_BLOCK_WIDTHS = [0.18, 0.24, 0.16] as const;
const DRAG_CREATE_SLOT_WIDTH = (HOUR_WIDTH * DRAG_CREATE_SLOT_MINUTES) / 60;

interface DragSelection {
  currentX: number;
  pointerId: number;
  roomId: string;
  startX: number;
}

interface DragSelectionBounds {
  endHour: number;
  left: number;
  startHour: number;
  width: number;
}

function ConnectGoogleButton({
  className,
  label = "Connect Google",
  tone = "accent",
}: {
  className?: string;
  label?: string;
  tone?: "accent" | "light";
}) {
  const usesAccentTone = tone === "accent";

  return (
    <Button
      asChild
      className={cn(
        "h-11 rounded-full px-5 text-sm font-semibold shadow-sm",
        usesAccentTone ? undefined : "bg-white text-stone-950 hover:bg-stone-100",
        className,
      )}
      style={usesAccentTone ? { backgroundColor: ACCENT } : undefined}
    >
      <Link to="/auth/google">{label}</Link>
    </Button>
  );
}

function LoggedOutScheduleOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-stone-950/[0.18] via-stone-950/40 via-55% to-stone-950/55 p-4 backdrop-blur-[3px]">
      <div className="w-full max-w-[400px] rounded-xl border border-gray-200 bg-white p-6 text-left shadow-lg md:p-7">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 md:text-[22px]">
          Nijmegen Startup Rooms
        </h2>

        <p className="mt-3 text-sm leading-[1.6] text-gray-600">
          Deze app maakt het eenvoudig om meetingruimtes te boeken en in te zien bij{" "}
          <a
            className="underline underline-offset-3 transition hover:text-gray-900"
            href="https://startupnijmegen.nl/"
            rel="noreferrer"
            target="_blank"
          >
            Startup Nijmegen
          </a>
          . Ik heb deze app gemaakt omdat ik zelf vind dat Google Calendar geen fijne UI heeft voor
          het beheren van de meetingruimtes. Ik mis overzicht en gemak. Dat heeft deze app wel.
        </p>
        <p className="mt-3 text-sm leading-[1.6] text-gray-600">
          Als je doorgaat, ontvangt Nijmegen Startup Rooms je e-mailadres en toegang tot evenementen
          in de zes gedeelde vergaderruimteagenda&apos;s. De app gebruikt dit alleen om de planning
          te tonen en om op jouw verzoek boekingen in Google Calendar aan te maken, te wijzigen of
          te verwijderen. Een boeking in een gedeelde agenda is zichtbaar voor anderen die al
          toegang tot die agenda hebben. Vercel verwerkt gegevens alleen als hostingprovider. Lees
          het{" "}
          <Link
            className="underline underline-offset-3 transition hover:text-gray-900"
            to="/privacy"
          >
            privacybeleid
          </Link>{" "}
          voor beveiliging, bewaartermijnen en verwijderen. Om de zes agenda&apos;s te vinden leest
          de app eerst tijdelijk de namen, ID&apos;s en toegangsrollen van alle Google-agenda&apos;s
          waarop je bent geabonneerd; andere agenda&apos;s en hun evenementen worden niet gebruikt.
        </p>

        <ConnectGoogleButton className="mt-5 w-full" label="Sign in with Google" />

        <div className="mt-4 border-t border-gray-100 pt-3.5 text-xs leading-5 text-gray-500">
          <div className="flex gap-3.5">
            <Link
              className="underline underline-offset-3 transition hover:text-gray-900"
              to="/privacy"
            >
              Privacybeleid
            </Link>
            <Link
              className="underline underline-offset-3 transition hover:text-gray-900"
              to="/voorwaarden"
            >
              Voorwaarden
            </Link>
          </div>
          <p className="mt-1.5 text-gray-400">
            Built and operated by{" "}
            <a
              className="underline underline-offset-3 transition hover:text-gray-900"
              href="https://24letters.com/"
              rel="noreferrer"
              target="_blank"
            >
              24letters
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function createCreateModalValues(
  roomId: string | undefined,
  dateParam: string | undefined,
  startLocal: string | null,
  endLocal: string | null,
) {
  const values = createDefaultBookingValues(roomId, dateParam);

  if (!startLocal || !endLocal || startLocal >= endLocal) {
    return values;
  }

  return {
    ...values,
    endLocal,
    startLocal,
  };
}

function getBoundedScheduleX(element: HTMLDivElement, clientX: number, totalWidth: number) {
  const rect = element.getBoundingClientRect();

  return Math.min(Math.max(clientX - rect.left, 0), totalWidth);
}

function snapScheduleX(value: number, totalWidth: number) {
  return Math.min(
    Math.max(Math.round(value / DRAG_CREATE_SLOT_WIDTH) * DRAG_CREATE_SLOT_WIDTH, 0),
    totalWidth,
  );
}

function getDragSelectionBounds(selection: DragSelection, totalWidth: number): DragSelectionBounds {
  const anchorX = snapScheduleX(selection.startX, totalWidth);
  const currentX = snapScheduleX(selection.currentX, totalWidth);
  let left = Math.min(anchorX, currentX);
  let right = Math.max(anchorX, currentX);

  if (left === right) {
    left = Math.min(left, Math.max(totalWidth - DRAG_CREATE_SLOT_WIDTH, 0));
    right = Math.min(left + DRAG_CREATE_SLOT_WIDTH, totalWidth);
  }

  return {
    endHour: HOURS[0] + right / HOUR_WIDTH,
    left,
    startHour: HOURS[0] + left / HOUR_WIDTH,
    width: right - left,
  };
}

export function SchedulePage() {
  const { bookings, currentUserEmail, date, isAuthenticated, roomCalendarIds, roomCount } =
    useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const location = useLocation();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [now, setNow] = useState(getCurrentTimeOffset);
  const [pendingIntent, setPendingIntent] = useState<"create" | "delete" | "update" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);
  const focusRefreshFrameRef = useRef<number | null>(null);
  const pullStartYRef = useRef<number | null>(null);
  const pullStartXRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const isPullRefreshPendingRef = useRef(false);
  const dragSelectionRef = useRef<DragSelection | null>(null);
  const [tooltipRoomId, setTooltipRoomId] = useState<string | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPullActive, setIsPullActive] = useState(false);
  const [isPullRefreshActive, setIsPullRefreshActive] = useState(false);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);

  const refetchSchedule = useEffectEvent(() => {
    if (!isAuthenticated) {
      return;
    }

    if (typeof document === "undefined" || document.visibilityState !== "visible") {
      return;
    }

    if (revalidator.state !== "idle") {
      return;
    }

    if (focusRefreshFrameRef.current !== null) {
      return;
    }

    focusRefreshFrameRef.current = window.requestAnimationFrame(() => {
      focusRefreshFrameRef.current = null;
      clearClientScheduleCacheForUrl(window.location.href);
      void revalidator.revalidate();
    });
  });

  const refreshScheduleFromPull = useEffectEvent(() => {
    if (!isAuthenticated || revalidator.state !== "idle") {
      return false;
    }

    clearClientScheduleCacheForUrl(window.location.href);
    isPullRefreshPendingRef.current = true;
    setIsPullRefreshActive(true);

    void revalidator.revalidate().finally(() => {
      isPullRefreshPendingRef.current = false;

      window.requestAnimationFrame(() => {
        setPullDistance(0);
        setIsPullRefreshActive(false);
      });
    });

    return true;
  });

  useEffect(() => {
    if (!tooltipRoomId) return;

    const dismiss = () => {
      setTooltipRoomId(null);
    };

    document.addEventListener("click", dismiss);

    return () => {
      document.removeEventListener("click", dismiss);
    };
  }, [tooltipRoomId]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(getCurrentTimeOffset());
    }, 60_000);

    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      refetchSchedule();
    }

    function handleWindowFocus() {
      refetchSchedule();
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) {
        return;
      }

      refetchSchedule();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handlePageShow);

      if (focusRefreshFrameRef.current !== null) {
        window.cancelAnimationFrame(focusRefreshFrameRef.current);
      }
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isMobileViewport = () => window.matchMedia("(max-width: 767px)").matches;
    const resetPullState = () => {
      pullStartYRef.current = null;
      pullStartXRef.current = null;
      pullDistanceRef.current = 0;
      isPullingRef.current = false;
    };

    function handleTouchStart(event: TouchEvent) {
      if (!isAuthenticated || !isMobileViewport() || event.touches.length !== 1) {
        resetPullState();
        return;
      }

      const touch = event.touches.item(0);

      if (!touch || window.scrollY > 0) {
        resetPullState();
        return;
      }

      pullStartYRef.current = touch.clientY;
      pullStartXRef.current = touch.clientX;
      pullDistanceRef.current = 0;
      isPullingRef.current = false;
    }

    function handleTouchMove(event: TouchEvent) {
      const startY = pullStartYRef.current;
      const startX = pullStartXRef.current;
      const touch = event.touches.item(0);

      if (startY === null || startX === null || !touch) {
        return;
      }

      const deltaY = touch.clientY - startY;
      const deltaX = Math.abs(touch.clientX - startX);

      if (deltaY <= 0) {
        return;
      }

      if (!isPullingRef.current && (deltaY < 10 || deltaY < deltaX * 1.35)) {
        return;
      }

      if (window.scrollY > 0) {
        resetPullState();
        setPullDistance(0);
        return;
      }

      event.preventDefault();

      const nextDistance = Math.min(deltaY * 0.48, PULL_REFRESH_MAX_DISTANCE);
      isPullingRef.current = true;
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);
      setIsPullActive(true);
    }

    function handleTouchEnd() {
      if (!isPullingRef.current) {
        resetPullState();
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= PULL_REFRESH_THRESHOLD;
      resetPullState();
      setIsPullActive(false);

      if (shouldRefresh && refreshScheduleFromPull()) {
        setPullDistance(PULL_REFRESH_TRIGGER_DISTANCE);
      } else {
        setPullDistance(0);
      }
    }

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (revalidator.state !== "idle" || !isPullRefreshPendingRef.current) {
      return;
    }

    isPullRefreshPendingRef.current = false;
    const frameId = window.requestAnimationFrame(() => {
      setPullDistance(0);
      setIsPullRefreshActive(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [revalidator.state]);

  function scrollToNow() {
    const offset = getCurrentTimeOffset();

    if (offset !== null && scrollRef.current) {
      scrollRef.current.scrollTo({
        behavior: "smooth",
        left: Math.max(offset - scrollRef.current.clientWidth / 2, 0),
      });
    }
  }

  function navigateToDate(nextDate: string | null) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("bookingId");
    nextParams.delete("endLocal");
    nextParams.delete("modal");
    nextParams.delete("roomId");
    nextParams.delete("startLocal");

    if (nextDate) {
      nextParams.set("date", nextDate);
    } else {
      nextParams.delete("date");
    }

    setSearchParams(nextParams);
  }

  function goToPreviousDay() {
    navigateToDate(getAdjacentDate(displayedDate, -1));
  }

  function goToNextDay() {
    navigateToDate(getAdjacentDate(displayedDate, 1));
  }

  function goToToday() {
    navigateToDate(null);
  }

  function openCreateModal(nextRoomId?: string, nextStartLocal?: string, nextEndLocal?: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("bookingId");
    nextParams.set("modal", "create");
    setPendingIntent(null);

    if (nextRoomId) {
      nextParams.set("roomId", nextRoomId);
    } else {
      nextParams.delete("roomId");
    }

    if (nextStartLocal && nextEndLocal) {
      nextParams.set("startLocal", nextStartLocal);
      nextParams.set("endLocal", nextEndLocal);
    } else {
      nextParams.delete("startLocal");
      nextParams.delete("endLocal");
    }

    setSearchParams(nextParams);
  }

  function openEditModal(nextBookingId: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("endLocal");
    nextParams.delete("roomId");
    nextParams.delete("startLocal");
    nextParams.set("bookingId", nextBookingId);
    nextParams.set("modal", "edit");
    setPendingIntent(null);
    setSearchParams(nextParams);
  }

  function closeModal() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("bookingId");
    nextParams.delete("endLocal");
    nextParams.delete("modal");
    nextParams.delete("roomId");
    nextParams.delete("startLocal");
    setPendingIntent(null);
    setSearchParams(nextParams);
  }

  const totalWidth = HOURS.length * HOUR_WIDTH;
  const modalKind = searchParams.get("modal");
  const requestedRoomId = searchParams.get("roomId") ?? undefined;
  const requestedStartLocal = parseDateTimeLocal(searchParams.get("startLocal"));
  const requestedEndLocal = parseDateTimeLocal(searchParams.get("endLocal"));
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
              : createCreateModalValues(
                  requestedRoomId,
                  date,
                  requestedStartLocal,
                  requestedEndLocal,
                ),
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
  const effectivePendingIntent = modalState === null || actionData?.error ? null : pendingIntent;
  const activeIntent = effectivePendingIntent ?? submittedIntent;
  const isSubmitting = effectivePendingIntent !== null || navigation.state === "submitting";
  const isDeleting = isSubmitting && activeIntent === "delete";
  const fallbackActiveRoomId = writableRooms[0]?.id || ROOMS[0]?.id || "";
  const activeRoomId =
    modalState && modalState.values.roomId.length > 0
      ? modalState.values.roomId
      : fallbackActiveRoomId;
  const canDeleteSelectedBooking =
    modalState?.kind === "edit" &&
    currentUserEmail !== null &&
    modalState.booking.creatorEmail !== null &&
    currentUserEmail.localeCompare(modalState.booking.creatorEmail, undefined, {
      sensitivity: "accent",
      usage: "search",
    }) === 0;
  const todayDate = getTodayAmsterdamDate();
  const pendingLocation =
    navigation.state === "loading" && navigation.location.pathname === location.pathname
      ? navigation.location
      : null;
  const pendingNavigationDate =
    pendingLocation === null
      ? null
      : (new URLSearchParams(pendingLocation.search).get("date") ?? todayDate);
  const isNavigatingToDifferentDate =
    pendingNavigationDate !== null && pendingNavigationDate !== date;
  const displayedDate = pendingNavigationDate ?? date;
  const displayedIsToday = displayedDate === todayDate;
  const isRefreshingSchedule = revalidator.state === "loading";
  const shouldShowRefreshLabel = isRefreshingSchedule && !isPullRefreshActive;

  function updateDragSelection(nextSelection: DragSelection | null) {
    dragSelectionRef.current = nextSelection;
    setDragSelection(nextSelection);
  }

  function canDragCreateInRoom(roomId: string) {
    return (
      isAuthenticated && !isNavigatingToDifferentDate && typeof roomCalendarIds[roomId] === "string"
    );
  }

  function handleSchedulePointerDown(event: ScheduleRowPointerEvent, roomId: string) {
    if (
      !canDragCreateInRoom(roomId) ||
      !event.isPrimary ||
      event.button !== 0 ||
      event.pointerType === "touch"
    ) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element) || target.closest("button, a, input, select, textarea")) {
      return;
    }

    const startX = getBoundedScheduleX(event.currentTarget, event.clientX, totalWidth);
    const nextSelection = {
      currentX: startX,
      pointerId: event.pointerId,
      roomId,
      startX,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    updateDragSelection(nextSelection);
  }

  function handleSchedulePointerMove(event: ScheduleRowPointerEvent) {
    const activeSelection = dragSelectionRef.current;

    if (activeSelection === null) {
      return;
    }

    if (activeSelection.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateDragSelection({
      ...activeSelection,
      currentX: getBoundedScheduleX(event.currentTarget, event.clientX, totalWidth),
    });
  }

  function handleSchedulePointerUp(event: ScheduleRowPointerEvent) {
    const activeSelection = dragSelectionRef.current;

    if (activeSelection === null) {
      return;
    }

    if (activeSelection.pointerId !== event.pointerId) {
      return;
    }

    const finalSelection = {
      ...activeSelection,
      currentX: getBoundedScheduleX(event.currentTarget, event.clientX, totalWidth),
    };
    const distance = Math.abs(finalSelection.currentX - finalSelection.startX);
    const bounds = getDragSelectionBounds(finalSelection, totalWidth);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    updateDragSelection(null);

    if (distance < DRAG_CREATE_MIN_DISTANCE || !canDragCreateInRoom(finalSelection.roomId)) {
      return;
    }

    openCreateModal(
      finalSelection.roomId,
      formatDateTimeLocalForHour(date, bounds.startHour),
      formatDateTimeLocalForHour(date, bounds.endHour),
    );
  }

  function handleSchedulePointerCancel(event: ScheduleRowPointerEvent) {
    const activeSelection = dragSelectionRef.current;

    if (activeSelection === null) {
      return;
    }

    if (activeSelection.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    updateDragSelection(null);
  }

  function handleFormSubmit(event: FormSubmitEvent) {
    const nativeEvent = event.nativeEvent;

    if (!(nativeEvent instanceof SubmitEvent)) {
      return;
    }

    const submitter = nativeEvent.submitter;

    if (!(submitter instanceof HTMLButtonElement) && !(submitter instanceof HTMLInputElement)) {
      return;
    }

    const intent =
      submitter.value === "delete"
        ? "delete"
        : submitter.value === "create"
          ? "create"
          : submitter.value === "update"
            ? "update"
            : null;

    if (intent) {
      setPendingIntent(intent);
    }
  }

  return (
    <div
      style={{ fontFamily: "'Source Sans 3 Variable', sans-serif" }}
      className="relative flex min-h-screen flex-col overflow-hidden overscroll-y-contain bg-white text-gray-900"
    >
      <div
        className="relative flex min-h-0 flex-1 flex-col"
        style={{
          transform: `translateY(${String(pullDistance)}px)`,
          transition: isPullActive ? "none" : "transform 250ms ease-out",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 z-40 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-opacity duration-150 md:hidden"
          style={{
            opacity: pullDistance > 0 || isRefreshingSchedule ? 1 : 0,
          }}
        >
          <svg
            className={cn("h-5 w-5 text-gray-600", isRefreshingSchedule && "animate-spin")}
            style={
              isRefreshingSchedule
                ? undefined
                : {
                    transform: `rotate(${String(Math.min(pullDistance * 4, 360))}deg)`,
                  }
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            viewBox="0 0 24 24"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>

        <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousDay}
                aria-label="Previous day"
                className="h-7 w-7 p-0 md:h-8 md:w-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextDay}
                aria-label="Next day"
                className="h-7 w-7 p-0 md:h-8 md:w-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
              {!displayedIsToday ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="ml-1 h-7 px-2 text-xs md:h-8 md:px-3 md:text-sm"
                >
                  Today
                </Button>
              ) : null}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-gray-900 md:text-lg">
                Room Schedule
              </h1>
              <p className="text-xs font-medium text-gray-500 md:text-sm">
                {formatScheduleDate(displayedDate)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            {shouldShowRefreshLabel ? (
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                <span
                  className="h-2 w-2 animate-pulse rounded-full"
                  style={{ backgroundColor: ACCENT }}
                />
                <span>Refreshing…</span>
              </div>
            ) : null}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 md:gap-2">
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
                {displayedIsToday && !isNavigatingToDifferentDate ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scrollToNow}
                    className="md:px-3 md:py-1.5 md:text-sm"
                  >
                    Now
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          <div className="w-11 shrink-0 border-r border-gray-200 md:w-[200px]">
            <div className="border-b border-gray-200" style={{ height: HEADER_HEIGHT }} />
            {ROOMS.map((room) => {
              const color = getRoomColor(room.id);
              const isTooltipOpen = tooltipRoomId === room.id;

              return (
                <div
                  key={room.id}
                  className="relative flex items-center justify-center gap-3 border-b border-gray-100 px-1 md:justify-start md:px-4"
                  style={{ height: ROW_HEIGHT }}
                >
                  <button
                    type="button"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full md:h-3 md:w-3 md:cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTooltipRoomId(isTooltipOpen ? null : room.id);
                    }}
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color.border }}
                    />
                  </button>
                  {isTooltipOpen && (
                    <div className="absolute left-10 z-30 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-lg md:hidden">
                      <p className="text-sm font-semibold leading-tight">{room.name}</p>
                      <p className="text-xs text-gray-400">{room.capacityLabel}</p>
                    </div>
                  )}
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
                const roomBookings = isNavigatingToDifferentDate
                  ? []
                  : (bookingsByRoom.get(room.id) ?? []);
                const color = getRoomColor(room.id);
                const canCreateInRoom = canDragCreateInRoom(room.id);
                const activeDragBounds =
                  dragSelection?.roomId === room.id
                    ? getDragSelectionBounds(dragSelection, totalWidth)
                    : null;

                return (
                  <div
                    key={room.id}
                    className={cn(
                      "relative select-none border-b border-gray-50",
                      canCreateInRoom && "cursor-crosshair",
                    )}
                    style={{ height: ROW_HEIGHT }}
                    onPointerDown={(event) => {
                      handleSchedulePointerDown(event, room.id);
                    }}
                    onPointerMove={handleSchedulePointerMove}
                    onPointerUp={handleSchedulePointerUp}
                    onPointerCancel={handleSchedulePointerCancel}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="absolute top-0 bottom-0 border-l border-gray-100"
                        style={{ left: (hour - HOURS[0]) * HOUR_WIDTH }}
                      />
                    ))}

                    {activeDragBounds ? (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1.5 bottom-1.5 z-10 flex items-center overflow-hidden rounded-lg border border-dashed px-3 shadow-sm"
                        style={{
                          backgroundColor: color.bg,
                          borderColor: color.border,
                          left: activeDragBounds.left,
                          width: activeDragBounds.width,
                        }}
                      >
                        {activeDragBounds.width >= 96 ? (
                          <span
                            className="truncate text-xs font-semibold"
                            style={{ color: color.text }}
                          >
                            {formatHour(activeDragBounds.startHour)} -{" "}
                            {formatHour(activeDragBounds.endHour)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {isNavigatingToDifferentDate
                      ? SKELETON_BLOCK_OFFSETS.map((offset, index) => (
                          <div
                            key={`${room.id}-skeleton-${String(index)}`}
                            className="absolute top-1.5 bottom-1.5 z-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100/90"
                            style={{
                              left: totalWidth * offset,
                              width: totalWidth * SKELETON_BLOCK_WIDTHS[index],
                            }}
                          >
                            <div className="px-3 py-2">
                              <div className="h-2.5 w-20 rounded-full bg-gray-200" />
                              <div className="mt-2 h-2 w-14 rounded-full bg-gray-200/80" />
                            </div>
                          </div>
                        ))
                      : roomBookings.map((booking) => {
                          const left = (booking.startHour - HOURS[0]) * HOUR_WIDTH;
                          const width = Math.max(
                            (booking.endHour - booking.startHour) * HOUR_WIDTH,
                            24,
                          );

                          return (
                            <button
                              key={booking.id}
                              type="button"
                              className="absolute top-1.5 bottom-1.5 z-20 flex cursor-pointer items-center overflow-hidden rounded-lg px-3 text-left transition-shadow hover:shadow-md"
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

                    {isAuthenticated &&
                    !isNavigatingToDifferentDate &&
                    typeof roomCalendarIds[room.id] === "string" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          openCreateModal(room.id);
                        }}
                        className="absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
                      >
                        Add
                      </Button>
                    ) : null}
                  </div>
                );
              })}

              {displayedIsToday && !isNavigatingToDifferentDate && now !== null ? (
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

              {isAuthenticated && !isNavigatingToDifferentDate && bookings.length === 0 ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60">
                  <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-center shadow-sm">
                    <p className="text-base font-semibold text-gray-900">
                      No bookings {displayedIsToday ? "today" : "on this day"}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Checked {String(roomCount)} room calendars
                      {displayedIsToday ? " for today" : ""} in Amsterdam time.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {!isAuthenticated ? <LoggedOutScheduleOverlay /> : null}
        </div>

        <footer className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>Gebruik op eigen risico. Data loopt via Google Calendar.</p>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Form
                  action="/auth/logout"
                  method="post"
                  onSubmit={() => {
                    clearClientScheduleCache();
                  }}
                >
                  <button className="transition hover:text-gray-900" type="submit">
                    Uitloggen en Google-koppeling verwijderen
                  </button>
                </Form>
              ) : null}
              <Link className="transition hover:text-gray-900" to="/privacy">
                Privacybeleid
              </Link>
              <Link className="transition hover:text-gray-900" to="/voorwaarden">
                Algemene voorwaarden
              </Link>
              <a
                className="transition hover:text-gray-900"
                href="https://github.com/atimmer/startup-rooms"
                rel="noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>

      <Dialog
        open={modalState !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        {modalState ? (
          <DialogContent
            style={{ fontFamily: "'Source Sans 3 Variable', sans-serif" }}
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

            <Form method="post" onSubmit={handleFormSubmit}>
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

              <div className="flex items-center justify-between gap-3">
                <div className="ml-auto flex gap-2">
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
                      ? activeIntent === "create"
                        ? "Creating..."
                        : activeIntent === "update"
                          ? "Saving..."
                          : modalState.kind === "create"
                            ? "Creating..."
                            : "Saving..."
                      : modalState.kind === "create"
                        ? "Create booking"
                        : "Save changes"}
                  </Button>
                </div>

                {canDeleteSelectedBooking ? (
                  <Button
                    className="order-first mr-auto"
                    variant="destructive"
                    size="lg"
                    disabled={isSubmitting}
                    name="intent"
                    type="submit"
                    value="delete"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                ) : null}
              </div>
            </Form>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
