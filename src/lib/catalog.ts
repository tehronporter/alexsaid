import rawCatalog from "@/data/catalog.json";
import {
  quoteCatalogSchema,
  type Collection,
  type Quote,
  type QuoteCatalogV2,
  type QuoteRepository
} from "@/domain/catalog";
import { rankQuotes } from "@/lib/search";

export const catalog: QuoteCatalogV2 = quoteCatalogSchema.parse(rawCatalog);

const quoteByID = new Map(catalog.quotes.map((quote) => [quote.id, quote]));
const collectionBySlug = new Map(catalog.collections.map((collection) => [collection.slug, collection]));

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
}

export class LocalQuoteRepository implements QuoteRepository {
  getAll(): readonly Quote[] {
    return catalog.quotes;
  }

  getById(id: string): Quote | undefined {
    return quoteByID.get(id);
  }

  search(query: string): readonly Quote[] {
    return rankQuotes(catalog.quotes, query);
  }

  getByCategory(category: string): readonly Quote[] {
    return catalog.quotes.filter((quote) => normalize(quote.primaryCategory) === normalize(category));
  }

  getCollection(slug: string): Collection | undefined {
    return collectionBySlug.get(slug);
  }
}

export const quoteRepository = new LocalQuoteRepository();

export function quotesForCollection(collection: Collection) {
  return collection.quoteIDs.flatMap((id) => {
    const quote = quoteByID.get(id);
    return quote ? [quote] : [];
  });
}

export function formatTimestamp(seconds: number | null) {
  if (seconds === null) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder]
    .map((value, index) => (index === 0 ? String(value).padStart(2, "0") : String(value).padStart(2, "0")))
    .join(":");
}
