import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { editorialLedgerSchema } from "../src/domain/editorial";

const input = process.argv[2];
const output = process.argv[3] ?? "content/editorial-ledger.import.json";
if (!input) throw new Error("Usage: npm run content:import -- <editorial-ledger.json|candidates.csv> [output.json]");

const inputPath = resolve(input);
const text = await readFile(inputPath, "utf8");
let candidate: unknown;

if (inputPath.endsWith(".json")) {
  candidate = JSON.parse(text);
} else if (inputPath.endsWith(".csv")) {
  const now = new Date().toISOString();
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const records = rows.map((row) => ({
    candidateKey: row.candidate_key,
    status: "candidate",
    text: row.quote_text,
    author: row.author || "Alex Hormozi",
    primaryCategory: row.primary_category,
    tags: row.tags.split("|").filter(Boolean),
    sourceType: row.source_type,
    sourceTitle: row.source_title,
    sourceURL: row.source_url,
    sourceDate: row.source_date,
    sourceLocator: row.locator_kind === "media"
      ? { kind: "media", startSeconds: Number(row.start_seconds), ...(row.end_seconds ? { endSeconds: Number(row.end_seconds) } : {}) }
      : row.locator_kind === "book"
        ? { kind: "book", edition: row.edition, publisher: row.publisher, publicationYear: Number(row.publication_year), ...(row.isbn ? { isbn: row.isbn } : {}), chapter: row.chapter, ...(row.page ? { page: Number(row.page) } : {}), ...(row.digital_location ? { digitalLocation: row.digital_location } : {}) }
        : { kind: "web", ...(row.section ? { section: row.section } : {}), ...(row.post_id ? { postID: row.post_id } : {}) },
    featured: false,
    containsProfanity: row.contains_profanity === "true",
    context: row.context,
    createdAt: now,
    updatedAt: now,
    verification: { firstPass: null, secondPass: null, blindAudit: null },
    quality: null,
    rejectionNotes: [],
    unresolvedWarnings: []
  }));
  candidate = { schemaVersion: 1, updatedAt: now, records, collections: [] };
} else {
  throw new Error("Input must be JSON or CSV");
}

const ledger = editorialLedgerSchema.parse(candidate);
await writeFile(resolve(output), `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
console.log(`Validated and imported ${ledger.records.length} editorial records to ${output}`);
