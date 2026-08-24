import { z } from "zod";

export const CATALOG_CATEGORIES = [
  "Offers",
  "Leads & Marketing",
  "Sales",
  "Customer Success & Retention",
  "Business Models & Strategy",
  "Operations & Scaling",
  "Leadership & Teams",
  "Decision Making",
  "Productivity & Execution",
  "Mindset & Personal Growth"
] as const;

export const catalogCategorySchema = z.enum(CATALOG_CATEGORIES);

export const tagSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const tagDefinitionSchema = z.object({
  slug: tagSlugSchema,
  label: z.string().trim().min(1),
  definition: z.string().trim().min(12),
  aliases: z.array(tagSlugSchema).default([])
});

export const taxonomySchema = z.object({
  schemaVersion: z.literal(1),
  categories: z.tuple([
    z.literal("Offers"),
    z.literal("Leads & Marketing"),
    z.literal("Sales"),
    z.literal("Customer Success & Retention"),
    z.literal("Business Models & Strategy"),
    z.literal("Operations & Scaling"),
    z.literal("Leadership & Teams"),
    z.literal("Decision Making"),
    z.literal("Productivity & Execution"),
    z.literal("Mindset & Personal Growth")
  ]),
  tags: z.array(tagDefinitionSchema).min(1)
}).superRefine((taxonomy, context) => {
  const slugs = new Set<string>();
  const aliases = new Set<string>();
  for (const tag of taxonomy.tags) {
    if (slugs.has(tag.slug)) context.addIssue({ code: "custom", message: `Duplicate tag: ${tag.slug}`, path: ["tags"] });
    slugs.add(tag.slug);
    for (const alias of tag.aliases) {
      if (aliases.has(alias)) context.addIssue({ code: "custom", message: `Duplicate tag alias: ${alias}`, path: ["tags"] });
      aliases.add(alias);
    }
  }
  for (const alias of aliases) {
    if (slugs.has(alias)) context.addIssue({ code: "custom", message: `Tag alias collides with canonical tag: ${alias}`, path: ["tags"] });
  }
});

export type CatalogCategory = z.infer<typeof catalogCategorySchema>;
export type TagDefinition = z.infer<typeof tagDefinitionSchema>;
export type Taxonomy = z.infer<typeof taxonomySchema>;
