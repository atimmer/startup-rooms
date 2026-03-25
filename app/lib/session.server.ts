import { createCookieSessionStorage } from "react-router";

import { env } from "./env.server";

interface GoogleSessionUser {
  email: string;
  name: string;
  picture?: string;
}

interface GoogleSessionTokens {
  accessToken?: string;
  expiryDate?: number;
  refreshToken: string;
  scope?: string;
  tokenType?: string;
}

function isGoogleSessionUser(value: unknown): value is GoogleSessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    (candidate.picture === undefined || typeof candidate.picture === "string")
  );
}

function isGoogleSessionTokens(value: unknown): value is GoogleSessionTokens {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.refreshToken === "string" &&
    (candidate.accessToken === undefined || typeof candidate.accessToken === "string") &&
    (candidate.expiryDate === undefined || typeof candidate.expiryDate === "number") &&
    (candidate.scope === undefined || typeof candidate.scope === "string") &&
    (candidate.tokenType === undefined || typeof candidate.tokenType === "string")
  );
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    name: "__session",
    path: "/",
    sameSite: "lax",
    secrets: [env.sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function commitSession(session: Awaited<ReturnType<typeof getSession>>) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: Awaited<ReturnType<typeof getSession>>) {
  return sessionStorage.destroySession(session);
}

export function readGoogleSession(session: Awaited<ReturnType<typeof getSession>>) {
  const googleTokens: unknown = session.get("googleTokens");
  const googleUser: unknown = session.get("googleUser");

  if (!isGoogleSessionTokens(googleTokens) || !isGoogleSessionUser(googleUser)) {
    return null;
  }

  return {
    googleTokens,
    googleUser,
  };
}

export function readOAuthState(session: Awaited<ReturnType<typeof getSession>>) {
  const oauthState: unknown = session.get("oauthState");

  if (typeof oauthState !== "string") {
    return null;
  }

  return oauthState;
}
