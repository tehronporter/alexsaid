import { describe, expect, it } from "vitest";
import { catalog, catalogV3, quoteRepository, quotesForCollection } from "@/lib/catalog";
import { quoteCatalogSchema, quoteCatalogV3Schema } from "@/domain/catalog";
import { projectCatalogV2 } from "@/lib/editorial";
import taxonomyJSON from "../content/taxonomy.json";

describe("quote catalog", () => {
  it("matches the public contract and uses stable unique IDs", () => {
    expect(() => quoteCatalogSchema.parse(catalog)).not.toThrow();
    expect(new Set(catalog.quotes.map(({ id }) => id)).size).toBe(catalog.quotes.length);
  });

  it("validates normalized v3 and projects exactly to v2", () => {
    expect(() => quoteCatalogV3Schema.parse(catalogV3)).not.toThrow();
    expect(projectCatalogV2(catalogV3)).toEqual(catalog);
    expect(new Set(catalogV3.sources.map(({ sourceID }) => sourceID)).size).toBe(catalogV3.sources.length);
  });

  it("uses only controlled categories and defined tag slugs", () => {
    const tags = new Set(taxonomyJSON.tags.map(({ slug }) => slug));
    expect(catalog.categories).toEqual(taxonomyJSON.categories);
    for (const quote of catalog.quotes) {
      expect(quote.tags.length).toBeGreaterThanOrEqual(2);
      expect(quote.tags.length).toBeLessThanOrEqual(5);
      expect(quote.tags.every((tag) => tags.has(tag))).toBe(true);
    }
  });

  it("resolves every curated collection without missing quotes", () => {
    for (const collection of catalog.collections) {
      expect(quotesForCollection(collection)).toHaveLength(collection.quoteIDs.length);
    }
  });

  it("ranks exact topic and tag matches in search", () => {
    const target = catalog.quotes[0];
    const query = target.tags[0];
    const results = quoteRepository.search(query);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.tags.includes(query)).toBe(true);
  });
});
