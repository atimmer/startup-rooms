import type { Route } from "./+types/room-schedule";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import { SchedulePage } from "./room-schedule/schedule-page";
import { loadScheduleData, mutateScheduleBooking } from "./room-schedule/schedule-server";

const MODAL_SEARCH_PARAM_KEYS = ["bookingId", "modal", "roomId"] as const;

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Meeting Rooms" },
    { name: "description", content: "Live room schedule for today." },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  return loadScheduleData(request);
}

export async function action({ request }: Route.ActionArgs) {
  return mutateScheduleBooking(request);
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
    return false;
  }

  return defaultShouldRevalidate;
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export default function RoomScheduleRoute() {
  return <SchedulePage />;
}
