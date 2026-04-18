import type { BlockObjectResponse } from "@notionhq/client";
import { describe, expect, it } from "vitest";

import { mapNotionBlockToDisplay } from "./notion-block-to-display";

describe("mapNotionBlockToDisplay", () => {
  it("maps paragraph rich_text", () => {
    const block = {
      type: "paragraph",
      paragraph: {
        rich_text: [{ plain_text: "Line", type: "text" }],
      },
    } as unknown as BlockObjectResponse;
    expect(mapNotionBlockToDisplay(block, 0)).toEqual({
      kind: "paragraph",
      text: "Line",
      depth: 0,
    });
  });

  it("maps divider", () => {
    const block = { type: "divider" } as unknown as BlockObjectResponse;
    expect(mapNotionBlockToDisplay(block, 2)).toEqual({
      kind: "divider",
      depth: 2,
    });
  });

  it("preserves depth for headings", () => {
    const block = {
      type: "heading_2",
      heading_2: {
        rich_text: [{ plain_text: "T", type: "text" }],
        color: "default",
        is_toggleable: false,
      },
    } as unknown as BlockObjectResponse;
    expect(mapNotionBlockToDisplay(block, 1)).toEqual({
      kind: "heading",
      level: 2,
      text: "T",
      depth: 1,
    });
  });
});
