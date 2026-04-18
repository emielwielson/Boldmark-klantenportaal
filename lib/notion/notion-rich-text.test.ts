import { describe, expect, it } from "vitest";

import { richTextToPlain } from "./notion-rich-text";

describe("richTextToPlain", () => {
  it("returns empty for undefined or empty", () => {
    expect(richTextToPlain(undefined)).toBe("");
    expect(richTextToPlain([])).toBe("");
  });

  it("joins plain_text segments and trims", () => {
    expect(
      richTextToPlain([
        { plain_text: "Hello", type: "text" },
        { plain_text: " world", type: "text" },
      ] as Parameters<typeof richTextToPlain>[0]),
    ).toBe("Hello world");
  });
});
