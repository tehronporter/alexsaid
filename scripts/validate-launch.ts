import readinessJSON from "../content/launch-readiness.json" with { type: "json" };
import catalogJSON from "../src/data/catalog.json" with { type: "json" };
import { launchReadinessSchema } from "../src/domain/launch";
import { quoteCatalogSchema } from "../src/domain/catalog";
import { launchReadinessIssues } from "../src/lib/launch";

const readiness = launchReadinessSchema.parse(readinessJSON);
const catalog = quoteCatalogSchema.parse(catalogJSON);
const issues = launchReadinessIssues(readiness, new Set(catalog.quotes.map(({ id }) => id)));
if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`Public launch gate passed with ${readiness.beta.testers.length} beta testers.`);
