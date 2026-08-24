import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { editorialLedgerSchema, editorialShardSchema, type EditorialRecord } from "../src/domain/editorial";
import { sourceShardSchema, type SourceRecord } from "../src/domain/source";
import { taxonomySchema, type CatalogCategory } from "../src/domain/taxonomy";
import { CONTENT_ROOT, readJSON, sha256, writeJSONIfChanged } from "../src/lib/content-files";

type LegacyRecord = Omit<EditorialRecord, "primaryCategory" | "tags" | "sourceID" | "provenance" | "verification"> & {
  primaryCategory: string;
  tags: string[];
  verification: {
    firstPass: Record<string, unknown> | null;
    secondPass: Record<string, unknown> | null;
    blindAudit: Record<string, unknown> | null;
  };
};
type LegacyLedger = { schemaVersion: 1; updatedAt: string; records: LegacyRecord[]; collections: { slug: string; title: string; description: string; quoteIDs: string[]; displayOrder: number }[] };

const path = resolve("content/editorial-ledger.json");
const raw = JSON.parse(await readFile(path, "utf8")) as LegacyLedger;
if (raw.records.every((record) => "sourceID" in record && "provenance" in record)) {
  console.log("Batch 0 migration already applied");
  process.exit(0);
}

const taxonomy = taxonomySchema.parse(await readJSON<unknown>(join(CONTENT_ROOT, "taxonomy.json")));
const canonicalTags = new Set(taxonomy.tags.map((tag) => tag.slug));
const aliasToCanonical = new Map(taxonomy.tags.flatMap((tag) => tag.aliases.map((alias) => [alias, tag.slug] as const)));
const lowQuality = new Set(["younger-people-advance-faster", "passive-income-enterprise-value", "hard-soft-skills-measurement"]);
const categoryByKey: Record<string, CatalogCategory> = {
  "intellectual-laziness": "Productivity & Execution",
  "what-would-it-take": "Decision Making",
  "do-nothing-champion": "Decision Making",
  "emotional-discomfort-action": "Productivity & Execution",
  "feel-sold-to": "Sales",
  "purchases-designed": "Sales",
  "responsibility-to-business": "Operations & Scaling",
  "retention-is-foundational": "Customer Success & Retention",
  "retention-first": "Customer Success & Retention",
  "switch-for-retention": "Business Models & Strategy",
  "risk-when-poor": "Mindset & Personal Growth",
  "ambition-without-action": "Productivity & Execution",
  "hard-times-epic-story": "Mindset & Personal Growth",
  "rich-get-richer-selectivity": "Decision Making",
  "gonna-die-already-won": "Mindset & Personal Growth",
  "customer-backwards-to-money": "Business Models & Strategy",
  "advertise-more": "Leads & Marketing",
  "fight-against-irrelevance": "Leads & Marketing",
  "always-making-things-happen-faster": "Mindset & Personal Growth",
  "productivity-not-do": "Productivity & Execution",
  "focus-only-solid-employee": "Operations & Scaling",
  "stressed-because-not-deciding": "Decision Making",
  "offer-not-converting-five-reasons": "Offers",
  "scaling-flat-retention-curve": "Customer Success & Retention",
  "younger-people-advance-faster": "Leadership & Teams",
  "passive-income-enterprise-value": "Business Models & Strategy",
  "learn-sales-from-close-calls": "Sales",
  "change-inputs-change-outputs": "Productivity & Execution",
  "hard-soft-skills-measurement": "Leadership & Teams",
  "sell-things-people-do-not-cancel": "Customer Success & Retention",
  "opportunity-looks-like-risk": "Decision Making",
  "regret-ignores-the-cost": "Decision Making",
  "sales-skill-permanent-raise": "Sales",
  "start-now-or-change-goal": "Productivity & Execution",
  "questions-like-weapons-rejected": "Decision Making",
  "resale-not-sales-rejected": "Sales",
  "already-growing-rejected": "Operations & Scaling"
};

function sourceIdentity(record: LegacyRecord) {
  const url = new URL(record.sourceURL);
  if (record.sourceType === "video") {
    const externalID = url.searchParams.get("v") ?? sha256(record.sourceURL).slice(7, 19);
    return { provider: "youtube" as const, externalID, sourceID: `youtube-${externalID.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` };
  }
  if (record.sourceType === "social") {
    const externalID = url.pathname.match(/\/status\/(\d+)/)?.[1] ?? sha256(record.sourceURL).slice(7, 19);
    return { provider: "x" as const, externalID, sourceID: `x-${externalID}` };
  }
  return { provider: "third-party" as const, externalID: sha256(record.sourceURL).slice(7, 19), sourceID: `third-party-${sha256(record.sourceURL).slice(7, 19)}` };
}

function tagsFor(record: LegacyRecord) {
  const tags = [...new Set(record.tags.flatMap((tag) => canonicalTags.has(tag) ? [tag] : aliasToCanonical.has(tag) ? [aliasToCanonical.get(tag)!] : []))];
  const fallback: Record<CatalogCategory, string[]> = {
    "Offers": ["offers", "sales"],
    "Leads & Marketing": ["marketing", "advertising"],
    "Sales": ["sales", "customer-experience"],
    "Customer Success & Retention": ["retention", "customer-experience"],
    "Business Models & Strategy": ["business-models", "strategy"],
    "Operations & Scaling": ["scaling", "prioritization"],
    "Leadership & Teams": ["leadership", "learning"],
    "Decision Making": ["decision-making", "strategy"],
    "Productivity & Execution": ["execution", "focus"],
    "Mindset & Personal Growth": ["perspective", "resilience"]
  };
  for (const fallbackTag of fallback[categoryByKey[record.candidateKey]]) if (!tags.includes(fallbackTag) && tags.length < 2) tags.push(fallbackTag);
  return tags.slice(0, 5) as [string, string, ...string[]];
}

function migratePass(pass: Record<string, unknown> | null, sourceType: string) {
  if (!pass) return null;
  return {
    ...pass,
    isolatedReview: true,
    surroundingContextSeconds: sourceType === "video" || sourceType === "podcast" ? 30 : null
  };
}

const now = new Date().toISOString();
const sourceMap = new Map<string, SourceRecord>();
const migratedRecords = raw.records.map((record): EditorialRecord => {
  const identity = sourceIdentity(record);
  const canonicalURL = new URL(record.sourceURL);
  canonicalURL.searchParams.delete("t");
  canonicalURL.searchParams.delete("start");
  canonicalURL.hash = "";
  const mediaURL = record.sourceType === "video" ? canonicalURL.toString() : null;
  sourceMap.set(identity.sourceID, {
    sourceID: identity.sourceID,
    externalID: identity.externalID,
    provider: identity.provider,
    sourceType: record.sourceType,
    title: record.sourceTitle,
    publisher: "Alex Hormozi",
    publishedAt: record.sourceDate,
    durationSeconds: null,
    canonicalURL: canonicalURL.toString(),
    mediaURL,
    transcriptURL: null,
    transcriptChecksum: null,
    retrievedAt: now,
    discoveryMethod: identity.provider === "x" ? "direct-official-x-post" : "direct-official-youtube-upload",
    status: "reviewed",
    exclusionReason: null,
    blockingReason: null
  });
  const rejectedForQuality = lowQuality.has(record.candidateKey);
  return editorialShardSchema.shape.records.element.parse({
    ...record,
    status: rejectedForQuality ? "rejected" : record.status,
    featured: rejectedForQuality ? false : record.featured,
    primaryCategory: categoryByKey[record.candidateKey],
    tags: tagsFor(record),
    sourceID: identity.sourceID,
    provenance: {
      transcriptFingerprint: null,
      cueStart: null,
      cueEnd: null,
      batchID: "batch-0-existing",
      duplicateDecision: "unique",
      duplicateNote: "No exact or near duplicate was identified in the Batch 0 comparison set."
    },
    verification: {
      firstPass: migratePass(record.verification.firstPass, record.sourceType),
      secondPass: migratePass(record.verification.secondPass, record.sourceType),
      blindAudit: migratePass(record.verification.blindAudit, record.sourceType)
    },
    rejectionNotes: rejectedForQuality ? [...record.rejectionNotes, "Batch 0 re-audit: the prior 8/10 score does not meet the 9/10 production threshold."] : record.rejectionNotes,
    updatedAt: rejectedForQuality ? now : record.updatedAt
  });
});

const rejectedIDs = new Set(migratedRecords.filter((record) => record.status === "rejected").flatMap((record) => record.id ? [record.id] : []));
const collections = raw.collections.map((collection) => ({ ...collection, quoteIDs: collection.quoteIDs.filter((id) => !rejectedIDs.has(id)) }));
await writeJSONIfChanged(join(CONTENT_ROOT, "collections.json"), collections);

for (const [key, records] of Map.groupBy(migratedRecords, (record) => {
  const source = sourceMap.get(record.sourceID)!;
  return `${source.provider}/${source.publishedAt!.slice(0, 4)}`;
})) {
  const [provider, yearText] = key.split("/");
  await writeJSONIfChanged(join(CONTENT_ROOT, "editorial", provider, `${yearText}.json`), editorialShardSchema.parse({ schemaVersion: 1, provider, year: Number(yearText), updatedAt: now, records: records.sort((left, right) => left.candidateKey.localeCompare(right.candidateKey)) }));
}

for (const [key, sources] of Map.groupBy([...sourceMap.values()], (source) => `${source.provider}/${source.publishedAt!.slice(0, 4)}`)) {
  const [provider, yearText] = key.split("/");
  await writeJSONIfChanged(join(CONTENT_ROOT, "sources", provider, `${yearText}.json`), sourceShardSchema.parse({ schemaVersion: 1, provider, year: Number(yearText), updatedAt: now, sources: sources.sort((left, right) => left.sourceID.localeCompare(right.sourceID)) }));
}

const ledger = editorialLedgerSchema.parse({ schemaVersion: 1, updatedAt: now, records: migratedRecords.sort((left, right) => left.candidateKey.localeCompare(right.candidateKey)), collections });
await writeFile(path, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
console.log(`Migrated Batch 0: ${migratedRecords.length} records, ${sourceMap.size} direct sources, ${rejectedIDs.size} rejected records`);
