import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { z } from "zod";
import { candidateShardSchema, editorialShardSchema, qualityScoreSchema, verificationPassSchema, type EditorialRecord } from "../src/domain/editorial";
import { catalogCategorySchema, tagSlugSchema, taxonomySchema } from "../src/domain/taxonomy";
import { CONTENT_ROOT, listJSONFiles, readJSON, writeJSONIfChanged } from "../src/lib/content-files";
import { loadSources } from "../src/lib/source-inventory";
import { publishabilityIssues } from "../src/lib/editorial";

const input = resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("Usage: npm run content:review:apply -- path/to/completed-review.json");

const completedSchema = z.object({
  packetID: z.string().min(1),
  stage: z.enum(["first", "second", "blind"]),
  entries: z.array(z.object({
    candidateKey: z.string().min(1),
    outcome: z.enum(["passed", "failed"]),
    reviewer: z.string().trim().min(1),
    checkedAt: z.string().datetime({ offset: true }),
    exactText: z.string().trim().min(3).max(420),
    evidenceNote: z.string().trim().min(12),
    checks: z.object({
      sourceReopened: z.literal(true),
      surroundingContextReviewed: z.literal(true),
      wordingConfirmed: z.literal(true),
      attributionConfirmed: z.literal(true),
      locatorConfirmed: z.literal(true),
      metadataConfirmed: z.literal(true),
      contextuallyHonest: z.literal(true),
      notStitchedOrParaphrased: z.literal(true)
    }),
    primaryCategory: catalogCategorySchema.optional(),
    tags: z.array(tagSlugSchema).min(2).max(5).optional(),
    context: z.string().trim().min(1).optional(),
    quality: qualityScoreSchema.optional(),
    featured: z.boolean().optional(),
    containsProfanity: z.boolean().optional(),
    duplicateDecision: z.enum(["unique", "keep", "reject"]).optional(),
    duplicateNote: z.string().trim().min(8).optional(),
    rejectionReason: z.string().trim().min(3).nullable().default(null)
  }))
});

const completed = completedSchema.parse(await readJSON<unknown>(input));
const sources = await loadSources();
const sourceByID = new Map(sources.map((source) => [source.sourceID, source]));
const taxonomy = taxonomySchema.parse(await readJSON<unknown>(join(CONTENT_ROOT, "taxonomy.json")));
const validTags = new Set(taxonomy.tags.map((tag) => tag.slug));
const editorialFiles = await listJSONFiles(join(CONTENT_ROOT, "editorial"));
const editorialShards = await Promise.all(editorialFiles.map(async (file) => ({ file, shard: editorialShardSchema.parse(await readJSON<unknown>(file)) })));
const candidateFiles = await listJSONFiles(join(CONTENT_ROOT, "candidates"));
const candidateShards = await Promise.all(candidateFiles.map(async (file) => ({ file, shard: candidateShardSchema.parse(await readJSON<unknown>(file)) })));
const records = new Map(editorialShards.flatMap(({ shard }) => shard.records).map((record) => [record.candidateKey, record]));
const candidates = new Map(candidateShards.flatMap(({ shard }) => shard.candidates).map((candidate) => [candidate.candidateKey, candidate]));

function verification(entry: z.infer<typeof completedSchema>["entries"][number], method: "direct-media-listen" | "direct-web-read" | "direct-book-read") {
  return verificationPassSchema.parse({
    outcome: entry.outcome,
    checkedAt: entry.checkedAt,
    reviewer: entry.reviewer,
    method,
    isolatedReview: true,
    sourceReopened: true,
    surroundingContextReviewed: true,
    surroundingContextSeconds: method === "direct-media-listen" ? 30 : null,
    wordingConfirmed: true,
    attributionConfirmed: true,
    locatorConfirmed: true,
    metadataConfirmed: true,
    contextuallyHonest: true,
    notStitchedOrParaphrased: true,
    evidenceNote: entry.evidenceNote
  });
}

const updatedRecords = new Map(records);
const updatedCandidates = new Map(candidates);
for (const entry of completed.entries) {
  const existing = records.get(entry.candidateKey);
  const candidate = candidates.get(entry.candidateKey);
  const sourceID = existing?.sourceID ?? candidate?.sourceID;
  const source = sourceID ? sourceByID.get(sourceID) : null;
  if (!source) throw new Error(`${entry.candidateKey}: source not found`);
  if (!source.publishedAt) throw new Error(`${entry.candidateKey}: source publication date is unresolved`);
  const method = source.sourceType === "podcast" || source.sourceType === "video" ? "direct-media-listen" : source.sourceType === "book" ? "direct-book-read" : "direct-web-read";
  const pass = verification(entry, method);

  if (entry.outcome === "failed") {
    if (candidate) updatedCandidates.set(entry.candidateKey, { ...candidate, status: "rejected", rejectionReason: entry.rejectionReason ?? entry.evidenceNote });
    if (existing) updatedRecords.set(entry.candidateKey, { ...existing, status: "rejected", featured: false, rejectionNotes: [...existing.rejectionNotes, entry.rejectionReason ?? entry.evidenceNote], updatedAt: entry.checkedAt });
    continue;
  }

  if (completed.stage === "first") {
    if (!candidate) throw new Error(`${entry.candidateKey}: first review requires a mined candidate`);
    if (!entry.primaryCategory || !entry.tags || !entry.context || !entry.quality || entry.featured === undefined || entry.containsProfanity === undefined || !entry.duplicateDecision || !entry.duplicateNote) throw new Error(`${entry.candidateKey}: first review is missing editorial fields`);
    for (const tag of entry.tags) if (!validTags.has(tag)) throw new Error(`${entry.candidateKey}: unknown tag ${tag}`);
    const sourceURL = source.mediaURL ? `${source.mediaURL}#t=${Math.floor(candidate.startSeconds)}` : source.canonicalURL;
    const record: EditorialRecord = {
      candidateKey: candidate.candidateKey,
      status: "in_review",
      text: entry.exactText,
      author: "Alex Hormozi",
      primaryCategory: entry.primaryCategory,
      tags: entry.tags,
      sourceID: source.sourceID,
      sourceType: source.sourceType,
      sourceTitle: source.title,
      sourceURL,
      sourceDate: source.publishedAt,
      sourceLocator: { kind: "media", startSeconds: Math.floor(candidate.startSeconds), endSeconds: Math.ceil(candidate.endSeconds) },
      featured: entry.featured,
      containsProfanity: entry.containsProfanity,
      context: entry.context,
      provenance: { transcriptFingerprint: candidate.transcriptFingerprint, cueStart: candidate.cueStart, cueEnd: candidate.cueEnd, batchID: completed.packetID.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), duplicateDecision: entry.duplicateDecision, duplicateNote: entry.duplicateNote },
      createdAt: entry.checkedAt,
      updatedAt: entry.checkedAt,
      verification: { firstPass: pass, secondPass: null, blindAudit: null },
      quality: entry.quality,
      rejectionNotes: [],
      unresolvedWarnings: []
    };
    updatedRecords.set(entry.candidateKey, record);
    updatedCandidates.set(entry.candidateKey, { ...candidate, status: "in_review" });
  } else {
    if (!existing) throw new Error(`${entry.candidateKey}: ${completed.stage} review requires an editorial record`);
    if (entry.exactText !== existing.text) throw new Error(`${entry.candidateKey}: later review found different text; quarantine and return the record to in_review`);
    const next: EditorialRecord = completed.stage === "second"
      ? { ...existing, id: existing.id ?? randomUUID(), status: "verified", updatedAt: entry.checkedAt, verification: { ...existing.verification, secondPass: pass } }
      : { ...existing, updatedAt: entry.checkedAt, verification: { ...existing.verification, blindAudit: pass } };
    const issues = publishabilityIssues(next);
    if (issues.length > 0) throw new Error(`${entry.candidateKey}: ${issues.join("; ")}`);
    updatedRecords.set(entry.candidateKey, next);
    if (candidate) updatedCandidates.set(entry.candidateKey, { ...candidate, status: "accepted" });
  }
}

const now = new Date().toISOString();
const groupedRecords = Map.groupBy([...updatedRecords.values()], (record) => {
  const source = sourceByID.get(record.sourceID)!;
  return `${source.provider}/${source.publishedAt!.slice(0, 4)}`;
});
for (const [key, shardRecords] of groupedRecords) {
  const [provider, yearText] = key.split("/");
  await writeJSONIfChanged(join(CONTENT_ROOT, "editorial", provider, `${yearText}.json`), editorialShardSchema.parse({ schemaVersion: 1, provider, year: Number(yearText), updatedAt: now, records: shardRecords.sort((left, right) => left.candidateKey.localeCompare(right.candidateKey)) }));
}
for (const { file, shard } of candidateShards) {
  const next = shard.candidates.map((candidate) => updatedCandidates.get(candidate.candidateKey) ?? candidate);
  await writeJSONIfChanged(file, candidateShardSchema.parse({ ...shard, updatedAt: now, candidates: next }));
}
console.log(`Applied ${completed.entries.length} ${completed.stage}-review decisions from ${input}`);
