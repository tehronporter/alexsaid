import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const productionPWA = Boolean(process.env.CI || process.env.E2E_PRODUCTION);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("hormozi-said:user-state:v1", JSON.stringify({
      schemaVersion: 1,
      savedIDs: [],
      favoriteCategories: [],
      hideProfanity: true,
      feedScope: "all",
      onboardingComplete: true,
      lastQuoteID: null
    }));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Skip" })).not.toBeVisible();
});

test("first quote renders behind skippable onboarding", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("blockquote")).toBeVisible();
  const skip = page.getByRole("button", { name: "Skip" });
  await expect(skip).toBeVisible();
  await skip.click();
  await expect(skip).not.toBeVisible();
});

test("quote navigation keeps an exact canonical ID", async ({ page }) => {
  await expect(page.getByRole("blockquote")).toBeVisible();
  await page.getByRole("button", { name: "Next quote" }).click();
  await expect(page).toHaveURL(/\/q\/[0-9a-f-]{36}$/);
  const firstQuote = await page.getByRole("blockquote").textContent();
  const firstURL = page.url();
  await page.keyboard.press("ArrowDown");
  await expect(page).not.toHaveURL(firstURL);
  await page.goBack();
  await expect(page).toHaveURL(firstURL);
  await expect(page.getByRole("blockquote")).toHaveText(firstQuote ?? "");
  await page.reload();
  await expect(page.getByRole("blockquote")).toHaveText(firstQuote ?? "");
});

test("vertical swipe advances the exact quote", async ({ page }) => {
  const before = await page.getByRole("blockquote").textContent();
  await page.locator("main section").evaluate((element) => {
    const dispatchTouch = (type: string, clientY: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, "changedTouches", { value: [{ clientY }] });
      element.dispatchEvent(event);
    };
    dispatchTouch("touchstart", 700);
    dispatchTouch("touchend", 300);
  });
  await expect(page).toHaveURL(/\/q\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("blockquote")).not.toHaveText(before ?? "");
});

test("saved quotes persist after reload", async ({ page }) => {
  await page.getByRole("button", { name: "Save quote" }).click();
  await page.getByRole("link", { name: "Saved" }).click();
  await expect(page).toHaveURL(/\/saved$/);
  await expect(page.locator("main").getByRole("link", { name: /Read quote/ })).toBeVisible();
  await page.reload();
  await expect(page.locator("main").getByRole("link", { name: /Read quote/ })).toBeVisible();
});

test("discover search opens the matching quote", async ({ page }) => {
  await page.goto("/discover");
  const search = page.getByRole("textbox", { name: "Search quotes" });
  await expect(search).toHaveCount(1);
  await search.fill("volume");
  await expect(page.getByText("Volume negates luck.")).toBeVisible();
  await page.getByText("Volume negates luck.").click();
  await expect(page.getByRole("blockquote")).toContainText("Volume negates luck");
});

test("source action matches the visible quote", async ({ page }) => {
  const quote = await page.getByRole("blockquote").textContent();
  await page.getByRole("link", { name: "View quote source" }).click();
  await expect(page.getByRole("blockquote")).toHaveText(quote ?? "");
});

test("direct and invalid quote links resolve intentionally", async ({ page }) => {
  const exactURL = await page.getByRole("link", { name: "View quote source" }).getAttribute("href");
  const quoteID = exactURL?.split("/").at(-1);
  expect(quoteID).toBeTruthy();

  await page.goto(`/q/${quoteID}`);
  await expect(page.getByRole("blockquote")).toBeVisible();

  await page.goto("/q/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "Idea not found." })).toBeVisible();
});

test("a warmed quote and saved view remain usable offline", async ({ page, context }) => {
  test.skip(!productionPWA, "Production asset hashes are required for a meaningful offline check.");
  await page.evaluate(async () => {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker did not become ready")), 15_000))
    ]);
  });
  await page.getByRole("button", { name: "Save quote" }).click();
  await page.goto("/saved");
  await expect(page.locator("main").getByRole("link", { name: /Read quote/ })).toBeVisible();
  await page.goto("/");

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("blockquote")).toBeVisible();
  await page.goto("/saved", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").getByRole("link", { name: /Read quote/ })).toBeVisible();
  await context.setOffline(false);
});

test("install page explains current platform capability", async ({ page }) => {
  await page.goto("/install");
  await expect(page.getByText(/Install this app|Install on iPhone or iPad|Already installed/).last()).toBeVisible();
  await expect(page.getByText("Daily notifications are not active yet.")).toBeVisible();
});

test("key screens have no serious accessibility violations", async ({ page }) => {
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
