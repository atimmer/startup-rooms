import type { Route } from "./+types/design7";
import { SchedulePage } from "./design7/schedule-page";
import { loadScheduleData, mutateScheduleBooking } from "./design7/schedule-server";

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

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export default function Design7() {
  return <SchedulePage />;
}
