import type { Route } from "./+types/room-schedule";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import { SchedulePage } from "./room-schedule/schedule-page";
import {
  clearClientScheduleCache,
  readClientScheduleCache,
  writeClientScheduleCache,
} from "./room-schedule/schedule-client-cache";
import { loadScheduleData, mutateScheduleBooking } from "./room-schedule/schedule-server";

const MODAL_SEARCH_PARAM_KEYS = ["bookingId", "endLocal", "modal", "roomId", "startLocal"] as const;

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Nijmegen Startup Rooms" },
    { name: "description", content: "Live room schedule for today." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  return loadScheduleData(request);
}

export async function clientLoader({ request, serverLoader }: Route.ClientLoaderArgs) {
  const cachedData = readClientScheduleCache(request);

  if (cachedData) {
    return cachedData;
  }

  const data = await serverLoader();

  writeClientScheduleCache(request, data);

  return data;
}

export async function action({ request }: Route.ActionArgs) {
  return mutateScheduleBooking(request);
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  clearClientScheduleCache();

  try {
    return await serverAction();
  } finally {
    clearClientScheduleCache();
  }
}

function stripModalSearchParams(url: URL) {
  const params = new URLSearchParams(url.search);

  for (const key of MODAL_SEARCH_PARAM_KEYS) {
    params.delete(key);
  }

  return params.toString();
}

export function shouldRevalidate({
  currentUrl,
  defaultShouldRevalidate,
  formMethod,
  nextUrl,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod) {
    return defaultShouldRevalidate;
  }

  if (currentUrl.pathname !== nextUrl.pathname) {
    return defaultShouldRevalidate;
  }

  const currentSearch = stripModalSearchParams(currentUrl);
  const nextSearch = stripModalSearchParams(nextUrl);

  if (currentSearch === nextSearch) {
    return currentUrl.search === nextUrl.search ? defaultShouldRevalidate : false;
  }

  return defaultShouldRevalidate;
}

export function headers({ loaderHeaders, parentHeaders }: Route.HeadersArgs) {
  return { ...Object.fromEntries(parentHeaders), ...Object.fromEntries(loaderHeaders) };
}

export default function RoomScheduleRoute() {
  return <SchedulePage />;
}
