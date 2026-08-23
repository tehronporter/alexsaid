import { describe, expect, it } from "vitest";
import { catalog, quoteRepository, quotesForCollection } from "@/lib/catalog";
import { quoteCatalogSchema } from "@/domain/catalog";

describe("quote catalog", () => {
  it("matches the public contract and uses stable unique IDs", () => {
    expect(() => quoteCatalogSchema.parse(catalog)).not.toThrow();
    expect(new Set(catalog.quotes.map(({ id }) => id)).size).toBe(catalog.quotes.length);
  });

  it("resolves every curated collection without missing quotes", () => {
    for (const collection of catalog.collections) {
      expect(quotesForCollection(collection)).toHaveLength(collection.quoteIDs.length);
    }
  });

  it("ranks exact topic and tag matches in search", () => {
    const results = quoteRepository.search("sales");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.primaryCategory === "Sales" || results[0]?.tags.includes("sales")).toBe(true);
  });
});
