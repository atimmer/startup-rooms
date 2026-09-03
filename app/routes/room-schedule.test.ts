import { describe, expect, it } from "vitest";

import type { Route } from "./+types/room-schedule";
import { headers } from "./room-schedule";

describe("room schedule headers", () => {
  it("merges parent security headers with loader headers", () => {
    const args = {
      actionHeaders: new Headers(),
      errorHeaders: undefined,
      loaderHeaders: new Headers({
        "Cache-Control": "private, max-age=60",
        "X-Frame-Options": "SAMEORIGIN",
      }),
      parentHeaders: new Headers({
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      }),
    } satisfies Route.HeadersArgs;

    expect(headers(args)).toEqual({
      "cache-control": "private, max-age=60",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
      "x-frame-options": "SAMEORIGIN",
    });
  });
});
