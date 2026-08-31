import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

type Brand = "alex" | "leila";
type Row = Record<string, string>;

const audit = JSON.parse(await readFile("content/quality-audits/full-catalog-2026-08-30.json", "utf8"));
const exportTime = "2026-08-30T17:03:00.000Z";
const columns = [
  "sequence", "filename", "quote_id", "quote", "author", "category",
  "production_catalog_generated_at", "exported_at", "sha256", "bytes", "width", "height"
];

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function build(brand: Brand) {
  const catalogPath = brand === "alex" ? "src/data/catalog.v3.json" : "src/data/leila/catalog.v3.json";
  const originalIndex = brand === "alex" ? "/tmp/qc-index-alex-original.csv" : "/tmp/qc-index-leila-original.csv";
  const outputIndex = brand === "alex" ? "/tmp/qc-index-alex-updated.csv" : "/tmp/qc-index-leila-updated.csv";
  const prefix = brand === "alex" ? "hormozi-said" : "leila-said";
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const quoteByID = new Map(catalog.quotes.map((quote: { id: string }) => [quote.id, quote]));
  const originalRows = parse(await readFile(originalIndex, "utf8"), { columns: true, skip_empty_lines: true }) as Row[];
  const brandRecords = audit.records.filter((record: { brand: Brand }) => record.brand === brand);
  const removeIDs = new Set(brandRecords.filter((record: { decision: string; driveAsset: unknown }) => record.decision !== "keep" && record.driveAsset).map((record: { quoteID: string }) => record.quoteID));
  const rows = originalRows.filter((row) => !removeIDs.has(row.quote_id));

  for (const record of brandRecords.filter((item: { decision: string }) => item.decision === "rescue")) {
    const id = record.replacement.quoteID as string;
    const quote = quoteByID.get(id) as { id: string; text: string; author: string; primaryCategory: string } | undefined;
    if (!quote) throw new Error(`Missing ${brand} replacement ${id} from the live catalog`);
    const filename = `${prefix}-${id}-story.png`;
    const path = `/tmp/quote-qc-cards/${brand}/${filename}`;
    const bytes = await readFile(path);
    const info = await stat(path);
    rows.push({
      sequence: "",
      filename,
      quote_id: id,
      quote: quote.text,
      author: quote.author,
      category: quote.primaryCategory,
      production_catalog_generated_at: catalog.generatedAt,
      exported_at: exportTime,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: String(info.size),
      width: "1080",
      height: "1920"
    });
  }

  rows.forEach((row, index) => { row.sequence = String(index + 1); });
  const csv = [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n";
  await writeFile(outputIndex, csv);
  console.log(JSON.stringify({ brand, original: originalRows.length, removed: removeIDs.size, added: brandRecords.filter((item: { decision: string }) => item.decision === "rescue").length, final: rows.length, outputIndex }));
}

await build("alex");
await build("leila");
