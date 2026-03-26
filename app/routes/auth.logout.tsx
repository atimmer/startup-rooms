import { redirect } from "react-router";

import type { Route } from "./+types/auth.logout";

export async function action({ request }: Route.ActionArgs) {
  const { destroySession, getSession } = await import("../lib/session.server");
  const session = await getSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export function loader() {
  return new Response("Method not allowed", { status: 405 });
}

export default function GoogleLogoutRoute() {
  return null;
}
