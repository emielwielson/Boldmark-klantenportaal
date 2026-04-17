import type { PageObjectResponse } from "@notionhq/client";
import { describe, expect, it } from "vitest";

import { matchPagePropertyKey } from "./match-page-property-key";

function props(
  entries: Record<string, PageObjectResponse["properties"][string]>,
): PageObjectResponse["properties"] {
  return entries as PageObjectResponse["properties"];
}

describe("matchPagePropertyKey", () => {
  it("returns exact configured key when present", () => {
    const p = props({
      Name: {
        type: "title",
        title: [{ type: "text", plain_text: "Hi", text: { content: "Hi" } }],
        id: "x",
      },
    });
    expect(matchPagePropertyKey(p, "Name")).toBe("Name");
  });

  it("matches key with leading space to configured name", () => {
    const p = props({
      " Klant V2": {
        type: "people",
        people: [],
        id: "y",
      },
    });
    expect(matchPagePropertyKey(p, "Klant V2")).toBe(" Klant V2");
  });

  it("returns undefined when no match", () => {
    const p = props({
      Other: { type: "rich_text", rich_text: [], id: "z" },
    });
    expect(matchPagePropertyKey(p, "Missing")).toBeUndefined();
  });
});
