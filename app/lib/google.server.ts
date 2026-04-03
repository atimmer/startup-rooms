import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

import { env } from "./env.server";

const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

const googleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
] as const;

interface StoredGoogleTokens {
  accessToken?: string;
  expiryDate?: number;
  refreshToken: string;
  scope?: string;
  tokenType?: string;
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readStringProperty(value: unknown, key: string) {
  if (!isUnknownRecord(value) || !(key in value)) {
    return undefined;
  }

  const property = value[key];

  return typeof property === "string" ? property : undefined;
}

function readForwardedHeaderValue(headers: Headers, name: string) {
  const value = headers.get(name);

  if (!value) {
    return undefined;
  }

  const firstValue = value.split(",")[0]?.trim();

  return firstValue || undefined;
}

export function getGoogleRedirectUri(request: Request) {
  const redirectUrl = new URL(request.url);
  const forwardedHost = readForwardedHeaderValue(request.headers, "x-forwarded-host");
  const forwardedProto = readForwardedHeaderValue(request.headers, "x-forwarded-proto");

  if (forwardedHost) {
    const forwardedOriginUrl = new URL(`https://${forwardedHost}`);

    redirectUrl.hostname = forwardedOriginUrl.hostname;
    redirectUrl.port = forwardedOriginUrl.port;
  }

  if (forwardedProto) {
    redirectUrl.protocol = `${forwardedProto}:`;
  }

  redirectUrl.pathname = GOOGLE_CALLBACK_PATH;
  redirectUrl.search = "";
  redirectUrl.hash = "";

  if (redirectUrl.origin !== "null") {
    return redirectUrl.toString();
  }

  if (env.googleRedirectUri) {
    return env.googleRedirectUri;
  }

  throw new Error("Unable to determine Google redirect URI from the incoming request.");
}

function createOAuthClient(redirectUri?: string) {
  return new OAuth2Client({
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    redirectUri: redirectUri ?? env.googleRedirectUri,
  });
}

export function getGoogleAuthUrl(state: string, redirectUri: string) {
  const client = createOAuthClient(redirectUri);

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...googleScopes],
    state,
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const client = createOAuthClient(redirectUri);
  const response = await client.getToken(code);

  if (!response.tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }

  client.setCredentials(response.tokens);

  const oauth2 = google.oauth2({
    auth: client,
    version: "v2",
  });
  const userInfoResponse = await oauth2.userinfo.get();
  const userInfo = userInfoResponse.data;

  if (!userInfo.email || !userInfo.name) {
    throw new Error("Google did not return the expected user profile.");
  }

  return {
    tokens: {
      accessToken: response.tokens.access_token,
      expiryDate: response.tokens.expiry_date ?? undefined,
      refreshToken: response.tokens.refresh_token ?? undefined,
      scope: response.tokens.scope ?? undefined,
      tokenType: response.tokens.token_type ?? undefined,
    },
    user: {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture ?? undefined,
    },
  };
}

export async function createAuthorizedCalendarClient(tokens: StoredGoogleTokens) {
  const client = createOAuthClient();

  client.setCredentials({
    access_token: tokens.accessToken,
    expiry_date: tokens.expiryDate,
    refresh_token: tokens.refreshToken,
    scope: tokens.scope,
    token_type: tokens.tokenType,
  });

  await client.getAccessToken();

  return {
    calendar: google.calendar({
      auth: client,
      version: "v3",
    }),
    refreshedTokens: {
      accessToken: client.credentials.access_token ?? undefined,
      expiryDate: client.credentials.expiry_date ?? undefined,
      refreshToken: client.credentials.refresh_token ?? tokens.refreshToken,
      scope: client.credentials.scope ?? tokens.scope,
      tokenType: client.credentials.token_type ?? tokens.tokenType,
    },
  };
}

export function isGoogleAuthInvalidGrantError(error: unknown) {
  if (error instanceof Error && error.message.includes("invalid_grant")) {
    return true;
  }

  if (!error || typeof error !== "object" || !("response" in error)) {
    return false;
  }

  const response = error.response;

  if (!response || typeof response !== "object" || !("data" in response)) {
    return false;
  }

  return readStringProperty(response.data, "error") === "invalid_grant";
}
