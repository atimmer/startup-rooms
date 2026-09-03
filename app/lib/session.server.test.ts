import { describe, expect, it } from "vitest";

import { decryptSessionValue, encryptSessionValue } from "./session.server";

const TEST_SECRET = "a-test-secret-that-is-long-enough-for-session-encryption";

describe("session encryption", () => {
  it("encrypts and decrypts session data", async () => {
    const sessionData = {
      googleTokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
      googleUser: {
        email: "anton@example.com",
        name: "Anton",
      },
    };

    const encrypted = await encryptSessionValue(sessionData, TEST_SECRET);

    expect(encrypted).not.toContain("refresh-token");
    await expect(decryptSessionValue(encrypted, TEST_SECRET)).resolves.toEqual(sessionData);
  });

  it("returns empty session data for tampered or garbage input", async () => {
    const encrypted = await encryptSessionValue({ oauthState: "state" }, TEST_SECRET);
    const tamperedBytes = Buffer.from(encrypted, "base64url");

    tamperedBytes[0] ^= 1;

    const tampered = tamperedBytes.toString("base64url");

    await expect(decryptSessionValue(tampered, TEST_SECRET)).resolves.toEqual({});
    await expect(decryptSessionValue("not-valid-ciphertext", TEST_SECRET)).resolves.toEqual({});
  });
});
