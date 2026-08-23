import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { quoteCatalogSchema } from "../src/domain/catalog";

const input = process.argv[2];
const output = process.argv[3] ?? "src/data/catalog.json";
if (!input) throw new Error("Usage: npm run content:import -- <catalog.json|quotes.csv> [output.json]");

const inputPath = resolve(input);
const text = await readFile(inputPath, "utf8");
let candidate: unknown;

if (inputPath.endsWith(".json")) {
  candidate = JSON.parse(text);
} else if (inputPath.endsWith(".csv")) {
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const quotes = rows.map((row) => ({
    id: row.quote_id,
    text: row.quote_text,
    author: row.author,
    primaryCategory: row.primary_category,
    tags: row.tags.split("|").filter(Boolean),
    sourceType: row.source_type,
    sourceTitle: row.source_title || null,
    sourceURL: row.source_url || null,
    sourceDate: row.source_date || null,
    sourceTimestampSeconds: row.source_timestamp_seconds ? Number(row.source_timestamp_seconds) : null,
    verified: row.verified === "true",
    featured: row.featured === "true",
    containsProfanity: row.contains_profanity === "true",
    context: row.context || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.short_version ? { shortVersion: row.short_version } : {}),
    ...(row.share_card_version ? { shareCardVersion: row.share_card_version } : {})
  }));
  candidate = { schemaVersion: 1, generatedAt: new Date().toISOString(), developmentFixture: false, categories: [...new Set(quotes.map((quote: { primaryCategory: string }) => quote.primaryCategory))], collections: [], quotes };
} else throw new Error("Input must be JSON or CSV");

const catalog = quoteCatalogSchema.parse(candidate);
await writeFile(resolve(output), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Imported ${catalog.quotes.length} quotes to ${output}`);
