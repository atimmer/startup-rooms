import { createCookie, createCookieSessionStorage } from "react-router";
import type { Cookie } from "react-router";

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

function isSessionCookieData(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function deriveEncryptionKey(secret: string) {
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));

  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt", "encrypt"]);
}

export async function encryptSessionValue(
  value: Record<string, unknown>,
  secret = env.sessionSecret,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(secret);
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      plaintext,
    ),
  );
  const payload = new Uint8Array(iv.length + encrypted.length);

  payload.set(iv);
  payload.set(encrypted, iv.length);

  return Buffer.from(payload).toString("base64url");
}

export async function decryptSessionValue(value: string, secret = env.sessionSecret) {
  try {
    const payload = Uint8Array.from(Buffer.from(value, "base64url"));

    if (payload.length <= 12) {
      return {};
    }

    const key = await deriveEncryptionKey(secret);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: payload.slice(0, 12),
      },
      key,
      payload.slice(12),
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(decrypted));

    return isSessionCookieData(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const signedCookie = createCookie("__session", {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax",
  secrets: [env.sessionSecret],
  secure: process.env.NODE_ENV === "production",
});

const encryptedCookie = {
  get expires() {
    return signedCookie.expires;
  },
  isSigned: signedCookie.isSigned,
  name: signedCookie.name,
  async parse(cookieHeader: string | null, options?: Parameters<typeof signedCookie.parse>[1]) {
    const encryptedValue: unknown = await signedCookie.parse(cookieHeader, options);

    return typeof encryptedValue === "string" ? decryptSessionValue(encryptedValue) : {};
  },
  async serialize(value: unknown, options?: Parameters<typeof signedCookie.serialize>[1]) {
    if (value === "") {
      return signedCookie.serialize(value, options);
    }

    const encryptedValue = isSessionCookieData(value) ? await encryptSessionValue(value) : "";

    return signedCookie.serialize(encryptedValue, options);
  },
} satisfies Cookie;

const sessionStorage = createCookieSessionStorage({
  cookie: encryptedCookie,
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
