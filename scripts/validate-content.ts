import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import catalogJSON from "../src/data/catalog.json";
import catalogV3JSON from "../src/data/catalog.v3.json";
import { quoteCatalogSchema, quoteCatalogV3Schema } from "../src/domain/catalog";
import { editorialLedgerSchema } from "../src/domain/editorial";
import { taxonomySchema } from "../src/domain/taxonomy";
import {
  findNearDuplicatePairs,
  generateCatalogV3,
  isExactExcerpt,
  normalizeQuoteText,
  projectCatalogV2,
  publishabilityIssues,
  sourceURLIssues
} from "../src/lib/editorial";
import { loadSources } from "../src/lib/source-inventory";

const ledgerPath = resolve(process.env.EDITORIAL_LEDGER_PATH ?? "content/editorial-ledger.json");
const ledger = editorialLedgerSchema.parse(JSON.parse(await readFile(ledgerPath, "utf8")));
const catalog = quoteCatalogSchema.parse(catalogJSON);
const catalogV3 = quoteCatalogV3Schema.parse(catalogV3JSON);
const taxonomy = taxonomySchema.parse(JSON.parse(await readFile(resolve("content/taxonomy.json"), "utf8")));
const sources = await loadSources();
const errors: string[] = [];
const ids = new Set<string>();
const normalizedText = new Set<string>();

for (const quote of catalog.quotes) {
  if (ids.has(quote.id)) errors.push(`Duplicate quote id: ${quote.id}`);
  ids.add(quote.id);
  const textKey = normalizeQuoteText(quote.text);
  if (normalizedText.has(textKey)) errors.push(`Duplicate quote text: ${quote.text}`);
  normalizedText.add(textKey);
  if (!quote.verified) errors.push(`Public quote ${quote.id} is not verified`);
  if (!quote.sourceTitle || !quote.sourceURL || !quote.sourceDate) errors.push(`Public quote ${quote.id} is missing source metadata`);
  if (quote.sourceURL) errors.push(...sourceURLIssues({ sourceURL: quote.sourceURL, sourceLocator: quote.sourceLocator, sourceType: quote.sourceType }).map((issue) => `${quote.id}: ${issue}`));
  if (quote.shortVersion && !isExactExcerpt(quote.text, quote.shortVersion)) errors.push(`${quote.id}: shortVersion is not an exact excerpt`);
  if (quote.shareCardVersion && !isExactExcerpt(quote.text, quote.shareCardVersion)) errors.push(`${quote.id}: shareCardVersion is not an exact excerpt`);
}

for (const collection of catalog.collections) {
  for (const quoteID of collection.quoteIDs) {
    if (!ids.has(quoteID)) errors.push(`Collection ${collection.slug} references missing quote ${quoteID}`);
  }
}

const verifiedRecords = ledger.records.filter(({ status }) => status === "verified");
for (const record of verifiedRecords) {
  errors.push(...publishabilityIssues(record).map((issue) => `${record.candidateKey}: ${issue}`));
}
errors.push(...findNearDuplicatePairs(verifiedRecords).map(({ left, right, similarity }) => `Near duplicate (${similarity.toFixed(2)}): ${left} / ${right}`));

try {
  const generatedV3 = generateCatalogV3(ledger, sources, taxonomy, catalog.generatedAt);
  const generatedV2 = projectCatalogV2(generatedV3);
  if (JSON.stringify(generatedV3) !== JSON.stringify(catalogV3)) errors.push("V3 public catalog is stale; run npm run content:compile");
  if (JSON.stringify(generatedV2) !== JSON.stringify(catalog)) errors.push("V2 compatibility projection is stale; run npm run content:compile");
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (process.env.RELEASE_CONTENT_ENFORCEMENT === "true" && catalog.developmentFixture) {
  errors.push("Release catalog cannot be marked as a development fixture");
}

if (errors.length > 0) {
  console.error([...new Set(errors)].join("\n"));
  process.exit(1);
}

console.log(`Catalog valid: ${catalog.quotes.length} verified quotes, ${catalog.collections.length} curated collections`);
