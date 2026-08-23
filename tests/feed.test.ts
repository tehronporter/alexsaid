import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/catalog";
import { dailyQuoteOrder, eligibleQuotes, localDateKey } from "@/lib/feed";
import { defaultLocalState } from "@/lib/local-state";

describe("quote feed", () => {
  it("is deterministic for a local calendar day", () => {
    const date = new Date(2026, 7, 23, 12);
    const first = dailyQuoteOrder(catalog.quotes, defaultLocalState, date).map(({ id }) => id);
    const second = dailyQuoteOrder(catalog.quotes, defaultLocalState, date).map(({ id }) => id);
    expect(first).toEqual(second);
    expect(localDateKey(date)).toBe("2026-08-23");
  });

  it("limits a favorite-topic feed without changing IDs", () => {
    const state = { ...defaultLocalState, feedScope: "favorite-topics" as const, favoriteCategories: ["Sales"] };
    const quotes = eligibleQuotes(catalog.quotes, state);
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.every(({ primaryCategory }) => primaryCategory === "Sales")).toBe(true);
  });
});
