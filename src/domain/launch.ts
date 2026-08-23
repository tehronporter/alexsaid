import { z } from "zod";

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const launchReadinessSchema = z.object({
  schemaVersion: z.literal(1),
  beta: z.object({
    startedAt: isoDateTimeSchema.nullable(),
    endedAt: isoDateTimeSchema.nullable(),
    testers: z.array(z.object({
      testerCode: z.string().regex(/^[a-z0-9-]+$/),
      existingAlexFan: z.literal(true),
      completedAt: isoDateTimeSchema,
      paddingConcern: z.boolean(),
      repetitionConcern: z.boolean(),
      quoteRatings: z.array(z.object({
        quoteID: z.string().uuid(),
        worthwhile: z.boolean(),
        accuracyConcern: z.string().trim().min(1).nullable()
      })).min(1)
    }))
  }),
  reviews: z.object({
    allAcceptedQuotesReviewedInUI: z.boolean(),
    contentAndAttribution: z.boolean(),
    copyright: z.boolean(),
    unofficialFanApp: z.boolean()
  })
});

export type LaunchReadiness = z.infer<typeof launchReadinessSchema>;
