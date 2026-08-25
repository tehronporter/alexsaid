import { expect, test } from "@playwright/test";
import catalogJSON from "../../src/data/catalog.json" with { type: "json" };
import { pinClock, settleAnimations } from "./pinned-clock";

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

const quotesByLength = [...catalogJSON.quotes].sort((left, right) => left.text.trim().length - right.text.trim().length);
const shortestQuote = quotesByLength[0]!;
const middleQuote = quotesByLength[Math.floor(quotesByLength.length / 2)]!;
const longestQuote = quotesByLength.at(-1)!;
const reviewQuotes = [
  ["short", shortestQuote],
  ["medium", middleQuote],
  ["long", longestQuote],
] as const;

test.beforeEach(async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  await page.evaluate((state) => localStorage.setItem("hormozi-said:user-state:v1", JSON.stringify(state)), completedState);
});

for (const [label, quote] of reviewQuotes) {
  test(`${label} quote stays clear of controls and navigation`, async ({ page }, testInfo) => {
    test.skip(!["iphone-se", "modern-iphone", "large-iphone"].includes(testInfo.project.name));
    await page.goto(`/q/${quote.id}`);
    await expect(page.getByTestId("quote-text")).toHaveText(quote.text);
    await settleAnimations(page);

    const boxes = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        header: box('[data-testid="quote-header"]'),
        text: box('[data-testid="quote-text"]'),
        author: box('[data-testid="quote-author"]'),
        actions: box('[data-testid="quote-actions"]'),
        navigation: box('nav.fixed[aria-label="Primary navigation"]'),
      };
    });

    expect(boxes.documentWidth).toBeLessThanOrEqual(boxes.viewportWidth);
    expect(boxes.header?.bottom ?? 0).toBeLessThan(boxes.text?.top ?? 0);
    expect(boxes.text?.bottom ?? 0).toBeLessThan(boxes.author?.top ?? 0);
    expect(boxes.author?.bottom ?? 0).toBeLessThan(boxes.actions?.top ?? 0);
    expect(boxes.actions?.bottom ?? 0).toBeLessThanOrEqual(boxes.navigation?.top ?? Number.POSITIVE_INFINITY);
    await expect(page).toHaveScreenshot(`${label}-quote.png`);
  });
}

test("learned swipe state removes the hint", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "modern-iphone");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("hormozi-said:user-state:v1") ?? "{}");
    localStorage.setItem("hormozi-said:user-state:v1", JSON.stringify({ ...state, successfulSwipeCount: 3 }));
  });
  await page.goto(`/q/${shortestQuote.id}`);
  await expect(page.locator(".swipe-hint")).not.toBeVisible();
  await expect(page).toHaveScreenshot("swipe-learned.png");
});
