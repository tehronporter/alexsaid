import { readFile } from "node:fs/promises";

const report = JSON.parse(await readFile("test-results/lighthouse.json", "utf8"));
const performance = Math.round((report.categories.performance?.score ?? 0) * 100);
const accessibility = Math.round((report.categories.accessibility?.score ?? 0) * 100);

console.log(`Lighthouse: performance ${performance}, accessibility ${accessibility}`);
if (performance < 90 || accessibility < 95) {
  throw new Error("Lighthouse release thresholds were not met (performance >= 90, accessibility >= 95).");
}
