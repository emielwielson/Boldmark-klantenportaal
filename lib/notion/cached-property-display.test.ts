import { describe, expect, it } from "vitest";

import {
  formatCachedPropertyPreview,
  getTitleFromProperties,
  isCachedPropertyEditable,
  mergeSelectOptionNames,
  notionPublicPageUrl,
} from "./cached-property-display";

describe("notionPublicPageUrl", () => {
  it("strips hyphens from UUID", () => {
    expect(
      notionPublicPageUrl("182d872b-594c-81f6-aa78-00027a202298"),
    ).toBe("https://www.notion.so/182d872b594c81f6aa7800027a202298");
  });
});

describe("getTitleFromProperties", () => {
  it("reads plain text from title property", () => {
    const properties = {
      Name: {
        type: "title",
        title: [{ plain_text: "Hello", type: "text", text: { content: "Hello" } }],
      },
    };
    expect(getTitleFromProperties(properties)).toBe("Hello");
  });
});

describe("formatCachedPropertyPreview", () => {
  it("formats checkbox", () => {
    expect(
      formatCachedPropertyPreview({ type: "checkbox", checkbox: true }),
    ).toBe("Ja");
    expect(
      formatCachedPropertyPreview({ type: "checkbox", checkbox: false }),
    ).toBe("Nee");
  });

  it("formats select name", () => {
    expect(
      formatCachedPropertyPreview({
        type: "select",
        select: { name: "Done", id: "a" },
      }),
    ).toBe("Done");
  });
});

describe("isCachedPropertyEditable", () => {
  it("accepts supported types", () => {
    expect(isCachedPropertyEditable("rich_text")).toBe(true);
    expect(isCachedPropertyEditable("formula")).toBe(false);
  });
});

describe("mergeSelectOptionNames", () => {
  it("includes current selection when page snapshot has no schema options", () => {
    const snapshot = {
      type: "select",
      select: { name: "Cat A", id: "x", color: "default" },
    };
    expect(mergeSelectOptionNames(undefined, snapshot)).toEqual(["Cat A"]);
  });

  it("merges schema names with current value", () => {
    const snapshot = {
      type: "select",
      select: { name: "B", id: "x", color: "default" },
    };
    expect(mergeSelectOptionNames(["A", "B", "C"], snapshot)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });
});

