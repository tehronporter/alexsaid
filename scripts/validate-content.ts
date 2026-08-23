import catalogJSON from "../src/data/catalog.json";
import { quoteCatalogSchema } from "../src/domain/catalog";

const catalog = quoteCatalogSchema.parse(catalogJSON);
const errors: string[] = [];
const ids = new Set<string>();
const normalizedText = new Set<string>();

for (const quote of catalog.quotes) {
  if (ids.has(quote.id)) errors.push(`Duplicate quote id: ${quote.id}`);
  ids.add(quote.id);
  const textKey = quote.text.toLocaleLowerCase().replace(/\s+/g, " ").trim();
  if (normalizedText.has(textKey)) errors.push(`Duplicate quote text: ${quote.text}`);
  normalizedText.add(textKey);
  if (quote.verified && (!quote.sourceTitle || !quote.sourceURL || !quote.sourceDate)) {
    errors.push(`Verified quote ${quote.id} is missing source title, URL, or date`);
  }
}

for (const collection of catalog.collections) {
  for (const quoteID of collection.quoteIDs) {
    if (!ids.has(quoteID)) errors.push(`Collection ${collection.slug} references missing quote ${quoteID}`);
  }
}

if (process.env.RELEASE_CONTENT_ENFORCEMENT === "true") {
  if (catalog.developmentFixture) errors.push("Release catalog cannot be marked as a development fixture");
  if (catalog.quotes.length < 500) errors.push(`Release catalog requires 500 quotes; found ${catalog.quotes.length}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Catalog valid: ${catalog.quotes.length} quotes, ${catalog.collections.length} collections`);
