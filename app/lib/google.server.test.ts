import { describe, expect, it, vi } from "vitest";

vi.mock("./env.server", () => ({
  env: {
    googleClientId: "client-id",
    googleClientSecret: "client-secret",
    googleRedirectUri: "http://localhost/auth/google/callback",
  },
}));

import {
  hasRequiredGoogleCalendarScopes,
  isGoogleAuthInsufficientScopesError,
} from "./google.server";

const eventScope = "https://www.googleapis.com/auth/calendar.events";
const calendarListScope = "https://www.googleapis.com/auth/calendar.calendarlist.readonly";

describe("Google OAuth scopes", () => {
  it("requires both Calendar permissions", () => {
    expect(hasRequiredGoogleCalendarScopes(undefined)).toBe(false);
    expect(hasRequiredGoogleCalendarScopes("openid email profile")).toBe(false);
    expect(hasRequiredGoogleCalendarScopes(`openid ${eventScope}`)).toBe(false);
    expect(hasRequiredGoogleCalendarScopes(`openid ${calendarListScope}`)).toBe(false);
    expect(
      hasRequiredGoogleCalendarScopes(`openid email profile ${eventScope} ${calendarListScope}`),
    ).toBe(true);
  });

  it("recognizes Google's insufficient-scope error", () => {
    expect(
      isGoogleAuthInsufficientScopesError(
        new Error("Request had insufficient authentication scopes."),
      ),
    ).toBe(true);
    expect(isGoogleAuthInsufficientScopesError(new Error("invalid_grant"))).toBe(false);
  });
});
