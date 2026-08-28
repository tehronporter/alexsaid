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
    const category = catalog.quotes[0].primaryCategory;
    const state = { ...defaultLocalState, feedScope: "favorite-topics" as const, favoriteCategories: [category] };
    const quotes = eligibleQuotes(catalog.quotes, state);
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.every(({ primaryCategory }) => primaryCategory === category)).toBe(true);
  });

  it("avoids immediate same-source runs whenever an alternative exists", () => {
    const ordered = dailyQuoteOrder(catalog.quotes, defaultLocalState, new Date(2026, 7, 23, 12));
    const source = (url: string | null) => url?.replace(/[?#](?:t|start)=?[^#&]*/g, "") ?? "";
    for (let index = 1; index < ordered.length; index += 1) {
      const alternatives = ordered.slice(index).some((quote) => source(quote.sourceURL) !== source(ordered[index - 1].sourceURL));
      if (alternatives) expect(source(ordered[index].sourceURL)).not.toBe(source(ordered[index - 1].sourceURL));
    }
  });
});
