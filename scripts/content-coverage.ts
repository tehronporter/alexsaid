import { join, resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { candidateShardSchema, editorialLedgerSchema } from "../src/domain/editorial";
import { CONTENT_ROOT, listJSONFiles, readJSON } from "../src/lib/content-files";
import { loadSources } from "../src/lib/source-inventory";

const sources = await loadSources();
const ledger = editorialLedgerSchema.parse(await readJSON<unknown>(resolve("content/editorial-ledger.json")));
const candidateFiles = await listJSONFiles(join(CONTENT_ROOT, "candidates"));
const candidateShards = await Promise.all(candidateFiles.map(async (file) => candidateShardSchema.parse(await readJSON<unknown>(file))));
const candidates = candidateShards.flatMap((shard) => shard.candidates);
const countBy = <T>(values: readonly T[], key: (value: T) => string) => Object.fromEntries([...Map.groupBy(values, key)].map(([name, items]) => [name, items.length]).sort());
const nonterminalSourceStatuses = new Set(["discovered", "ready", "mined"]);
const nonterminalCandidateStatuses = new Set(["candidate", "in_review"]);
const report = {
  generatedAt: new Date().toISOString(),
  sources: {
    total: sources.length,
    byProvider: countBy(sources, (source) => source.provider),
    byStatus: countBy(sources, (source) => source.status),
    terminal: sources.filter((source) => !nonterminalSourceStatuses.has(source.status)).length,
    unresolvedCount: sources.filter((source) => nonterminalSourceStatuses.has(source.status)).length,
    unresolvedSample: sources.filter((source) => nonterminalSourceStatuses.has(source.status)).slice(0, 20).map((source) => source.sourceID)
  },
  candidates: {
    total: candidates.length,
    byStatus: countBy(candidates, (candidate) => candidate.status),
    unresolved: candidates.filter((candidate) => nonterminalCandidateStatuses.has(candidate.status)).length
  },
  editorial: {
    total: ledger.records.length,
    byStatus: countBy(ledger.records, (record) => record.status),
    publishedByVerificationStandard: countBy(ledger.records.filter((record) => record.status === "verified"), (record) => record.verificationStandard),
    published: ledger.records.filter((record) => record.status === "verified").length,
    rejected: ledger.records.filter((record) => record.status === "rejected").length,
    unresolvedWarnings: ledger.records.filter((record) => record.unresolvedWarnings.length > 0).length
  },
  complete: sources.every((source) => !nonterminalSourceStatuses.has(source.status))
    && candidates.every((candidate) => !nonterminalCandidateStatuses.has(candidate.status))
    && ledger.records.every((record) => !["candidate", "in_review"].includes(record.status))
    && ledger.records.every((record) => record.unresolvedWarnings.length === 0)
};
await writeFile(resolve("content/coverage.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
