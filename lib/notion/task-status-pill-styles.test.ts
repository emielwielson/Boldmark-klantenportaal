import { describe, expect, it } from "vitest";

import { getTaskStatusPillStyle } from "./task-status-pill-styles";

describe("getTaskStatusPillStyle", () => {
  it("matches known labels case-insensitively", () => {
    expect(getTaskStatusPillStyle("  Bezig ").dot).toBe(
      getTaskStatusPillStyle("bezig").dot,
    );
    expect(getTaskStatusPillStyle("Waiting input").chip).toContain("faf0ea");
  });

  it("falls back to neutral for unknown status", () => {
    expect(getTaskStatusPillStyle("Custom status").chip).toContain("slate");
  });
});
