import { expect, test } from "@playwright/test";
import alexCatalog from "../../src/data/catalog.json" with { type: "json" };
import leilaCatalog from "../../src/data/leila/catalog.json" with { type: "json" };
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

const leilaProduct = process.env.SAID_PRODUCT === "leila";
const catalogJSON = leilaProduct ? leilaCatalog : alexCatalog;
const homePath = leilaProduct ? "/" : "/app";
const stateKey = leilaProduct ? "leila-said:user-state:v1" : "hormozi-said:user-state:v1";
const snapshot = (name: string) => leilaProduct ? `${name}-leila.png` : `${name}.png`;

test.beforeEach(async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  await page.evaluate(({ state, storageKey }) => localStorage.setItem(storageKey, JSON.stringify(state)), { state: completedState, storageKey: stateKey });
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
    await expect(page).toHaveScreenshot(snapshot(name), { fullPage: true });
  });
}

test("onboarding sheet", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto(homePath);
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  await expect(page).toHaveScreenshot(snapshot("onboarding"));
});

test("saved populated library", async ({ page }) => {
  await page.evaluate(({ quoteID, storageKey }) => {
    const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    localStorage.setItem(storageKey, JSON.stringify({ ...state, savedIDs: [quoteID] }));
  }, { quoteID: catalogJSON.quotes[0].id, storageKey: stateKey });
  await page.goto("/saved");
  await expect(page.getByRole("link", { name: /Read quote/ })).toBeVisible();
  await expect(page).toHaveScreenshot(snapshot("saved-populated"), { fullPage: true });
});

test("share action list", async ({ page }) => {
  await page.goto(`/q/${catalogJSON.quotes[0].id}`);
  await page.getByRole("button", { name: "Share quote" }).click();
  await expect(page.getByRole("button", { name: "Copy quote" })).toBeVisible();
  await expect(page).toHaveScreenshot(snapshot("share-actions"));
});
