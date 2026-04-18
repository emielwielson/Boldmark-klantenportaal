import { describe, expect, it } from "vitest";

import {
  formatDayKeyForCalendar,
  getPublicatiedatumDayKey,
  isDayKeyInMonth,
  notionDateStartToDayKey,
} from "./task-calendar-date";

describe("notionDateStartToDayKey", () => {
  it("normalizes ISO date-only", () => {
    expect(notionDateStartToDayKey("2026-04-17")).toBe("2026-04-17");
  });

  it("takes date part from datetime", () => {
    expect(notionDateStartToDayKey("2026-04-17T12:00:00.000Z")).toBe(
      "2026-04-17",
    );
  });

  it("returns null for empty", () => {
    expect(notionDateStartToDayKey(null)).toBeNull();
    expect(notionDateStartToDayKey("")).toBeNull();
  });
});

describe("getPublicatiedatumDayKey", () => {
  it("reads Publicatiedatum date property", () => {
    const properties = {
      Publicatiedatum: {
        type: "date",
        id: "x",
        date: { start: "2026-05-01", end: null },
      },
    };
    expect(getPublicatiedatumDayKey(properties)).toBe("2026-05-01");
  });

  it("matches column title with leading space", () => {
    const properties = {
      " Publicatiedatum": {
        type: "date",
        id: "x",
        date: { start: "2026-06-15" },
      },
    };
    expect(getPublicatiedatumDayKey(properties)).toBe("2026-06-15");
  });

  it("returns null when missing or wrong type", () => {
    expect(getPublicatiedatumDayKey({})).toBeNull();
    expect(
      getPublicatiedatumDayKey({
        Publicatiedatum: { type: "rich_text", rich_text: [] },
      }),
    ).toBeNull();
  });
});

describe("isDayKeyInMonth", () => {
  it("matches year and month", () => {
    expect(isDayKeyInMonth("2026-03-10", 2026, 2)).toBe(true);
    expect(isDayKeyInMonth("2026-03-10", 2026, 3)).toBe(false);
  });
});

describe("formatDayKeyForCalendar", () => {
  it("pads month and day", () => {
    expect(formatDayKeyForCalendar(2026, 3, 7)).toBe("2026-04-07");
  });
});
