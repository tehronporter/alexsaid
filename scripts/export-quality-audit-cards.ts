import { chromium } from "@playwright/test";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { selectedProduct } from "./product-context";

const brand = selectedProduct();
const audit = JSON.parse(await readFile("content/quality-audits/full-catalog-2026-08-30.json", "utf8"));
const catalog = JSON.parse(await readFile(
  brand === "alex" ? "src/data/catalog.v3.json" : "src/data/leila/catalog.v3.json",
  "utf8"
));
const quoteByID = new Map(catalog.quotes.map((quote: { id: string }) => [quote.id, quote]));
const allRescueIDs = audit.records
  .filter((record: { brand: string; decision: string }) => record.brand === brand && record.decision === "rescue")
  .map((record: { replacement: { quoteID: string } }) => record.replacement.quoteID);
const rescueIDs = process.env.QC_QUOTE_ID ? allRescueIDs.filter((id: string) => id === process.env.QC_QUOTE_ID) : allRescueIDs;
if (process.env.QC_QUOTE_ID && rescueIDs.length !== 1) throw new Error(`QC_QUOTE_ID is not an approved ${brand} rescue`);
for (const id of rescueIDs) {
  if (!quoteByID.has(id)) throw new Error(`Approved rescue ${id} is not in the ${brand} catalog`);
}

const baseURL = process.env.QC_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = `/tmp/quote-qc-cards/${brand}`;
const prefix = brand === "alex" ? "hormozi-said" : "leila-said";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 720 } });
await context.addInitScript(() => {
  window.localStorage.setItem("hormozi-said:user-state:v1", JSON.stringify({
    schemaVersion: 1,
    savedIDs: [],
    favoriteCategories: [],
    hideProfanity: true,
    feedScope: "all",
    onboardingComplete: true,
    lastQuoteID: null,
    successfulSwipeCount: 0
  }));
});
const page = await context.newPage();
const failures: Array<{ id: string; message: string }> = [];

for (const [index, id] of rescueIDs.entries()) {
  process.stdout.write(`[${index + 1}/${rescueIDs.length}] ${id}... `);
  try {
    await page.goto(`${baseURL}/q/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_500);
    const gotIt = page.getByRole("button", { name: "Got it" });
    if (await gotIt.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await gotIt.click();
      await page.waitForTimeout(500);
    }
    const share = page.getByRole("button", { name: "Share quote" }).first();
    await share.waitFor({ state: "visible", timeout: 10_000 });
    await share.click();
    const story = page.getByRole("button", { name: "Download story card" });
    await story.waitFor({ state: "visible", timeout: 5_000 });
    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await story.click();
    const download = await downloadPromise;
    await download.saveAs(join(outputDir, `${prefix}-${id}-story.png`));
    await page.keyboard.press("Escape").catch(() => undefined);
    console.log("done");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ id, message });
    console.log(`FAILED: ${message}`);
  }
}

await browser.close();
const files = (await readdir(outputDir)).filter((file) => file.endsWith(".png"));
console.log(JSON.stringify({ brand, expected: rescueIDs.length, exported: files.length, failures, outputDir }, null, 2));
if (failures.length || files.length !== rescueIDs.length) process.exitCode = 1;
