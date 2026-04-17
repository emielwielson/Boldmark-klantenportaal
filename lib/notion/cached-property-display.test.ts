import { describe, expect, it } from "vitest";

import {
  formatCachedPropertyPreview,
  getTitleFromProperties,
  isCachedPropertyEditable,
  notionPublicPageUrl,
  orderedPropertyKeys,
  shouldAllowPortalEdit,
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

describe("orderedPropertyKeys", () => {
  it("orders title first, then Klant, then alphabetical", () => {
    const properties = {
      Zeta: { type: "rich_text", rich_text: [] },
      Name: { type: "title", title: [] },
      " Klant V2": { type: "people", people: [] },
    };
    expect(orderedPropertyKeys(properties, "Klant V2")).toEqual([
      "Name",
      " Klant V2",
      "Zeta",
    ]);
  });
});

describe("shouldAllowPortalEdit", () => {
  it("blocks Klant column even if type is editable", () => {
    expect(
      shouldAllowPortalEdit(
        "Klant V2",
        { type: "people", people: [] },
        "Klant V2",
      ),
    ).toBe(false);
  });

  it("allows rich_text when not Klant", () => {
    expect(
      shouldAllowPortalEdit(
        "Notes",
        { type: "rich_text", rich_text: [] },
        "Klant V2",
      ),
    ).toBe(true);
  });
});
