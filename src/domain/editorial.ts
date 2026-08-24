import { z } from "zod";
import { collectionSchema, sourceLocatorSchema, sourceTypeSchema } from "@/domain/catalog";
import { catalogCategorySchema, tagSlugSchema } from "@/domain/taxonomy";
import { sourceProviderSchema } from "@/domain/source";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTimeSchema = z.string().datetime({ offset: true });

export const verificationPassSchema = z.object({
  outcome: z.enum(["passed", "failed"]),
  checkedAt: isoDateTimeSchema,
  reviewer: z.string().trim().min(1),
  method: z.enum(["direct-media-listen", "direct-web-read", "direct-book-read"]),
  isolatedReview: z.boolean(),
  sourceReopened: z.boolean(),
  surroundingContextReviewed: z.boolean(),
  surroundingContextSeconds: z.number().int().nonnegative().nullable(),
  wordingConfirmed: z.boolean(),
  attributionConfirmed: z.boolean(),
  locatorConfirmed: z.boolean(),
  metadataConfirmed: z.boolean(),
  contextuallyHonest: z.boolean(),
  notStitchedOrParaphrased: z.boolean(),
  evidenceNote: z.string().trim().min(12)
});

export const qualityScoreSchema = z.object({
  standaloneClarity: z.number().int().min(0).max(2),
  practicalUsefulness: z.number().int().min(0).max(2),
  distinctiveness: z.number().int().min(0).max(2),
  fanRelevance: z.number().int().min(0).max(2),
  productFit: z.number().int().min(0).max(2)
});

export const editorialRecordSchema = z.object({
  candidateKey: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(["candidate", "in_review", "verified", "rejected"]),
  id: z.string().uuid().optional(),
  text: z.string().trim().min(3).max(420),
  author: z.string().trim().min(1),
  primaryCategory: catalogCategorySchema,
  tags: z.array(tagSlugSchema).min(2).max(5),
  sourceID: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceType: sourceTypeSchema,
  sourceTitle: z.string().trim().min(1),
  sourceURL: z.string().url(),
  sourceDate: isoDateSchema,
  sourceLocator: sourceLocatorSchema,
  featured: z.boolean(),
  containsProfanity: z.boolean(),
  context: z.string().trim().min(1),
  provenance: z.object({
    transcriptFingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/).nullable(),
    cueStart: z.number().int().nonnegative().nullable(),
    cueEnd: z.number().int().nonnegative().nullable(),
    batchID: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    duplicateDecision: z.enum(["unique", "keep", "reject"]),
    duplicateNote: z.string().trim().min(8)
  }).superRefine((provenance, context) => {
    if ((provenance.cueStart === null) !== (provenance.cueEnd === null)) context.addIssue({ code: "custom", message: "Cue range must include both start and end", path: ["cueStart"] });
    if (provenance.cueStart !== null && provenance.cueEnd !== null && provenance.cueEnd < provenance.cueStart) context.addIssue({ code: "custom", message: "Cue end must not precede cue start", path: ["cueEnd"] });
  }),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  shortVersion: z.string().trim().min(1).max(140).optional(),
  shareCardVersion: z.string().trim().min(1).max(260).optional(),
  verification: z.object({
    firstPass: verificationPassSchema.nullable(),
    secondPass: verificationPassSchema.nullable(),
    blindAudit: verificationPassSchema.nullable()
  }),
  quality: qualityScoreSchema.nullable(),
  rejectionNotes: z.array(z.string().trim().min(1)),
  unresolvedWarnings: z.array(z.string().trim().min(1))
}).superRefine((record, context) => {
  if (record.status === "verified" && !record.id) {
    context.addIssue({ code: "custom", message: "Verified records require a stable UUID", path: ["id"] });
  }
  if (record.status !== "verified" && record.featured) {
    context.addIssue({ code: "custom", message: "Only verified records may be featured", path: ["featured"] });
  }
  if (record.status === "rejected" && record.rejectionNotes.length === 0) {
    context.addIssue({ code: "custom", message: "Rejected records require a rejection note", path: ["rejectionNotes"] });
  }
});

export const editorialLedgerSchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: isoDateTimeSchema,
  records: z.array(editorialRecordSchema),
  collections: z.array(collectionSchema)
});

export const editorialShardSchema = z.object({
  schemaVersion: z.literal(1),
  provider: sourceProviderSchema,
  year: z.number().int().min(2000).max(2100),
  updatedAt: isoDateTimeSchema,
  records: z.array(editorialRecordSchema)
});

export const candidateRecordSchema = z.object({
  candidateKey: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceID: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  provider: sourceProviderSchema,
  transcriptFingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  cueStart: z.number().int().nonnegative(),
  cueEnd: z.number().int().nonnegative(),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  text: z.string().trim().min(3).max(420),
  wordCount: z.number().int().min(3).max(70),
  score: z.number().finite(),
  status: z.enum(["candidate", "in_review", "accepted", "rejected"]),
  minedAt: isoDateTimeSchema,
  rejectionReason: z.string().trim().min(3).nullable()
}).refine(({ cueEnd, cueStart }) => cueEnd >= cueStart, { message: "Candidate cues must be contiguous and ordered", path: ["cueEnd"] });

export const candidateShardSchema = z.object({
  schemaVersion: z.literal(1),
  provider: sourceProviderSchema,
  year: z.number().int().min(2000).max(2100),
  updatedAt: isoDateTimeSchema,
  candidates: z.array(candidateRecordSchema)
});

export type VerificationPass = z.infer<typeof verificationPassSchema>;
export type QualityScore = z.infer<typeof qualityScoreSchema>;
export type EditorialRecord = z.infer<typeof editorialRecordSchema>;
export type EditorialLedger = z.infer<typeof editorialLedgerSchema>;
export type EditorialShard = z.infer<typeof editorialShardSchema>;
export type CandidateRecord = z.infer<typeof candidateRecordSchema>;
export type CandidateShard = z.infer<typeof candidateShardSchema>;
