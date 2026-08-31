import { z } from "zod";
import { catalogCategorySchema } from "@/domain/taxonomy";

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

export const mediaSourceLocatorSchema = z.object({
  kind: z.literal("media"),
  startSeconds: z.number().int().nonnegative(),
  endSeconds: z.number().int().positive().optional()
}).refine(({ endSeconds, startSeconds }) => endSeconds === undefined || endSeconds > startSeconds, {
  message: "Media end time must be after its start time",
  path: ["endSeconds"]
});

export const bookSourceLocatorSchema = z.object({
  kind: z.literal("book"),
  edition: z.string().trim().min(1),
  publisher: z.string().trim().min(1),
  publicationYear: z.number().int().min(1900).max(2100),
  isbn: z.string().trim().min(10).optional(),
  chapter: z.string().trim().min(1),
  page: z.number().int().positive().optional(),
  digitalLocation: z.string().trim().min(1).optional()
}).refine(({ digitalLocation, page }) => page !== undefined || digitalLocation !== undefined, {
  message: "Book sources require a page or digital location",
  path: ["page"]
});

export const webSourceLocatorSchema = z.object({
  kind: z.literal("web"),
  section: z.string().trim().min(1).optional(),
  postID: z.string().trim().min(1).optional()
});

export const sourceLocatorSchema = z.union([
  mediaSourceLocatorSchema,
  bookSourceLocatorSchema,
  webSourceLocatorSchema
]);

export const quoteSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(3).max(420),
  author: z.string().trim().min(1),
  primaryCategory: catalogCategorySchema,
  tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(2).max(5),
  sourceType: sourceTypeSchema,
  sourceTitle: z.string().trim().min(1).nullable(),
  sourceURL: z.string().url().nullable(),
  sourceDate: isoDateSchema.nullable(),
  sourceLocator: sourceLocatorSchema,
  verified: z.boolean(),
  verificationStandard: z.enum(["direct-source-twice", "official-transcript-reviewed"]).default("direct-source-twice"),
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
  schemaVersion: z.literal(2),
  generatedAt: isoDateTimeSchema,
  developmentFixture: z.boolean(),
  categories: z.array(z.string().trim().min(1)).min(1),
  collections: z.array(collectionSchema),
  quotes: z.array(quoteSchema).min(1)
});

export const publicSourceSchema = z.object({
  sourceID: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceType: sourceTypeSchema,
  title: z.string().trim().min(1),
  publisher: z.string().trim().min(1),
  publishedAt: isoDateSchema,
  canonicalURL: z.string().url(),
  mediaURL: z.string().url().nullable(),
  transcriptURL: z.string().url().nullable(),
  durationSeconds: z.number().int().positive().nullable()
});

export const publicQuoteV3Schema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(3).max(420),
  author: z.enum(["Alex Hormozi", "Leila Hormozi"]),
  primaryCategory: catalogCategorySchema,
  tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(2).max(5),
  sourceID: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceLocator: sourceLocatorSchema,
  verified: z.literal(true),
  verificationStandard: z.enum(["direct-source-twice", "official-transcript-reviewed"]),
  featured: z.boolean(),
  containsProfanity: z.boolean(),
  context: z.string().trim().min(1).nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  shortVersion: z.string().trim().min(1).max(140).optional(),
  shareCardVersion: z.string().trim().min(1).max(260).optional()
});

export const quoteCatalogV3Schema = z.object({
  schemaVersion: z.literal(3),
  generatedAt: isoDateTimeSchema,
  developmentFixture: z.boolean(),
  categories: z.array(catalogCategorySchema).min(1),
  collections: z.array(collectionSchema),
  sources: z.array(publicSourceSchema).min(1),
  quotes: z.array(publicQuoteV3Schema).min(1)
}).superRefine((catalog, context) => {
  const sourceIDs = new Set(catalog.sources.map((source) => source.sourceID));
  for (const [index, quote] of catalog.quotes.entries()) {
    if (!sourceIDs.has(quote.sourceID)) context.addIssue({ code: "custom", message: `Unknown sourceID: ${quote.sourceID}`, path: ["quotes", index, "sourceID"] });
  }
});

export type Quote = z.infer<typeof quoteSchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type QuoteCatalogV2 = z.infer<typeof quoteCatalogSchema>;
export type PublicSource = z.infer<typeof publicSourceSchema>;
export type PublicQuoteV3 = z.infer<typeof publicQuoteV3Schema>;
export type QuoteCatalogV3 = z.infer<typeof quoteCatalogV3Schema>;
/** @deprecated Use QuoteCatalogV2. Kept as a source-compatible alias for app code. */
export type QuoteCatalogV1 = QuoteCatalogV2;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type SourceLocator = z.infer<typeof sourceLocatorSchema>;

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
  lastQuoteID: z.string().uuid().nullable(),
  successfulSwipeCount: z.number().int().min(0).max(3).default(0),
  navigationOnboardingVersion: z.number().int().min(0).max(2).default(0)
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
