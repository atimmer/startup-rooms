import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

import { env } from "./env.server";

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

function createOAuthClient() {
  return new OAuth2Client({
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    redirectUri: env.googleRedirectUri,
  });
}

export function getGoogleAuthUrl(state: string) {
  const client = createOAuthClient();

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...googleScopes],
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuthClient();
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
