import { expect, test } from "@playwright/test";
import { pinClock } from "./pinned-clock";

const leilaProduct = process.env.SAID_PRODUCT === "leila";
const homePath = leilaProduct ? "/" : "/app";
const stateKey = leilaProduct ? "leila-said:user-state:v1" : "hormozi-said:user-state:v1";

test("branded quote experience", async ({ page }) => {
  await pinClock(page);
  await page.goto(homePath);
  await page.evaluate((storageKey) => localStorage.setItem(storageKey, JSON.stringify({
    schemaVersion: 1,
    savedIDs: [],
    favoriteCategories: [],
    hideProfanity: true,
    feedScope: "all",
    onboardingComplete: true,
    lastQuoteID: null,
    successfulSwipeCount: 0
  })), stateKey);
  await page.reload();
  await expect(page.getByRole("blockquote")).toBeVisible();
  await expect(page).toHaveScreenshot(leilaProduct ? "quote-home-leila.png" : "quote-home.png");
});
