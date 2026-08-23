import { describe, expect, it } from "vitest";
import { launchReadinessSchema } from "@/domain/launch";
import { launchReadinessIssues } from "@/lib/launch";

const quoteID = "10000000-0000-4000-8000-000000000001";

function readiness(worthwhile = true) {
  return launchReadinessSchema.parse({
    schemaVersion: 1,
    beta: {
      startedAt: "2026-08-01T12:00:00.000Z",
      endedAt: "2026-08-08T12:00:00.000Z",
      testers: Array.from({ length: 5 }, (_, index) => ({
        testerCode: `fan-${index + 1}`,
        existingAlexFan: true,
        completedAt: "2026-08-08T12:00:00.000Z",
        paddingConcern: false,
        repetitionConcern: false,
        quoteRatings: [{ quoteID, worthwhile: index === 0 ? worthwhile : true, accuracyConcern: null }]
      }))
    },
    reviews: { allAcceptedQuotesReviewedInUI: true, contentAndAttribution: true, copyright: true, unofficialFanApp: true }
  });
}

describe("public launch readiness", () => {
  it("passes a seven-day, five-fan beta with complete coverage and reviews", () => {
    expect(launchReadinessIssues(readiness(), new Set([quoteID]))).toEqual([]);
  });

  it("blocks unresolved human and quality gates", () => {
    const candidate = readiness(false);
    candidate.beta.endedAt = "2026-08-05T12:00:00.000Z";
    candidate.beta.testers[1].paddingConcern = true;
    candidate.beta.testers[1].quoteRatings[0].worthwhile = false;
    candidate.reviews.copyright = false;
    const issues = launchReadinessIssues(candidate, new Set([quoteID]));
    expect(issues.join(" ")).toContain("seven days");
    expect(issues.join(" ")).toContain("padding");
    expect(issues.join(" ")).toContain("80%");
    expect(issues.join(" ")).toContain("copyright");
  });
});
