import { chromium } from "@playwright/test";
import { readFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const LEILA_CATALOG = JSON.parse(
  await readFile("src/data/leila/catalog.v3.json", "utf8")
);

const outputDir = "/tmp/leila-story-cards";
await mkdir(outputDir, { recursive: true });

const BASE_URL = process.env.LEILA_URL || "https://leilasaid.vercel.app";

console.log("=== Leila Said Story Card Downloader ===\n");
console.log(`URL: ${BASE_URL}`);
console.log(`Quotes to process: ${LEILA_CATALOG.quotes.length}`);
console.log(`Output directory: ${outputDir}\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();

let successful = 0;
let failed = 0;
const failedQuotes: string[] = [];

for (let i = 0; i < LEILA_CATALOG.quotes.length; i++) {
  const quote = LEILA_CATALOG.quotes[i];
  process.stdout.write(`[${i + 1}/${LEILA_CATALOG.quotes.length}] ${quote.id}... `);

  try {
    await page.goto(`${BASE_URL}/q/${quote.id}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(600);

    // Onboarding overlay only appears on first visit per session; dismiss if present
    const gotIt = page.getByRole("button", { name: "Got it" });
    if (await gotIt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotIt.click();
      await page.waitForTimeout(300);
    }

    const shareTrigger = page.getByRole("button", { name: "Share quote" }).first();
    await shareTrigger.waitFor({ state: "visible", timeout: 10000 });
    await shareTrigger.click();
    await page.waitForTimeout(300);

    const storyButton = page.getByRole("button", { name: "Download story card" });
    await storyButton.waitFor({ state: "visible", timeout: 5000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await storyButton.click();
    const download = await downloadPromise;

    const filename = `leila-said-${quote.id}-story.png`;
    await download.saveAs(join(outputDir, filename));
    successful++;
    console.log("done");

    // Close dialog before next navigation to avoid state bleed
    await page.keyboard.press("Escape").catch(() => {});
  } catch (err) {
    failed++;
    failedQuotes.push(quote.id);
    console.log(`FAILED: ${(err as Error).message}`);
  }
}

await browser.close();

console.log(`\n=== Download Complete ===`);
console.log(`Successful: ${successful}`);
console.log(`Failed: ${failed}`);

if (failedQuotes.length > 0) {
  console.log(`\nFailed quote IDs:`);
  failedQuotes.forEach((id) => console.log(`  - ${id}`));
}

const files = await readdir(outputDir);
console.log(`\nFiles in ${outputDir}: ${files.filter((f) => f.endsWith(".png")).length}`);
