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

  it("maps image (external) with caption", () => {
    const block = {
      type: "image",
      image: {
        type: "external",
        external: { url: "https://example.com/a.png" },
        caption: [{ plain_text: "Alt text", type: "text" }],
      },
    } as unknown as BlockObjectResponse;
    expect(mapNotionBlockToDisplay(block, 0)).toEqual({
      kind: "image",
      url: "https://example.com/a.png",
      caption: "Alt text",
      depth: 0,
    });
  });

  it("maps image (hosted file) without caption", () => {
    const block = {
      type: "image",
      image: {
        type: "file",
        file: {
          url: "https://prod-files-secure.s3.us-west-2.amazonaws.com/x/y/z.png",
          expiry_time: "2099-01-01T00:00:00.000Z",
        },
        caption: [],
      },
    } as unknown as BlockObjectResponse;
    expect(mapNotionBlockToDisplay(block, 2)).toEqual({
      kind: "image",
      url: "https://prod-files-secure.s3.us-west-2.amazonaws.com/x/y/z.png",
      caption: null,
      depth: 2,
    });
  });

  it("falls back to unsupported when image URL is missing", () => {
    const block = {
      type: "image",
      image: {
        type: "external",
        external: { url: "" },
        caption: [],
      },
    } as unknown as BlockObjectResponse;
    expect(mapNotionBlockToDisplay(block, 0)).toEqual({
      kind: "unsupported",
      notionType: "image",
      depth: 0,
    });
  });
});
