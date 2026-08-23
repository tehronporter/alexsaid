import { z } from "zod";
import { collectionSchema, sourceLocatorSchema, sourceTypeSchema } from "@/domain/catalog";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTimeSchema = z.string().datetime({ offset: true });

export const verificationPassSchema = z.object({
  outcome: z.enum(["passed", "failed"]),
  checkedAt: isoDateTimeSchema,
  reviewer: z.string().trim().min(1),
  method: z.enum(["direct-media-listen", "direct-web-read", "direct-book-read"]),
  sourceReopened: z.boolean(),
  surroundingContextReviewed: z.boolean(),
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
  primaryCategory: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
  sourceType: sourceTypeSchema,
  sourceTitle: z.string().trim().min(1),
  sourceURL: z.string().url(),
  sourceDate: isoDateSchema,
  sourceLocator: sourceLocatorSchema,
  featured: z.boolean(),
  containsProfanity: z.boolean(),
  context: z.string().trim().min(1),
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

export type VerificationPass = z.infer<typeof verificationPassSchema>;
export type QualityScore = z.infer<typeof qualityScoreSchema>;
export type EditorialRecord = z.infer<typeof editorialRecordSchema>;
export type EditorialLedger = z.infer<typeof editorialLedgerSchema>;
