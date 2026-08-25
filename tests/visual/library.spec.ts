import { expect, test } from "@playwright/test";
import catalogJSON from "../../src/data/catalog.json" with { type: "json" };
import { pinClock } from "./pinned-clock";

const completedState = {
  schemaVersion: 1,
  savedIDs: [],
  favoriteCategories: [],
  hideProfanity: true,
  feedScope: "all",
  onboardingComplete: true,
  lastQuoteID: null,
  successfulSwipeCount: 0,
};

test.beforeEach(async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  await page.evaluate((state) => localStorage.setItem("hormozi-said:user-state:v1", JSON.stringify(state)), completedState);
});

for (const [name, path] of [
  ["discover", "/discover"],
  ["saved-empty", "/saved"],
  ["collection", `/collections/${catalogJSON.collections[0].slug}`],
  ["source", `/source/${catalogJSON.quotes[0].id}`],
  ["more", "/more"],
  ["settings", "/settings"],
  ["install", "/install"],
  ["privacy", "/privacy"],
] as const) {
  test(`${name} editorial surface`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

test("onboarding sheet", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto("/app");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  await expect(page).toHaveScreenshot("onboarding.png");
});

test("saved populated library", async ({ page }) => {
  await page.evaluate((quoteID) => {
    const state = JSON.parse(localStorage.getItem("hormozi-said:user-state:v1") ?? "{}");
    localStorage.setItem("hormozi-said:user-state:v1", JSON.stringify({ ...state, savedIDs: [quoteID] }));
  }, catalogJSON.quotes[0].id);
  await page.goto("/saved");
  await expect(page.getByRole("link", { name: /Read quote/ })).toBeVisible();
  await expect(page).toHaveScreenshot("saved-populated.png", { fullPage: true });
});

test("share action list", async ({ page }) => {
  await page.goto(`/q/${catalogJSON.quotes[0].id}`);
  await page.getByRole("button", { name: "Share quote" }).click();
  await expect(page.getByRole("button", { name: "Copy quote" })).toBeVisible();
  await expect(page).toHaveScreenshot("share-actions.png");
});
