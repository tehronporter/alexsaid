import type { LaunchReadiness } from "@/domain/launch";

const sevenDays = 7 * 24 * 60 * 60 * 1000;

export function launchReadinessIssues(readiness: LaunchReadiness, publicQuoteIDs: ReadonlySet<string>) {
  const issues: string[] = [];
  const { beta, reviews } = readiness;
  if (!beta.startedAt || !beta.endedAt) issues.push("A completed seven-day private beta is required");
  else if (new Date(beta.endedAt).getTime() - new Date(beta.startedAt).getTime() < sevenDays) issues.push("Private beta must run for at least seven days");

  const testerCodes = new Set(beta.testers.map(({ testerCode }) => testerCode));
  if (testerCodes.size < 5) issues.push(`At least five existing Alex Hormozi fans must complete beta feedback; found ${testerCodes.size}`);
  if (testerCodes.size !== beta.testers.length) issues.push("Beta tester codes must be unique");
  if (beta.testers.some(({ paddingConcern }) => paddingConcern)) issues.push("A beta tester identified catalog padding");
  if (beta.testers.some(({ repetitionConcern }) => repetitionConcern)) issues.push("A beta tester identified excessive repetition");

  const ratings = beta.testers.flatMap(({ quoteRatings }) => quoteRatings);
  const invalidIDs = ratings.filter(({ quoteID }) => !publicQuoteIDs.has(quoteID)).map(({ quoteID }) => quoteID);
  if (invalidIDs.length > 0) issues.push(`Beta feedback references unknown quote IDs: ${[...new Set(invalidIDs)].join(", ")}`);
  if (ratings.some(({ accuracyConcern }) => accuracyConcern)) issues.push("Beta feedback contains an unresolved accuracy concern");
  const ratedIDs = new Set(ratings.map(({ quoteID }) => quoteID));
  const unrated = [...publicQuoteIDs].filter((id) => !ratedIDs.has(id));
  if (unrated.length > 0) issues.push(`${unrated.length} public quotes have no beta rating`);
  const worthwhileRate = ratings.length === 0 ? 0 : ratings.filter(({ worthwhile }) => worthwhile).length / ratings.length;
  if (worthwhileRate < 0.8) issues.push(`Worthwhile beta rating must be at least 80%; found ${(worthwhileRate * 100).toFixed(1)}%`);

  for (const [review, complete] of Object.entries(reviews)) {
    if (!complete) issues.push(`Launch review is incomplete: ${review}`);
  }
  return issues;
}
