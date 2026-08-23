import { describe, expect, it } from "vitest";
import { wrapShareCardLines } from "@/lib/share-card";

describe("share-card line wrapping", () => {
  it("keeps words intact and wraps within the requested width", () => {
    const context = { measureText: (value: string) => ({ width: value.length * 10 }) as TextMetrics };
    expect(wrapShareCardLines(context, "MAKE PEOPLE AN OFFER", 110)).toEqual(["MAKE PEOPLE", "AN OFFER"]);
  });
});
