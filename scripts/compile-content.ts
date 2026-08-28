import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { editorialLedgerSchema, editorialShardSchema, type EditorialRecord } from "../src/domain/editorial";
import { taxonomySchema } from "../src/domain/taxonomy";
import { collectionSchema } from "../src/domain/catalog";
import { listJSONFiles, readJSON } from "../src/lib/content-files";
import { loadSources } from "../src/lib/source-inventory";
import { generateCatalogV3, projectCatalogV2 } from "../src/lib/editorial";
import { productContentContext } from "./product-context";

const context = productContentContext();
const shardFiles = await listJSONFiles(join(context.contentRoot, "editorial"));
if (shardFiles.length === 0) throw new Error(`No editorial shards found for ${context.product}`);
const shards = await Promise.all(shardFiles.map(async (file) => editorialShardSchema.parse(await readJSON<unknown>(file))));
const records = shards.flatMap((shard) => shard.records).sort((left, right) => left.candidateKey.localeCompare(right.candidateKey));
const duplicateKeys = records.filter((record, index) => records.findIndex((other) => other.candidateKey === record.candidateKey) !== index).map((record) => record.candidateKey);
if (duplicateKeys.length > 0) throw new Error(`Duplicate candidate keys across editorial shards: ${[...new Set(duplicateKeys)].join(", ")}`);

const collections = collectionSchema.array().parse(await readJSON<unknown>(join(context.contentRoot, "collections.json")));
const taxonomy = taxonomySchema.parse(await readJSON<unknown>(context.taxonomyPath));
const sources = await loadSources(context.sourceRoot);
const timestamps = [...shards.map((shard) => shard.updatedAt), ...sources.map((source) => source.retrievedAt)].sort();
const generatedAt = timestamps.at(-1) ?? new Date(0).toISOString();
const ledger = editorialLedgerSchema.parse({ schemaVersion: 1, updatedAt: generatedAt, records: records as EditorialRecord[], collections });
const v3 = generateCatalogV3(ledger, sources, taxonomy, generatedAt, context.author);
const v2 = projectCatalogV2(v3);

await Promise.all([
  writeFile(context.ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8"),
  writeFile(context.catalogV3Path, `${JSON.stringify(v3, null, 2)}\n`, "utf8"),
  writeFile(context.catalogV2Path, `${JSON.stringify(v2, null, 2)}\n`, "utf8")
]);
console.log(`Compiled ${context.product}: ${records.length} editorial records, ${sources.length} sources, and ${v3.quotes.length} published quotes`);
