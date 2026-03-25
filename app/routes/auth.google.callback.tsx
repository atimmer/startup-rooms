import { redirect } from "react-router";

import type { Route } from "./+types/auth.google.callback";

export async function loader({ request }: Route.LoaderArgs) {
  const [
    { exchangeCodeForTokens },
    { commitSession, getSession, readGoogleSession, readOAuthState },
  ] = await Promise.all([import("../lib/google.server"), import("../lib/session.server")]);
  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return new Response(`Google OAuth failed: ${error}`, { status: 400 });
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return new Response("Google OAuth callback is missing code or state.", { status: 400 });
  }

  const session = await getSession(request);
  const expectedState = readOAuthState(session);
  const existingGoogleSession = readGoogleSession(session);

  if (!expectedState || expectedState !== state) {
    return new Response("OAuth state mismatch.", { status: 400 });
  }

  const result = await exchangeCodeForTokens(code);
  const refreshToken =
    result.tokens.refreshToken ?? existingGoogleSession?.googleTokens.refreshToken;

  if (!refreshToken) {
    return new Response("Google did not return a refresh token.", { status: 400 });
  }

  session.unset("oauthState");
  session.set("googleTokens", {
    ...result.tokens,
    refreshToken,
  });
  session.set("googleUser", result.user);

  return redirect("/google-calendar", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function GoogleAuthCallbackRoute() {
  return null;
}
