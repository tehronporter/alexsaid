import { describe, expect, it } from "vitest";
import type { Quote } from "@/domain/catalog";
import { catalog } from "@/lib/catalog";
import { dailyQuoteOrder } from "@/lib/feed";
import { defaultLocalState } from "@/lib/local-state";
import { createQuoteSearchIndex } from "@/lib/search";

function syntheticCatalog(size: number): Quote[] {
  return Array.from({ length: size }, (_, index) => ({
    ...catalog.quotes[index % catalog.quotes.length],
    id: `${String(index).padStart(8, "0")}-0000-4000-8000-${String(index).padStart(12, "0")}`,
    text: `${catalog.quotes[index % catalog.quotes.length].text} Fixture ${index}.`,
    sourceTitle: `Synthetic source ${index % 500}`,
    sourceURL: `https://example.test/source/${index % 500}#t=${index}`
  }));
}

describe("5,000 quote regression budgets", () => {
  it("builds one search index and shuffles the complete feed within budget", () => {
    const quotes = syntheticCatalog(5_000);
    const started = performance.now();
    const index = createQuoteSearchIndex(quotes);
    const indexedAt = performance.now();
    const results = index.search(catalog.quotes[0].tags[0]);
    const searchedAt = performance.now();
    const order = dailyQuoteOrder(quotes, defaultLocalState, new Date(2026, 7, 23));
    const finished = performance.now();
    expect(indexedAt - started).toBeLessThan(500);
    expect(searchedAt - indexedAt).toBeLessThan(250);
    expect(finished - searchedAt).toBeLessThan(2_000);
    expect(results.length).toBeGreaterThan(0);
    expect(order).toHaveLength(5_000);
    expect(new Set(order.map(({ id }) => id)).size).toBe(5_000);
    expect(JSON.stringify(quotes).length).toBeLessThan(8_000_000);
  });
});
