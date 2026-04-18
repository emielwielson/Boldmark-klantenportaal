import type { PageObjectResponse } from "@notionhq/client";
import { describe, expect, it } from "vitest";

import { extractKlantV2PersonIds } from "@/lib/notion/map-page-to-task";

describe("extractKlantV2PersonIds", () => {
  const personId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  it("reads People via schema property key when title-based name is absent", () => {
    const schemaKey = "xxxxx-schema-key-xxxxx";
    const page = {
      properties: {
        [schemaKey]: {
          type: "people",
          people: [{ object: "user", id: personId }],
        },
      },
    } as unknown as PageObjectResponse;

    const byName = extractKlantV2PersonIds(page, "KlantV2");
    expect(byName).toEqual([]);

    const bySchema = extractKlantV2PersonIds(page, "KlantV2", schemaKey);
    expect(bySchema).toEqual([personId.toLowerCase()]);
  });
});
