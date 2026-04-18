import { describe, expect, it } from "vitest";

import {
  getTaskStatusPillStyle,
  groupStatusNamesForSelect,
} from "./task-status-pill-styles";

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

describe("groupStatusNamesForSelect", () => {
  it("orders known statuses by Boldmark groups", () => {
    const groups = groupStatusNamesForSelect([
      "Uitgevoerd",
      "Niet gestart",
      "Bezig",
      "Nagekeken",
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      "To-do",
      "In progress",
      "Complete",
    ]);
    expect(groups[0]?.options).toEqual(["Niet gestart"]);
    expect(groups[1]?.options).toEqual(["Bezig", "Nagekeken"]);
    expect(groups[2]?.options).toEqual(["Uitgevoerd"]);
  });

  it("puts unknown names in Overig sorted", () => {
    const groups = groupStatusNamesForSelect(["Bezig", "Z-custom", "A-custom"]);
    const overig = groups.find((g) => g.label === "Overig");
    expect(overig?.options).toEqual(["A-custom", "Z-custom"]);
  });
});
