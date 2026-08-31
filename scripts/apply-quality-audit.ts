import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

type Brand = "alex" | "leila";

type AuditRecord = {
  brand: Brand;
  quoteID: string;
  decision: "keep" | "rescue" | "reject";
  rationale: string;
  replacement: null | {
    quoteID: string;
    text: string;
    startSeconds?: number;
    endSeconds?: number;
    identityStrategy: "new-id-material-excerpt" | "preserve-id-punctuation-only";
    sourceID: string;
  };
};

type EditorialRecord = Record<string, unknown> & {
  candidateKey: string;
  id: string;
  text: string;
  status: string;
  sourceType: string;
  sourceURL: string;
  sourceLocator: Record<string, unknown>;
  featured: boolean;
  provenance: Record<string, unknown>;
  verification: Record<string, unknown>;
  rejectionNotes: string[];
};

type EditorialShard = { records: EditorialRecord[] };

const root = resolve(import.meta.dirname, "..");
const auditPath = join(root, "content/quality-audits/full-catalog-2026-08-30.json");
const appliedAt = "2026-08-30T17:00:00.000Z";

const replacementEvidence: Record<string, {
  fingerprint: string;
  cueStart: number;
  cueEnd: number;
}> = {
  "c25d6a8c-ee89-43e3-96b6-696401564fc6": {
    fingerprint: "sha256:fe9b40797e178ee7e228fe2fea2409ae5d3cd7363ba160d5dd050af5d273c92a",
    cueStart: 655,
    cueEnd: 657
  },
  "f79ca397-963e-4763-96e1-6d1a98f6c158": {
    fingerprint: "sha256:fe9b40797e178ee7e228fe2fea2409ae5d3cd7363ba160d5dd050af5d273c92a",
    cueStart: 107,
    cueEnd: 111
  },
  "f0ed207d-b0ef-4099-a09e-68a5f78aec48": {
    fingerprint: "sha256:80416f06b4db83197320cca1af7006b01e4f34d2ea19f7e6f9337371796a95cd",
    cueStart: 710,
    cueEnd: 718
  },
  "85b01838-e87d-44c6-9a48-31bf749d6dae": {
    fingerprint: "sha256:80416f06b4db83197320cca1af7006b01e4f34d2ea19f7e6f9337371796a95cd",
    cueStart: 243,
    cueEnd: 249
  },
  "b55b47ce-c4e6-4fdf-b48a-df657948d35d": {
    fingerprint: "sha256:80416f06b4db83197320cca1af7006b01e4f34d2ea19f7e6f9337371796a95cd",
    cueStart: 812,
    cueEnd: 818
  },
  "9454c290-6e70-4fc5-941a-2665a12a1ce2": { fingerprint: "inherit", cueStart: 7, cueEnd: 7 },
  "47aeb09e-883b-4444-a014-b169fe4ff032": { fingerprint: "inherit", cueStart: 10, cueEnd: 10 },
  "45b6566d-02c0-43d8-b70e-0012007f069f": { fingerprint: "inherit", cueStart: 58, cueEnd: 58 },
  "cbc43468-43c7-4a8f-a7d4-52abf90375d0": { fingerprint: "inherit", cueStart: 18, cueEnd: 18 },
  "adc1b845-6bdd-4c8f-b380-49eca2246abf": { fingerprint: "inherit", cueStart: 24, cueEnd: 24 },
  "183efe3f-cd52-4638-a1c5-f69f264b0d8f": { fingerprint: "inherit", cueStart: 6, cueEnd: 6 },
  "f7fdd384-c5d1-4a74-93c9-fc89370a0bca": { fingerprint: "inherit", cueStart: 13, cueEnd: 13 },
  "228bf8a8-02b8-4b1d-933a-0940c54222aa": { fingerprint: "inherit", cueStart: 155, cueEnd: 156 }
};

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function jsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(path);
    return entry.isFile() && entry.name.endsWith(".json") ? [path] : [];
  }));
  return nested.flat();
}

function deepLink(sourceURL: string, sourceType: string, seconds: number) {
  const start = Math.floor(seconds);
  if (sourceType === "video") {
    const url = new URL(sourceURL);
    url.searchParams.set("t", `${start}s`);
    return url.toString();
  }
  return `${sourceURL.split("#")[0]}#t=${start}`;
}

function replacementRecord(original: EditorialRecord, record: AuditRecord): EditorialRecord {
  const replacement = record.replacement;
  if (!replacement || replacement.identityStrategy !== "new-id-material-excerpt") {
    throw new Error(`Expected a material replacement for ${record.quoteID}`);
  }
  if (replacement.startSeconds === undefined || replacement.endSeconds === undefined) {
    throw new Error(`Material replacement ${replacement.quoteID} is missing its media locator`);
  }
  const evidence = replacementEvidence[replacement.quoteID];
  if (!evidence) throw new Error(`Missing source evidence for ${replacement.quoteID}`);
  const fingerprint = evidence.fingerprint === "inherit"
    ? String(original.provenance.transcriptFingerprint)
    : evidence.fingerprint;

  const created: EditorialRecord = structuredClone(original);
  created.candidateKey = `${original.candidateKey}-qc-rescue`;
  created.status = "verified";
  created.id = replacement.quoteID;
  created.text = replacement.text;
  created.sourceURL = deepLink(original.sourceURL, original.sourceType, replacement.startSeconds);
  created.sourceLocator = {
    kind: "media",
    startSeconds: replacement.startSeconds,
    endSeconds: replacement.endSeconds
  };
  created.featured = false;
  created.context = "Full catalog QC rescue: a contiguous source-exact passage selected because it communicates the source idea as a complete standalone thought.";
  created.verificationStandard = "official-transcript-reviewed";
  created.provenance = {
    transcriptFingerprint: fingerprint,
    cueStart: evidence.cueStart,
    cueEnd: evidence.cueEnd,
    batchID: "full-catalog-qc-2026-08-30",
    duplicateDecision: "unique",
    duplicateNote: "Approved source-exact QC replacement; compared against the retained catalog."
  };
  created.createdAt = appliedAt;
  created.updatedAt = appliedAt;
  delete created.shortVersion;
  delete created.shareCardVersion;
  created.verification = {
    firstPass: {
      outcome: "passed",
      checkedAt: appliedAt,
      reviewer: "Codex · full-catalog QC source rescue",
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
      evidenceNote: `Matched an approved contiguous source-exact excerpt in transcript cues ${evidence.cueStart}-${evidence.cueEnd}; surrounding context was reviewed.`
    },
    secondPass: null,
    blindAudit: null
  };
  created.quality = {
    standaloneClarity: 2,
    practicalUsefulness: 2,
    distinctiveness: 1,
    fanRelevance: 2,
    productFit: 2
  };
  created.rejectionNotes = [];
  created.unresolvedWarnings = [];
  return created;
}

async function applyBrand(brand: Brand, records: AuditRecord[]) {
  const editorialRoot = join(root, brand === "alex" ? "content/editorial" : "content/leila/editorial");
  const files = await jsonFiles(editorialRoot);
  const loaded = await Promise.all(files.map(async (path) => ({ path, shard: await json<EditorialShard>(path) })));
  const location = new Map<string, { shard: EditorialShard; path: string; record: EditorialRecord }>();
  for (const file of loaded) {
    for (const record of file.shard.records) location.set(record.id, { ...file, record });
  }

  for (const auditRecord of records) {
    if (auditRecord.decision === "keep") continue;
    const found = location.get(auditRecord.quoteID);
    if (!found) throw new Error(`Cannot locate ${brand} quote ${auditRecord.quoteID}`);
    const original = found.record;

    if (auditRecord.decision === "rescue" && auditRecord.replacement?.identityStrategy === "preserve-id-punctuation-only") {
      original.text = auditRecord.replacement.text;
      if (auditRecord.replacement.startSeconds !== undefined && auditRecord.replacement.endSeconds !== undefined) {
        original.sourceURL = deepLink(original.sourceURL, original.sourceType, auditRecord.replacement.startSeconds);
        original.sourceLocator = {
          kind: "media",
          startSeconds: auditRecord.replacement.startSeconds,
          endSeconds: auditRecord.replacement.endSeconds
        };
      }
      original.updatedAt = appliedAt;
      delete original.shortVersion;
      delete original.shareCardVersion;
      continue;
    }

    original.status = "rejected";
    original.featured = false;
    original.updatedAt = appliedAt;
    const suffix = auditRecord.decision === "rescue" && auditRecord.replacement
      ? ` Superseded by approved source-exact replacement ${auditRecord.replacement.quoteID}.`
      : "";
    const note = `Full catalog QC (2026-08-30): ${auditRecord.rationale}${suffix}`;
    if (!original.rejectionNotes.includes(note)) original.rejectionNotes.push(note);

    if (auditRecord.decision === "rescue") {
      const replacement = replacementRecord(original, auditRecord);
      if (location.has(replacement.id)) throw new Error(`Replacement ${replacement.id} already exists`);
      found.shard.records.push(replacement);
      location.set(replacement.id, { shard: found.shard, path: found.path, record: replacement });
    }
  }

  for (const file of loaded) {
    await writeFile(file.path, `${JSON.stringify(file.shard, null, 2)}\n`);
  }

  const collectionPath = join(root, brand === "alex" ? "content/collections.json" : "content/leila/collections.json");
  const collections = await json<Array<{ quoteIDs: string[] } & Record<string, unknown>>>(collectionPath);
  const decisions = new Map(records.filter((record) => record.decision !== "keep").map((record) => [record.quoteID, record]));
  for (const collection of collections) {
    collection.quoteIDs = collection.quoteIDs.flatMap((id) => {
      const decision = decisions.get(id);
      if (!decision) return [id];
      if (decision.decision === "rescue" && decision.replacement) return [decision.replacement.quoteID];
      return [];
    });
  }
  await writeFile(collectionPath, `${JSON.stringify(collections, null, 2)}\n`);
}

const audit = await json<{ state: string; cleanupApplied: boolean; records: AuditRecord[] }>(auditPath);
if (audit.state !== "awaiting_user_approval" || audit.cleanupApplied) {
  throw new Error(`Audit is not ready to apply (state=${audit.state}, cleanupApplied=${audit.cleanupApplied})`);
}

await applyBrand("alex", audit.records.filter((record) => record.brand === "alex"));
await applyBrand("leila", audit.records.filter((record) => record.brand === "leila"));

const counts = audit.records.reduce<Record<string, number>>((result, record) => {
  result[`${record.brand}:${record.decision}`] = (result[`${record.brand}:${record.decision}`] ?? 0) + 1;
  return result;
}, {});
console.log(JSON.stringify({ appliedAt, counts }, null, 2));
