import { expect, test } from "@playwright/test";
import { pinClock } from "./pinned-clock";

test("purple-first quote experience", async ({ page }) => {
  await pinClock(page);
  await page.goto("/app");
  await page.evaluate(() => localStorage.setItem("hormozi-said:user-state:v1", JSON.stringify({
    schemaVersion: 1,
    savedIDs: [],
    favoriteCategories: [],
    hideProfanity: true,
    feedScope: "all",
    onboardingComplete: true,
    lastQuoteID: null,
    successfulSwipeCount: 0
  })));
  await page.reload();
  await expect(page.getByRole("blockquote")).toBeVisible();
  await expect(page).toHaveScreenshot("quote-home.png");
});
