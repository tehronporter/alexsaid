import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { editorialLedgerSchema, candidateShardSchema } from "../src/domain/editorial";
import { CACHE_ROOT, CONTENT_ROOT, listJSONFiles, readJSON, writeJSONIfChanged } from "../src/lib/content-files";
import { loadSources } from "../src/lib/source-inventory";

const stage = process.argv.find((arg) => arg.startsWith("--stage="))?.split("=")[1] ?? "first";
if (!["first", "second", "blind"].includes(stage)) throw new Error("--stage must be first, second, or blind");
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 25);
const requestedSourceID = process.argv.find((arg) => arg.startsWith("--source="))?.split("=")[1] ?? null;
const sourceByID = new Map((await loadSources()).map((source) => [source.sourceID, source]));
const ledger = editorialLedgerSchema.parse(await readJSON<unknown>(join(CONTENT_ROOT, "editorial-ledger.json")));
const candidateFiles = await listJSONFiles(join(CONTENT_ROOT, "candidates"));
const candidateShards = await Promise.all(candidateFiles.map(async (file) => candidateShardSchema.parse(await readJSON<unknown>(file))));
const candidates = candidateShards.flatMap((shard) => shard.candidates);
const scopedCandidates = requestedSourceID ? candidates.filter((candidate) => candidate.sourceID === requestedSourceID) : candidates;
const scopedRecords = requestedSourceID ? ledger.records.filter((record) => record.sourceID === requestedSourceID) : ledger.records;

const entries = stage === "first"
  ? scopedCandidates.filter((candidate) => candidate.status === "candidate").slice(0, limit).map((candidate) => {
      const source = sourceByID.get(candidate.sourceID)!;
      return { candidateKey: candidate.candidateKey, sourceID: candidate.sourceID, candidateText: candidate.text, sourceTitle: source.title, sourceURL: source.canonicalURL, mediaURL: source.mediaURL, transcriptURL: source.transcriptURL, transcriptFingerprint: candidate.transcriptFingerprint, cueStart: candidate.cueStart, cueEnd: candidate.cueEnd, startSeconds: candidate.startSeconds, endSeconds: candidate.endSeconds, reviewWindow: { startSeconds: Math.max(0, candidate.startSeconds - 30), endSeconds: candidate.endSeconds + 30 } };
    })
  : scopedRecords.filter((record) => stage === "second" ? record.status === "in_review" && record.verification.firstPass && !record.verification.secondPass : record.status === "verified" && !record.verification.blindAudit).slice(0, limit).map((record) => {
      const source = sourceByID.get(record.sourceID)!;
      const startSeconds = record.sourceLocator.kind === "media" ? record.sourceLocator.startSeconds : null;
      const endSeconds = record.sourceLocator.kind === "media" ? record.sourceLocator.endSeconds ?? record.sourceLocator.startSeconds : null;
      return { candidateKey: record.candidateKey, sourceID: record.sourceID, candidateText: record.text, sourceTitle: source.title, sourceURL: source.canonicalURL, mediaURL: source.mediaURL, transcriptURL: source.transcriptURL, transcriptFingerprint: record.provenance.transcriptFingerprint, cueStart: record.provenance.cueStart, cueEnd: record.provenance.cueEnd, startSeconds, endSeconds, reviewWindow: startSeconds === null || endSeconds === null ? null : { startSeconds: Math.max(0, startSeconds - 30), endSeconds: endSeconds + 30 } };
    });

const packetID = `review-${stage}-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
const packet = { packetVersion: 1, packetID, stage, isolated: true, generatedAt: new Date().toISOString(), instructions: "Reopen the direct source independently. For media, listen to the full review window. Confirm Alex is the speaker, the excerpt is contiguous, and every word and metadata field is exact. Do not consult earlier review notes.", entries };
const path = join(CACHE_ROOT, "review-packets", `${packetID}.json`);
await writeJSONIfChanged(path, packet);
console.log(`Wrote ${entries.length} ${stage}-review entries to ${path}`);
