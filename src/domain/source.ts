import { z } from "zod";
import { sourceTypeSchema } from "@/domain/catalog";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTimeSchema = z.string().datetime({ offset: true });

export const sourceProviderSchema = z.enum([
  "the-game-rss",
  "build-rss",
  "youtube",
  "x",
  "acquisition-com",
  "third-party"
]);

export const sourceStatusSchema = z.enum([
  "discovered",
  "ready",
  "mined",
  "reviewed",
  "excluded",
  "blocked"
]);

export const sourceRecordSchema = z.object({
  sourceID: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  externalID: z.string().trim().min(1),
  provider: sourceProviderSchema,
  sourceType: sourceTypeSchema,
  title: z.string().trim().min(1),
  publisher: z.string().trim().min(1),
  publishedAt: isoDateSchema.nullable(),
  durationSeconds: z.number().int().positive().nullable(),
  canonicalURL: z.string().url(),
  mediaURL: z.string().url().nullable(),
  transcriptURL: z.string().url().nullable(),
  transcriptChecksum: z.string().regex(/^sha256:[a-f0-9]{64}$/).nullable(),
  retrievedAt: isoDateTimeSchema,
  discoveryMethod: z.string().trim().min(3),
  status: sourceStatusSchema,
  exclusionReason: z.string().trim().min(3).nullable(),
  blockingReason: z.string().trim().min(3).nullable()
}).superRefine((source, context) => {
  if (source.status === "excluded" && !source.exclusionReason) context.addIssue({ code: "custom", message: "Excluded sources require an exclusion reason", path: ["exclusionReason"] });
  if (source.status === "blocked" && !source.blockingReason) context.addIssue({ code: "custom", message: "Blocked sources require a blocking reason", path: ["blockingReason"] });
  if (source.status === "ready" && !source.transcriptURL) context.addIssue({ code: "custom", message: "Ready sources require a transcript URL", path: ["transcriptURL"] });
  if (source.status === "reviewed" && !source.publishedAt) context.addIssue({ code: "custom", message: "Reviewed sources require a confirmed publication date", path: ["publishedAt"] });
});

export const sourceShardSchema = z.object({
  schemaVersion: z.literal(1),
  provider: sourceProviderSchema,
  year: z.number().int().min(2000).max(2100).nullable(),
  updatedAt: isoDateTimeSchema,
  sources: z.array(sourceRecordSchema)
});

export type SourceProvider = z.infer<typeof sourceProviderSchema>;
export type SourceStatus = z.infer<typeof sourceStatusSchema>;
export type SourceRecord = z.infer<typeof sourceRecordSchema>;
export type SourceShard = z.infer<typeof sourceShardSchema>;
