import { describe, expect, it } from "vitest";
import { editorialLedgerSchema, editorialRecordSchema, type EditorialRecord } from "@/domain/editorial";
import {
  findNearDuplicatePairs,
  generateCatalogV3,
  isExactExcerpt,
  publishabilityIssues,
  projectCatalogV2,
  qualityIssues,
  sourceURLIssues,
  transitionEditorialRecord
} from "@/lib/editorial";

const passed = {
  outcome: "passed" as const,
  checkedAt: "2026-08-23T23:00:00.000Z",
  reviewer: "reviewer",
  method: "direct-media-listen" as const,
  isolatedReview: true,
  sourceReopened: true,
  surroundingContextReviewed: true,
  surroundingContextSeconds: 30,
  wordingConfirmed: true,
  attributionConfirmed: true,
  locatorConfirmed: true,
  metadataConfirmed: true,
  contextuallyHonest: true,
  notStitchedOrParaphrased: true,
  evidenceNote: "Reopened and listened to the direct source with surrounding context."
};
const secondPass = { ...passed, checkedAt: "2026-08-23T23:05:00.000Z", reviewer: "reviewer-two" };

function makeRecord(overrides: Partial<EditorialRecord> = {}): EditorialRecord {
  return editorialRecordSchema.parse({
    candidateKey: "candidate-one",
    status: "verified",
    id: "10000000-0000-4000-8000-000000000001",
    text: "People only feel sold to if it's bad.",
    author: "Alex Hormozi",
    primaryCategory: "Sales",
    tags: ["sales", "customer-experience"],
    sourceID: "youtube-source",
    sourceType: "video",
    sourceTitle: "A complete direct recording",
    sourceURL: "https://www.youtube.com/watch?v=source&t=413s",
    sourceDate: "2026-08-23",
    sourceLocator: { kind: "media", startSeconds: 413, endSeconds: 416 },
    featured: true,
    containsProfanity: false,
    context: "Alex is responding to a founder's concern about selling.",
    provenance: { transcriptFingerprint: null, cueStart: null, cueEnd: null, batchID: "test-batch", duplicateDecision: "unique", duplicateNote: "No similar quote exists in this test fixture." },
    createdAt: "2026-08-23T23:00:00.000Z",
    updatedAt: "2026-08-23T23:00:00.000Z",
    verification: { firstPass: passed, secondPass, blindAudit: null },
    quality: { standaloneClarity: 2, practicalUsefulness: 2, distinctiveness: 2, fanRelevance: 2, productFit: 2 },
    rejectionNotes: [],
    unresolvedWarnings: [],
    ...overrides
  });
}

describe("editorial source locators", () => {
  it("accepts precise media, book, and web locators", () => {
    expect(makeRecord().sourceLocator.kind).toBe("media");
    expect(() => makeRecord({ sourceType: "book", sourceURL: "https://books.example/alex-edition", sourceLocator: { kind: "book", edition: "First edition", publisher: "Example Press", publicationYear: 2026, isbn: "9781234567890", chapter: "Chapter 2", page: 42 } })).not.toThrow();
    expect(() => makeRecord({ sourceType: "article", sourceURL: "https://www.acquisition.com/article/example", sourceLocator: { kind: "web", section: "The value equation" } })).not.toThrow();
  });

  it("rejects media without a timestamp and books without edition/location evidence", () => {
    const base = makeRecord();
    expect(() => editorialRecordSchema.parse({ ...base, sourceLocator: { kind: "media" } })).toThrow();
    expect(() => editorialRecordSchema.parse({ ...base, sourceType: "book", sourceLocator: { kind: "book", publisher: "Press", publicationYear: 2026, chapter: "One" } })).toThrow();
  });
});

describe("editorial gates", () => {
  it("requires two complete, successful verification passes", () => {
    expect(publishabilityIssues(makeRecord({ verification: { firstPass: passed, secondPass: null, blindAudit: null } }))).toContain("Second-pass verification is missing");
    const stitched = makeRecord({ verification: { firstPass: passed, secondPass: { ...secondPass, notStitchedOrParaphrased: false }, blindAudit: null } });
    expect(publishabilityIssues(stitched).join(" ")).toContain("notStitchedOrParaphrased");
  });

  it("allows one official transcript review only with reproducible contiguous-cue provenance", () => {
    const transcriptPass = { ...passed, method: "official-transcript-read" as const, surroundingContextSeconds: null };
    const transcriptRecord = makeRecord({
      verificationStandard: "official-transcript-reviewed",
      provenance: { transcriptFingerprint: `sha256:${"a".repeat(64)}`, cueStart: 12, cueEnd: 14, batchID: "transcript-review", duplicateDecision: "unique", duplicateNote: "Distinct transcript excerpt." },
      verification: { firstPass: transcriptPass, secondPass: null, blindAudit: null }
    });
    expect(publishabilityIssues(transcriptRecord)).toEqual([]);
    expect(publishabilityIssues({ ...transcriptRecord, provenance: { ...transcriptRecord.provenance, cueStart: null } }).join(" ")).toContain("transcript fingerprint and cue range");
  });

  it("rejects wrong speakers, aggregators, homepages, and imprecise media links", () => {
    expect(publishabilityIssues(makeRecord({ author: "Another Speaker" })).join(" ")).toContain("Unsupported attribution");
    expect(sourceURLIssues({ sourceURL: "https://www.brainyquote.com/quotes/example", sourceType: "article", sourceLocator: { kind: "web" } }).join(" ")).toContain("aggregator");
    expect(sourceURLIssues({ sourceURL: "https://example.com/source", sourceType: "article", sourceLocator: { kind: "web" } }).join(" ")).toContain("placeholder");
    expect(sourceURLIssues({ sourceURL: "https://example.com/", sourceType: "article", sourceLocator: { kind: "web" } })).toContain("Source URL points only to a homepage");
    expect(sourceURLIssues({ sourceURL: "https://www.youtube.com/watch?v=source", sourceType: "video", sourceLocator: { kind: "media", startSeconds: 20 } })).toContain("Media source URL must deep-link to its timestamp");
  });

  it("enforces exact excerpt and fan-value rules", () => {
    const full = "And so, one of my internal jokes is the undefeated champion is do nothing.";
    expect(isExactExcerpt(full, "…the undefeated champion is do nothing.")).toBe(true);
    expect(isExactExcerpt(full, "The undefeated winner is do nothing.")).toBe(false);
    expect(qualityIssues({ standaloneClarity: 2, practicalUsefulness: 2, distinctiveness: 0, fanRelevance: 2, productFit: 2 })).toContain("Every quality dimension must score at least 1");
    expect(qualityIssues({ standaloneClarity: 1, practicalUsefulness: 1, distinctiveness: 1, fanRelevance: 2, productFit: 2 }).join(" ")).toContain("at least 9");
  });

  it("finds exact and high-confidence near duplicates", () => {
    const pairs = findNearDuplicatePairs([
      { candidateKey: "one", text: "Do nothing is commonly the correct answer." },
      { candidateKey: "two", text: "Do nothing is very commonly the correct answer." },
      { candidateKey: "three", text: "Revenue retention compounds growth." }
    ], 0.75);
    expect(pairs).toMatchObject([{ left: "one", right: "two" }]);
  });

  it("allows only controlled review transitions and assigns the UUID at acceptance", () => {
    const review = makeRecord({ status: "in_review", id: undefined, featured: false });
    expect(transitionEditorialRecord(review, "verified", "20000000-0000-4000-8000-000000000002").id).toBe("20000000-0000-4000-8000-000000000002");
    expect(() => transitionEditorialRecord(review, "candidate")).toThrow("Invalid editorial transition");
  });
});

describe("public catalog generation", () => {
  it("publishes only verified records and derives the visible taxonomy", () => {
    const accepted = makeRecord({ verification: { firstPass: passed, secondPass, blindAudit: { ...secondPass, checkedAt: "2026-08-23T23:10:00.000Z", reviewer: "blind-auditor" } } });
    const rejected = editorialRecordSchema.parse({ ...accepted, candidateKey: "rejected", status: "rejected", id: undefined, featured: false, rejectionNotes: ["Wrong speaker"] });
    const ledger = editorialLedgerSchema.parse({ schemaVersion: 1, updatedAt: "2026-08-23T23:00:00.000Z", records: [accepted, rejected], collections: [] });
    const source = { sourceID: "youtube-source", externalID: "source", provider: "youtube" as const, sourceType: "video" as const, title: "A complete direct recording", publisher: "Alex Hormozi", publishedAt: "2026-08-23", durationSeconds: 900, canonicalURL: "https://www.youtube.com/watch?v=source", mediaURL: "https://www.youtube.com/watch?v=source", transcriptURL: null, transcriptChecksum: null, retrievedAt: "2026-08-23T23:00:00.000Z", discoveryMethod: "test-fixture", status: "reviewed" as const, exclusionReason: null, blockingReason: null };
    const taxonomy = { schemaVersion: 1 as const, categories: ["Offers", "Leads & Marketing", "Sales", "Customer Success & Retention", "Business Models & Strategy", "Operations & Scaling", "Leadership & Teams", "Decision Making", "Productivity & Execution", "Mindset & Personal Growth"] as ["Offers", "Leads & Marketing", "Sales", "Customer Success & Retention", "Business Models & Strategy", "Operations & Scaling", "Leadership & Teams", "Decision Making", "Productivity & Execution", "Mindset & Personal Growth"], tags: [{ slug: "sales", label: "Sales", definition: "Helping qualified prospects make purchase decisions.", aliases: [] }, { slug: "customer-experience", label: "Customer experience", definition: "How customers experience company interactions.", aliases: [] }] };
    const catalog = projectCatalogV2(generateCatalogV3(ledger, [source], taxonomy, "2026-08-23T23:00:00.000Z"));
    expect(catalog.quotes.map(({ id }) => id)).toEqual([accepted.id]);
    expect(catalog.categories).toContain("Sales");
    expect(catalog.developmentFixture).toBe(false);
  });
});
