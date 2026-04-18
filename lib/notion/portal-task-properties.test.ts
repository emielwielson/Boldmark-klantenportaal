import { describe, expect, it } from "vitest";

import {
  getPortalOrderedPropertyKeys,
  getPortalPropertyRow,
  shouldShowPropertyEditor,
} from "./portal-task-properties";

describe("getPortalOrderedPropertyKeys", () => {
  it("returns only configured columns in portal order", () => {
    const properties = {
      Extra: { type: "rich_text", rich_text: [] },
      Status: { type: "status", status: { name: "Todo" } },
      Opmerking: { type: "rich_text", rich_text: [] },
      Categorie: { type: "select", select: null },
    };
    expect(getPortalOrderedPropertyKeys(properties)).toEqual([
      "Opmerking",
      "Status",
      "Categorie",
    ]);
  });

  it("matches Notion keys with stray spaces", () => {
    const properties = {
      " Klant V2": { type: "people", people: [] },
    };
    expect(getPortalOrderedPropertyKeys(properties)).toEqual([" Klant V2"]);
  });
});

describe("getPortalPropertyRow", () => {
  it("finds config by actual property key", () => {
    const properties = {
      Categorie: { type: "select", select: { name: "A" } },
    };
    expect(getPortalPropertyRow(properties, "Categorie")?.editable).toBe(false);
  });
});

describe("shouldShowPropertyEditor", () => {
  it("is false for read-only portal rows", () => {
    const properties = {
      Categorie: { type: "select", select: { name: "X" } },
    };
    expect(
      shouldShowPropertyEditor(properties, "Categorie", properties.Categorie),
    ).toBe(false);
  });

  it("is true for editable portal rows with supported type", () => {
    const properties = {
      Opmerking: { type: "rich_text", rich_text: [] },
    };
    expect(
      shouldShowPropertyEditor(properties, "Opmerking", properties.Opmerking),
    ).toBe(true);
  });

  it("is false when portal marks editable but Notion type is unsupported", () => {
    const properties = {
      Opmerking: { type: "formula", formula: { type: "string", string: "" } },
    };
    expect(
      shouldShowPropertyEditor(properties, "Opmerking", properties.Opmerking),
    ).toBe(false);
  });
});
