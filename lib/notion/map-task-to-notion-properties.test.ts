import { describe, expect, it } from "vitest";

import { plainValueToNotionPropertyUpdate } from "./map-task-to-notion-properties";

describe("plainValueToNotionPropertyUpdate", () => {
  it("maps title from string", () => {
    const cached = { type: "title", title: [] };
    const out = plainValueToNotionPropertyUpdate(cached, "New title");
    expect(out.type).toBe("title");
    expect(out).toMatchObject({
      title: [{ type: "text", text: { content: "New title" } }],
    });
  });

  it("maps number null from empty input", () => {
    const cached = { type: "number", number: 1 };
    const out = plainValueToNotionPropertyUpdate(cached, null);
    expect(out).toEqual({ number: null, type: "number" });
  });

  it("maps select to null when empty", () => {
    const cached = {
      type: "select",
      select: { name: "A", id: "x", color: "default" },
    };
    const out = plainValueToNotionPropertyUpdate(cached, "");
    expect(out).toEqual({ select: null, type: "select" });
  });

  it("throws for unsupported types", () => {
    const cached = { type: "formula", formula: { type: "string", string: "x" } };
    expect(() =>
      plainValueToNotionPropertyUpdate(cached, "x"),
    ).toThrow(/nog niet ondersteund/);
  });
});
