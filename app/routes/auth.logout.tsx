import { redirect } from "react-router";

import type { Route } from "./+types/auth.logout";

export async function action({ request }: Route.ActionArgs) {
  const { destroySession, getSession, readGoogleSession } = await import("../lib/session.server");
  const session = await getSession(request);
  const googleSession = readGoogleSession(session);
  const token = googleSession?.googleTokens.refreshToken ?? googleSession?.googleTokens.accessToken;

  if (token) {
    try {
      await fetch("https://oauth2.googleapis.com/revoke", {
        body: new URLSearchParams({ token }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        signal: AbortSignal.timeout(3_000),
      });
    } catch {
      // Local logout must still succeed when Google is unavailable.
    }
  }

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
