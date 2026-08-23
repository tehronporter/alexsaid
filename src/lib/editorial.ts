import type { EditorialLedger, EditorialRecord, QualityScore, VerificationPass } from "@/domain/editorial";
import { quoteCatalogSchema, type QuoteCatalogV2 } from "@/domain/catalog";

const blockedSourceHosts = new Set([
  "brainyquote.com",
  "www.brainyquote.com",
  "goodreads.com",
  "www.goodreads.com",
  "quotefancy.com",
  "www.quotefancy.com",
  "azquotes.com",
  "www.azquotes.com",
  "pinterest.com",
  "www.pinterest.com",
  "example.com",
  "example.org",
  "example.net",
  "localhost"
]);

const passingChecks: (keyof VerificationPass)[] = [
  "sourceReopened",
  "surroundingContextReviewed",
  "wordingConfirmed",
  "attributionConfirmed",
  "locatorConfirmed",
  "metadataConfirmed",
  "contextuallyHonest",
  "notStitchedOrParaphrased"
];

export function normalizeQuoteText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return new Set(normalizeQuoteText(value).split(" ").filter(Boolean));
}

export function quoteSimilarity(left: string, right: string) {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}

export function findNearDuplicatePairs(records: readonly Pick<EditorialRecord, "candidateKey" | "text">[], threshold = 0.82) {
  const pairs: { left: string; right: string; similarity: number }[] = [];
  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      const similarity = quoteSimilarity(records[left].text, records[right].text);
      if (similarity >= threshold) pairs.push({
        left: records[left].candidateKey,
        right: records[right].candidateKey,
        similarity
      });
    }
  }
  return pairs;
}

export function qualityTotal(score: QualityScore) {
  return Object.values(score).reduce((total, value) => total + value, 0);
}

export function qualityIssues(score: QualityScore | null) {
  if (!score) return ["Quality scoring is incomplete"];
  const issues: string[] = [];
  if (Object.values(score).some((value) => value === 0)) issues.push("Every quality dimension must score at least 1");
  if (qualityTotal(score) < 8) issues.push(`Quality total must be at least 8; found ${qualityTotal(score)}`);
  return issues;
}

function normalizeExcerptPart(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/u, "")
    .trim()
    .toLocaleLowerCase();
}

export function isExactExcerpt(fullText: string, excerpt: string) {
  const full = normalizeExcerptPart(fullText);
  const parts = excerpt.split(/(?:\.\.\.|…)/u).map(normalizeExcerptPart).filter(Boolean);
  if (parts.length === 0) return false;
  let offset = 0;
  for (const part of parts) {
    const foundAt = full.indexOf(part, offset);
    if (foundAt < 0) return false;
    offset = foundAt + part.length;
  }
  if (parts.length === 1 && full !== parts[0] && !excerpt.includes("…") && !excerpt.includes("...")) return false;
  return true;
}

function passIssues(pass: VerificationPass | null, label: string) {
  if (!pass) return [`${label} verification is missing`];
  const issues: string[] = [];
  if (pass.outcome !== "passed") issues.push(`${label} verification did not pass`);
  for (const check of passingChecks) {
    if (!pass[check]) issues.push(`${label} verification did not confirm ${check}`);
  }
  return issues;
}

function expectedVerificationMethod(locator: EditorialRecord["sourceLocator"]): VerificationPass["method"] {
  if (locator.kind === "media") return "direct-media-listen";
  if (locator.kind === "book") return "direct-book-read";
  return "direct-web-read";
}

export function sourceURLIssues(record: Pick<EditorialRecord, "sourceURL" | "sourceLocator" | "sourceType">) {
  const issues: string[] = [];
  const url = new URL(record.sourceURL);
  if ([...blockedSourceHosts].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) issues.push(`Source host is blocked, placeholder, or an aggregator: ${url.hostname}`);
  const isHomepage = (url.pathname === "/" || url.pathname === "") && !url.search && !url.hash;
  if (isHomepage) issues.push("Source URL points only to a homepage");
  if (record.sourceLocator.kind === "media") {
    if (!["podcast", "video"].includes(record.sourceType)) issues.push("Media locator requires a podcast or video source type");
    const deepLinkTime = url.searchParams.get("t") ?? url.searchParams.get("start");
    if (!deepLinkTime && !url.hash.match(/t=/)) issues.push("Media source URL must deep-link to its timestamp");
  }
  if (record.sourceLocator.kind === "book" && record.sourceType !== "book") issues.push("Book locator requires a book source type");
  if (record.sourceLocator.kind === "web" && ["book", "podcast", "video"].includes(record.sourceType)) {
    issues.push("Web locator cannot be used for a book, podcast, or video");
  }
  return issues;
}

export function publishabilityIssues(record: EditorialRecord) {
  const issues: string[] = [];
  if (record.status !== "verified") issues.push(`Record status is ${record.status}, not verified`);
  if (!record.id) issues.push("Accepted record has no stable UUID");
  if (record.author !== "Alex Hormozi") issues.push(`Unsupported attribution: ${record.author}`);
  issues.push(...passIssues(record.verification.firstPass, "First-pass"));
  issues.push(...passIssues(record.verification.secondPass, "Second-pass"));
  if (record.verification.blindAudit) issues.push(...passIssues(record.verification.blindAudit, "Blind-audit"));
  const expectedMethod = expectedVerificationMethod(record.sourceLocator);
  if (record.verification.firstPass?.method !== expectedMethod) issues.push(`First-pass verification must use ${expectedMethod}`);
  if (record.verification.secondPass?.method !== expectedMethod) issues.push(`Second-pass verification must use ${expectedMethod}`);
  if (record.verification.firstPass && record.verification.secondPass) {
    if (record.verification.firstPass.checkedAt === record.verification.secondPass.checkedAt) issues.push("Verification passes must be recorded separately");
    if (record.verification.firstPass.reviewer === record.verification.secondPass.reviewer) issues.push("Verification passes require distinct reviewer labels");
  }
  issues.push(...qualityIssues(record.quality));
  issues.push(...sourceURLIssues(record));
  if (record.unresolvedWarnings.length > 0) issues.push(`Unresolved warnings: ${record.unresolvedWarnings.join("; ")}`);
  if (record.shortVersion && !isExactExcerpt(record.text, record.shortVersion)) issues.push("shortVersion is not an exact excerpt");
  if (record.shareCardVersion && !isExactExcerpt(record.text, record.shareCardVersion)) issues.push("shareCardVersion is not an exact excerpt");
  const score = record.quality ? qualityTotal(record.quality) : 0;
  if (record.featured && score < 9) issues.push("Featured records must score at least 9");
  return issues;
}

export function transitionEditorialRecord(record: EditorialRecord, nextStatus: EditorialRecord["status"], acceptedID?: string): EditorialRecord {
  const allowed: Record<EditorialRecord["status"], EditorialRecord["status"][]> = {
    candidate: ["in_review", "rejected"],
    in_review: ["verified", "rejected"],
    verified: ["in_review", "rejected"],
    rejected: ["in_review"]
  };
  if (!allowed[record.status].includes(nextStatus)) throw new Error(`Invalid editorial transition: ${record.status} -> ${nextStatus}`);
  const candidate = { ...record, status: nextStatus, ...(nextStatus === "verified" && acceptedID ? { id: acceptedID } : {}) };
  if (nextStatus === "verified") {
    const issues = publishabilityIssues(candidate);
    if (issues.length > 0) throw new Error(issues.join("\n"));
  }
  return candidate;
}

export function generatePublicCatalog(ledger: EditorialLedger, generatedAt = new Date().toISOString()): QuoteCatalogV2 {
  const verified = ledger.records.filter((record) => record.status === "verified");
  const errors = verified.flatMap((record) => publishabilityIssues(record).map((issue) => `${record.candidateKey}: ${issue}`));
  const audited = verified.filter(({ verification }) => verification.blindAudit && passIssues(verification.blindAudit, "Blind-audit").length === 0).length;
  const requiredAudits = Math.ceil(verified.length * 0.1);
  if (audited < requiredAudits) errors.push(`Blind audit coverage requires ${requiredAudits} records; found ${audited}`);
  const acceptedIDs = verified.flatMap(({ id }) => id ? [id] : []);
  if (new Set(acceptedIDs).size !== acceptedIDs.length) errors.push("Verified records contain duplicate UUIDs");
  const duplicates = findNearDuplicatePairs(verified);
  errors.push(...duplicates.map(({ left, right, similarity }) => `Near duplicate (${similarity.toFixed(2)}): ${left} / ${right}`));
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const ids = new Set(verified.flatMap((record) => record.id ? [record.id] : []));
  for (const collection of ledger.collections) {
    for (const quoteID of collection.quoteIDs) {
      if (!ids.has(quoteID)) errors.push(`Collection ${collection.slug} references unpublished quote ${quoteID}`);
    }
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const quotes = verified.map((record) => ({
    id: record.id!,
    text: record.text,
    author: record.author,
    primaryCategory: record.primaryCategory,
    tags: record.tags,
    sourceType: record.sourceType,
    sourceTitle: record.sourceTitle,
    sourceURL: record.sourceURL,
    sourceDate: record.sourceDate,
    sourceLocator: record.sourceLocator,
    verified: true as const,
    featured: record.featured,
    containsProfanity: record.containsProfanity,
    context: record.context,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(record.shortVersion ? { shortVersion: record.shortVersion } : {}),
    ...(record.shareCardVersion ? { shareCardVersion: record.shareCardVersion } : {})
  }));

  return quoteCatalogSchema.parse({
    schemaVersion: 2,
    generatedAt,
    developmentFixture: false,
    categories: [...new Set(quotes.map(({ primaryCategory }) => primaryCategory))].sort(),
    collections: ledger.collections,
    quotes
  });
}
