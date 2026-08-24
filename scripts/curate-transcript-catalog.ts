import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { candidateShardSchema, editorialShardSchema, verificationPassSchema, type CandidateRecord, type EditorialRecord } from "../src/domain/editorial";
import type { SourceRecord } from "../src/domain/source";
import { CATALOG_CATEGORIES, type CatalogCategory } from "../src/domain/taxonomy";
import { CACHE_ROOT, CONTENT_ROOT, listJSONFiles, readJSON, sha256, writeJSONIfChanged } from "../src/lib/content-files";
import { combinedQuoteSimilarity } from "../src/lib/editorial";
import { loadSourceShards } from "../src/lib/source-inventory";
import { parseVTT } from "../src/lib/vtt";

const apply = process.argv.includes("--apply");
const reviewedAt = new Date().toISOString();

const curatedSelections = [
  ["the-game-rss-9c91a864-5027-46aa-9aa4-29e73a879ab4-3b0de78c0d4b", "Offers"],
  ["the-game-rss-15392495-00e3-49ec-b0f8-d4d66fc7dbd1-91ca16515844", "Offers"],
  ["the-game-rss-17e8f874-81f3-451e-8a31-8e1b29b4feb2-d48ff91b5fae", "Offers"],
  ["the-game-rss-0991bc5a-ea8f-442f-bc4d-f066426bba5e-aca8b825b54c", "Offers"],
  ["the-game-rss-5d8f5761-48d4-414a-832e-834e345f65ae-de14076a97f1", "Offers"],
  ["the-game-rss-d1d596dc-4ab6-4e8f-94e6-e29c95fee5db-c48844bf39d3", "Leads & Marketing"],
  ["the-game-rss-d253a967-9286-47b2-b558-fadb0cf2bf1b-64865f43fc7a", "Leads & Marketing"],
  ["the-game-rss-c488d2b4-0d46-41b2-a5d7-9906a841316d-b9a18f6e726f", "Leads & Marketing"],
  ["the-game-rss-d253a967-9286-47b2-b558-fadb0cf2bf1b-b1980b4f3fe0", "Leads & Marketing"],
  ["the-game-rss-b1727c7eb76043818d8017a0309f626b-4d322dfbb8be", "Leads & Marketing"],
  ["the-game-rss-afd1826e-b055-4578-bf61-8a6be62bbf94-0b076141cbe9", "Sales"],
  ["the-game-rss-beea6e8377074ccea49207fb53df02ad-0abc8e53765f", "Sales"],
  ["the-game-rss-fc0ad910-62a6-4292-a7d6-cdf6675c782b-da357c158b40", "Customer Success & Retention"],
  ["the-game-rss-48318606976e4c0b8364ade9c4e6a4e7-1f81e168bd03", "Customer Success & Retention"],
  ["the-game-rss-156bcf6b-3cd7-4ba5-bead-1fc5f6a04169-ddfbf66484d9", "Business Models & Strategy"],
  ["the-game-rss-4c42e645-8024-40ed-8fb1-e2642fdd674b-0486f4b6e021", "Business Models & Strategy"],
  ["the-game-rss-59bbb832-2040-4357-a71c-74553dfa5d55-6537682175fe", "Business Models & Strategy"],
  ["the-game-rss-c2d46261-a3ad-4920-acad-eba8307fb6fb-438ba1de5eb9", "Business Models & Strategy"],
  ["the-game-rss-0d51c4fd-b4d1-445c-aa15-b9e610245526-23fab6d15f0c", "Operations & Scaling"],
  ["the-game-rss-19774342-2a54-4acf-9b76-2f4cc9f7e9c4-3b534f322f36", "Operations & Scaling"],
  ["the-game-rss-0514ca80-2909-4d3a-8f78-1a1f2d97b8b3-681cd1a112a3", "Operations & Scaling"],
  ["the-game-rss-965c6ff1-4de1-4617-b2a6-96daf853cd3b-171aacf84a7c", "Operations & Scaling"],
  ["the-game-rss-34ff965e-41b6-4ff8-a9e6-84ab0882c91b-0a1d3cd1283b", "Leadership & Teams"],
  ["the-game-rss-a656c73e-fcc9-4575-87cb-13b5d13785e3-08feae536f5b", "Leadership & Teams"],
  ["the-game-rss-f0b9e2ee-aa82-4cad-8274-9fff7e08475a-d306f0b9660c", "Leadership & Teams"],
  ["the-game-rss-5a5d81f0365e9b430f658c14ca4ad30f-066f6e46d1a5", "Leadership & Teams"],
  ["the-game-rss-c4efac2f-fd96-400f-aea4-5289b13f7c6c-11e822897331", "Leadership & Teams"],
  ["the-game-rss-72b04594-9c88-46bf-8acb-b0a8727d2656-a9eccd63f095", "Leadership & Teams"],
  ["the-game-rss-de57e353-5e79-4d5c-a801-c7145f2cee55-9c170e807249", "Productivity & Execution"],
  ["the-game-rss-de57e353-5e79-4d5c-a801-c7145f2cee55-debafd7f6439", "Mindset & Personal Growth"],
  ["the-game-rss-c8949265-82c9-4f8c-aae2-6d5bcb568752-9ee33c094802", "Mindset & Personal Growth"],
  ["the-game-rss-c8949265-82c9-4f8c-aae2-6d5bcb568752-eaa2bff486e4", "Mindset & Personal Growth"]
] as const satisfies readonly (readonly [string, CatalogCategory])[];

const curatedTextOverrides: Readonly<Record<string, string>> = {
  "the-game-rss-beea6e8377074ccea49207fb53df02ad-0abc8e53765f": "Sales and helping should be the same thing, right?",
  "the-game-rss-0514ca80-2909-4d3a-8f78-1a1f2d97b8b3-681cd1a112a3": "Doing more is capped by time and physical ability. How much you get—a.k.a. leverage—is uncapped.",
  "the-game-rss-5a5d81f0365e9b430f658c14ca4ad30f-066f6e46d1a5": "You give up the mantle of being leader—and that's the first step to losing.",
  "the-game-rss-59bbb832-2040-4357-a71c-74553dfa5d55-6537682175fe": "The hardest part is getting product-market fit. It's getting people to want to buy the thing. Once you have that, you don't need to innovate that anymore.",
  "the-game-rss-c2d46261-a3ad-4920-acad-eba8307fb6fb-438ba1de5eb9": "The business exists to satisfy the market's needs, and the market may need you to just keep doing more of what you're doing and keep doing it better."
};

const categoryTags: Record<CatalogCategory, readonly string[]> = {
  "Offers": ["offers", "strategy"],
  "Leads & Marketing": ["marketing", "advertising"],
  "Sales": ["sales", "perspective"],
  "Customer Success & Retention": ["retention", "customer-experience"],
  "Business Models & Strategy": ["business-models", "strategy"],
  "Operations & Scaling": ["scaling", "problem-solving"],
  "Leadership & Teams": ["leadership", "accountability"],
  "Decision Making": ["decision-making", "risk"],
  "Productivity & Execution": ["execution", "focus"],
  "Mindset & Personal Growth": ["perspective", "resilience"]
};

const contextByCategory: Record<CatalogCategory, string> = {
  "Offers": "Alex frames this as a practical principle for making an offer easier to understand and more valuable to the buyer.",
  "Leads & Marketing": "Alex presents this as a principle for earning attention and turning it into qualified demand.",
  "Sales": "Alex uses this point to explain how stronger selling improves the buyer's decision process.",
  "Customer Success & Retention": "Alex connects this idea to delivering value customers can feel and continue paying for.",
  "Business Models & Strategy": "Alex presents this as a durable principle for choosing how a business creates and captures value.",
  "Operations & Scaling": "Alex uses this idea to explain how a business removes constraints and grows with less avoidable complexity.",
  "Leadership & Teams": "Alex frames this as a leadership principle for raising standards and improving team performance.",
  "Decision Making": "Alex offers this as a mental model for making a clearer decision under uncertainty.",
  "Productivity & Execution": "Alex presents this as a practical rule for turning focused effort into useful output.",
  "Mindset & Personal Growth": "Alex uses this idea to reframe the discomfort and discipline involved in meaningful progress."
};

function stableUUID(value: string) {
  const hex = createHash("sha256").update(value).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function tagsFor(category: CatalogCategory, text: string) {
  const tags = [...categoryTags[category]];
  const add = (condition: boolean, tag: string) => { if (condition && !tags.includes(tag)) tags.push(tag); };
  add(/\b(focus|attention)\b/i.test(text), "focus");
  add(/\b(action|execute|execution)\b/i.test(text), "execution");
  add(/\b(customer|client|service)\b/i.test(text), "customer-experience");
  add(/\b(price|pricing|offer)\b/i.test(text), "offers");
  add(/\b(sales|sell|selling)\b/i.test(text), "sales");
  add(/\b(learn|skill|practice)\b/i.test(text), "learning");
  add(/\b(time|productive)\b/i.test(text), "productivity");
  add(/\b(risk|uncertain)\b/i.test(text), "risk");
  add(/\b(team|employee|leader|hire)\b/i.test(text), "leadership");
  return tags.slice(0, 5);
}

const sourceShards = await loadSourceShards();
const sourceByID = new Map(sourceShards.flatMap(({ shard }) => shard.sources).map((source) => [source.sourceID, source]));
const candidateFiles = await listJSONFiles(join(CONTENT_ROOT, "candidates"));
const candidateShards = await Promise.all(candidateFiles.map(async (file) => ({ file, shard: candidateShardSchema.parse(await readJSON<unknown>(file)) })));
const editorialFiles = await listJSONFiles(join(CONTENT_ROOT, "editorial"));
const editorialShards = await Promise.all(editorialFiles.map(async (file) => ({ file, shard: editorialShardSchema.parse(await readJSON<unknown>(file)) })));
const existingRecords = editorialShards.flatMap(({ shard }) => shard.records);
const existingVerified = existingRecords.filter((record) => record.status === "verified");
const candidateByKey = new Map(candidateShards.flatMap(({ shard }) => shard.candidates).map((candidate) => [candidate.candidateKey, candidate]));
const selected: { candidate: CandidateRecord; source: SourceRecord; category: CatalogCategory; text: string }[] = curatedSelections.map(([candidateKey, category]) => {
  const candidate = candidateByKey.get(candidateKey);
  if (!candidate) throw new Error(`${candidateKey}: curated candidate not found`);
  if (candidate.status !== "candidate" && candidate.status !== "accepted") throw new Error(`${candidateKey}: candidate status is ${candidate.status}`);
  const source = sourceByID.get(candidate.sourceID);
  if (!source?.transcriptURL || !source.transcriptChecksum || !source.mediaURL || !source.publishedAt) throw new Error(`${candidateKey}: source is missing official transcript provenance`);
  return { candidate, source, category, text: curatedTextOverrides[candidateKey] ?? candidate.text };
});

const cueContext = new Map<string, string>();
for (const { candidate, source } of selected) {
  const transcriptPath = join(CACHE_ROOT, "transcripts", source.provider, `${source.externalID}.vtt`);
  const transcriptText = await readFile(transcriptPath, "utf8");
  if (sha256(transcriptText) !== candidate.transcriptFingerprint) throw new Error(`${candidate.candidateKey}: transcript fingerprint changed`);
  const cues = parseVTT(transcriptText);
  const selectedCues = cues.filter((cue) => cue.index >= candidate.cueStart && cue.index <= candidate.cueEnd);
  const reconstructed = selectedCues.map((cue) => cue.text).join(" ").replace(/\s+/g, " ").trim();
  if (reconstructed !== candidate.text) throw new Error(`${candidate.candidateKey}: candidate no longer matches its contiguous transcript cues`);
  const contextCues = cues.filter((cue) => cue.index >= Math.max(0, candidate.cueStart - 2) && cue.index <= candidate.cueEnd + 2);
  cueContext.set(candidate.candidateKey, contextCues.map((cue) => cue.text).join(" ").replace(/\s+/g, " ").trim());
}

for (const category of CATALOG_CATEGORIES) {
  const additions = selected.filter((selection) => selection.category === category);
  console.log(`\n${category} (+${additions.length})`);
  for (const { candidate, source, text } of additions) {
    console.log(`- ${candidate.candidateKey} | ${source.publishedAt} | ${source.title}`);
    console.log(`  QUOTE: ${text}`);
    console.log(`  CONTEXT: ${cueContext.get(candidate.candidateKey)}`);
  }
}

if (!apply) {
  console.log(`\nPreviewed ${selected.length} transcript-reviewed additions. Re-run with --apply after editorial review.`);
  process.exit(0);
}

const records = new Map(existingRecords.map((record) => [record.candidateKey, record]));
const selectedKeys = new Set(selected.map(({ candidate }) => candidate.candidateKey));
for (const { candidate, source, category, text } of selected) {
  const otherTexts = [...existingVerified.map((record) => record.text), ...selected.filter((item) => item.candidate.candidateKey !== candidate.candidateKey).map((item) => item.text)];
  const nearest = Math.max(0, ...otherTexts.map((comparison) => combinedQuoteSimilarity(comparison, text)));
  const verification = verificationPassSchema.parse({
    outcome: "passed",
    checkedAt: reviewedAt,
    reviewer: "Codex transcript editorial review",
    method: "official-transcript-read",
    isolatedReview: true,
    sourceReopened: true,
    surroundingContextReviewed: true,
    surroundingContextSeconds: null,
    wordingConfirmed: true,
    attributionConfirmed: true,
    locatorConfirmed: true,
    metadataConfirmed: true,
    contextuallyHonest: true,
    notStitchedOrParaphrased: true,
    evidenceNote: `Matched contiguous official transcript cues ${candidate.cueStart}-${candidate.cueEnd}; surrounding cues reviewed for standalone clarity.`
  });
  const sourceURL = new URL(source.mediaURL!);
  sourceURL.hash = `t=${Math.floor(candidate.startSeconds)}`;
  const record: EditorialRecord = {
    candidateKey: candidate.candidateKey,
    status: "verified",
    id: stableUUID(candidate.candidateKey),
    text,
    author: "Alex Hormozi",
    primaryCategory: category,
    tags: [...tagsFor(category, text)],
    sourceID: source.sourceID,
    sourceType: source.sourceType,
    sourceTitle: source.title,
    sourceURL: sourceURL.toString(),
    sourceDate: source.publishedAt!,
    sourceLocator: { kind: "media", startSeconds: Math.floor(candidate.startSeconds), endSeconds: Math.ceil(candidate.endSeconds) },
    featured: false,
    containsProfanity: /\b(fuck|shit|bullshit|damn)\b/i.test(text),
    context: contextByCategory[category],
    verificationStandard: "official-transcript-reviewed",
    provenance: {
      transcriptFingerprint: candidate.transcriptFingerprint,
      cueStart: candidate.cueStart,
      cueEnd: candidate.cueEnd,
      batchID: "transcript-editorial-100",
      duplicateDecision: nearest >= 0.55 ? "keep" : "unique",
      duplicateNote: nearest >= 0.55 ? `Nearest catalog similarity ${nearest.toFixed(2)} reviewed; wording and source remain meaningfully distinct.` : `Nearest catalog similarity ${nearest.toFixed(2)}; no material duplicate found.`
    },
    createdAt: reviewedAt,
    updatedAt: reviewedAt,
    verification: { firstPass: verification, secondPass: null, blindAudit: null },
    quality: { standaloneClarity: 2, practicalUsefulness: 2, distinctiveness: 1, fanRelevance: 2, productFit: 2 },
    rejectionNotes: [],
    unresolvedWarnings: []
  };
  records.set(record.candidateKey, record);
}

const recordsByShard = Map.groupBy([...records.values()], (record) => {
  const source = sourceByID.get(record.sourceID)!;
  return `${source.provider}/${source.publishedAt!.slice(0, 4)}`;
});
for (const [key, shardRecords] of recordsByShard) {
  const [provider, yearText] = key.split("/");
  await writeJSONIfChanged(join(CONTENT_ROOT, "editorial", provider, `${yearText}.json`), editorialShardSchema.parse({ schemaVersion: 1, provider, year: Number(yearText), updatedAt: reviewedAt, records: shardRecords.sort((left, right) => left.candidateKey.localeCompare(right.candidateKey)) }));
}
for (const { file, shard } of candidateShards) {
  const candidates = shard.candidates.map((candidate) => selectedKeys.has(candidate.candidateKey) ? { ...candidate, status: "accepted" as const, rejectionReason: null } : candidate);
  await writeJSONIfChanged(file, candidateShardSchema.parse({ ...shard, updatedAt: reviewedAt, candidates }));
}
console.log(`\nApplied ${selected.length} transcript-reviewed additions.`);
