import { beforeEach, describe, expect, it, vi } from "vitest";

function setRequiredGoogleEnv() {
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.SESSION_SECRET = "test-session-secret";
}

describe("getGoogleRedirectUri", () => {
  beforeEach(() => {
    vi.resetModules();
    setRequiredGoogleEnv();
    delete process.env.GOOGLE_REDIRECT_URI;
  });

  it("builds the callback URI from the request origin", async () => {
    const { getGoogleRedirectUri } = await import("./google.server");
    const request = new Request("https://startup-rooms.24letters.com/auth/google");

    expect(getGoogleRedirectUri(request)).toBe(
      "https://startup-rooms.24letters.com/auth/google/callback",
    );
  });

  it("prefers forwarded host and protocol headers", async () => {
    const { getGoogleRedirectUri } = await import("./google.server");
    const request = new Request("http://127.0.0.1:3000/auth/google", {
      headers: {
        "x-forwarded-host": "startup-rooms.24letters.com",
        "x-forwarded-proto": "https",
      },
    });

    expect(getGoogleRedirectUri(request)).toBe(
      "https://startup-rooms.24letters.com/auth/google/callback",
    );
  });
});
