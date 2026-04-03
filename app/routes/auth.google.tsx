import { redirectDocument } from "react-router";

import type { Route } from "./+types/auth.google";

export async function loader({ request }: Route.LoaderArgs) {
  const [{ getGoogleAuthUrl, getGoogleRedirectUri }, { commitSession, getSession }] =
    await Promise.all([import("../lib/google.server"), import("../lib/session.server")]);
  const session = await getSession(request);
  const state = crypto.randomUUID();

  session.set("oauthState", state);

  return redirectDocument(getGoogleAuthUrl(state, getGoogleRedirectUri(request)), {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function GoogleAuthRoute() {
  return null;
}
