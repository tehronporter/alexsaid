import { describe, expect, it } from "vitest";
import { quoteDisplaySize, quoteTypographyStyle, type QuoteTypographyStyle } from "@/lib/typography";

const cases: Array<[number, QuoteTypographyStyle]> = [
  [0, "xl"],
  [80, "xl"],
  [81, "large"],
  [150, "large"],
  [151, "medium"],
  [240, "medium"],
  [241, "small"],
  [420, "small"],
];

describe("quote typography", () => {
  it.each(cases)("maps %i trimmed characters to %s", (length, expected) => {
    expect(quoteTypographyStyle(`  ${"x".repeat(length)}  `)).toBe(expected);
  });

  it("returns reusable stage and panel classes for the selected tier", () => {
    expect(quoteDisplaySize("x".repeat(37))).toBe("quote-copy quote-copy--xl");
    expect(quoteDisplaySize("x".repeat(241), "panel")).toBe("quote-copy quote-panel-copy quote-copy--small");
  });
});
