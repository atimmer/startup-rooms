import { describe, expect, it } from "vitest";

import { resolveCreatorEmail } from "./schedule-event";

describe("resolveCreatorEmail", () => {
  it("falls back to the organizer email", () => {
    expect(resolveCreatorEmail({ organizer: { email: "organizer@example.com" } })).toBe(
      "organizer@example.com",
    );
  });
});
