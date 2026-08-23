import { z } from "zod";

export const sourceTypeSchema = z.enum([
  "podcast",
  "video",
  "article",
  "book",
  "social",
  "other"
]);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTimeSchema = z.string().datetime({ offset: true });

export const quoteSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(3).max(420),
  author: z.string().trim().min(1),
  primaryCategory: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
  sourceType: sourceTypeSchema,
  sourceTitle: z.string().trim().min(1).nullable(),
  sourceURL: z.string().url().nullable(),
  sourceDate: isoDateSchema.nullable(),
  sourceTimestampSeconds: z.number().int().nonnegative().nullable(),
  verified: z.boolean(),
  featured: z.boolean(),
  containsProfanity: z.boolean(),
  context: z.string().trim().min(1).nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  shortVersion: z.string().trim().min(1).max(140).optional(),
  shareCardVersion: z.string().trim().min(1).max(260).optional()
});

export const collectionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  quoteIDs: z.array(z.string().uuid()),
  displayOrder: z.number().int().nonnegative()
});

export const quoteCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: isoDateTimeSchema,
  developmentFixture: z.boolean(),
  categories: z.array(z.string().trim().min(1)).min(1),
  collections: z.array(collectionSchema),
  quotes: z.array(quoteSchema).min(1)
});

export type Quote = z.infer<typeof quoteSchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type QuoteCatalogV1 = z.infer<typeof quoteCatalogSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;

export interface QuoteRepository {
  getAll(): readonly Quote[];
  getById(id: string): Quote | undefined;
  search(query: string): readonly Quote[];
  getByCategory(category: string): readonly Quote[];
  getCollection(slug: string): Collection | undefined;
}

export const localUserStateSchema = z.object({
  schemaVersion: z.literal(1),
  savedIDs: z.array(z.string().uuid()),
  favoriteCategories: z.array(z.string()),
  hideProfanity: z.boolean(),
  feedScope: z.enum(["all", "favorite-topics"]),
  onboardingComplete: z.boolean(),
  lastQuoteID: z.string().uuid().nullable()
});

export type LocalUserStateV1 = z.infer<typeof localUserStateSchema>;

export const pushPayloadSchema = z.object({
  version: z.literal(1),
  quoteID: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().regex(/^\/q\/[0-9a-f-]+$/),
  icon: z.string().startsWith("/")
});

export type PushPayload = z.infer<typeof pushPayloadSchema>;

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  timezone: string;
  localTime: string;
  topics: readonly string[];
  active: boolean;
  lastSentLocalDate: string | null;
}

export interface PushSubscriptionRepository {
  subscribe(record: PushSubscriptionRecord): Promise<void>;
  updatePreferences(id: string, update: Pick<PushSubscriptionRecord, "timezone" | "localTime" | "topics">): Promise<void>;
  unsubscribe(id: string): Promise<void>;
  findDue(now: Date): Promise<readonly PushSubscriptionRecord[]>;
  recordDelivery(id: string, localDate: string): Promise<void>;
}
