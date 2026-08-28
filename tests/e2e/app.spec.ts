import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import alexCatalog from "../../src/data/catalog.json" with { type: "json" };
import leilaCatalog from "../../src/data/leila/catalog.json" with { type: "json" };

const productionPWA = Boolean(process.env.CI || process.env.E2E_PRODUCTION);
const leilaProduct = process.env.SAID_PRODUCT === "leila";
const catalogJSON = leilaProduct ? leilaCatalog : alexCatalog;
const homePath = leilaProduct ? "/" : "/app";
const stateKey = leilaProduct ? "leila-said:user-state:v1" : "hormozi-said:user-state:v1";

test.beforeEach(async ({ page }) => {
  await page.goto(homePath);
  await page.evaluate((storageKey) => {
    localStorage.clear();
    localStorage.setItem(storageKey, JSON.stringify({
      schemaVersion: 1,
      savedIDs: [],
      favoriteCategories: [],
      hideProfanity: true,
      feedScope: "all",
      onboardingComplete: true,
      lastQuoteID: null,
      successfulSwipeCount: 0
    }));
  }, stateKey);
  await page.reload();
  await expect(page.getByRole("button", { name: "Skip" })).not.toBeVisible();
  await expect(page.locator("main.quote-surface")).toHaveAttribute("data-interactive", "true");
  await expect(page.locator("main.quote-surface")).toHaveAttribute("data-catalog-ready", "true");
});

test("deployment root preserves its canonical product entry", async ({ page }) => {
  await page.goto("/");
  if (leilaProduct) {
    await expect(page).toHaveTitle(/Leila Said/);
    await expect(page.locator("main.quote-surface")).toBeVisible();
    await expect(page.getByRole("blockquote")).toBeVisible();
    await page.goto("/app");
    await expect(page).toHaveURL(/\/$/);
    return;
  }
  await expect(page).toHaveTitle("Alex Said · A Case Study by Tehron Porter");
  await expect(page.getByRole("heading", { name: /I didn’t just apply/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "View full portfolio" })).toHaveAttribute("href", "https://tehron.vercel.app");
  await expect(page.getByRole("link", { name: "Download resume" })).toHaveAttribute("href", "/tehron-porter-resume.pdf");
  await page.getByRole("link", { name: "View the live app" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator("main.quote-surface")).toBeVisible();
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
  await page.keyboard.press("ArrowDown");
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
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").successfulSwipeCount, stateKey)).toBe(0);
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
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").successfulSwipeCount, stateKey)).toBe(1);
});

test("quote controls stay focused and three successful swipes teach the gesture", async ({ page }) => {
  const stage = page.locator(".quote-stage");
  const swipe = async () => stage.evaluate((element) => {
    const dispatchTouch = (type: string, clientY: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, "changedTouches", { value: [{ clientY }] });
      element.dispatchEvent(event);
    };
    dispatchTouch("touchstart", 700);
    dispatchTouch("touchend", 300);
  });

  const actions = page.getByTestId("quote-actions");
  await expect(actions.getByRole("button", { name: "Save quote" })).toBeVisible();
  await expect(actions.getByRole("button", { name: "Share quote" })).toBeVisible();
  await expect(actions.getByRole("link", { name: "View quote source" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Previous quote|Next quote/ })).toHaveCount(0);
  await expect(page.getByText("Arrow keys")).toHaveCount(0);
  const hint = page.locator(".swipe-hint");
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await expect(hint).toBeVisible();
  } else {
    await expect(hint).not.toBeVisible();
  }

  await swipe();
  await swipe();
  await swipe();
  await expect(hint).not.toBeVisible();
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").successfulSwipeCount, stateKey)).toBe(3);
  await page.reload();
  await expect(page.getByRole("main").locator(".swipe-hint")).not.toBeVisible();
});

test("reduced motion removes the learned swipe hint immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate((storageKey) => {
    const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    localStorage.setItem(storageKey, JSON.stringify({ ...state, successfulSwipeCount: 2 }));
  }, stateKey);
  await page.reload();
  await page.locator(".quote-stage").evaluate((element) => {
    const dispatchTouch = (type: string, clientY: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, "changedTouches", { value: [{ clientY }] });
      element.dispatchEvent(event);
    };
    dispatchTouch("touchstart", 700);
    dispatchTouch("touchend", 300);
  });
  const hint = page.locator(".swipe-hint");
  await expect(hint).not.toBeVisible();
  await expect(hint).toHaveCSS("transition-duration", "0s");
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
  const search = page.getByRole("searchbox", { name: "Search quotes" });
  await expect(search).toHaveCount(1);
  const matchingQuote = catalogJSON.quotes[0];
  const searchTerm = matchingQuote.text.replace(/[^a-zA-Z0-9' ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
  await search.fill(searchTerm);
  await expect(page.getByText(matchingQuote.text)).toBeVisible();
  await page.getByText(matchingQuote.text).click();
  await expect(page).toHaveURL(/\/q\/[0-9a-f-]{36}$/);
  await expect(page.locator("main.quote-surface blockquote")).toHaveText(matchingQuote.text);
});

test("source action matches the visible quote", async ({ page }) => {
  const quote = await page.getByRole("blockquote").textContent();
  await page.getByRole("link", { name: "View quote source" }).click();
  await expect(page.getByRole("blockquote")).toHaveText(quote ?? "");
});

test("every accepted quote stays exact across library, saved, source, and sharing views", async ({ page, context }) => {
  // This intentionally walks every accepted quote and can take several minutes
  // for Alex's full catalog on constrained CI runners.
  test.setTimeout(420_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const quote of catalogJSON.quotes) {
    await page.goto(`/q/${quote.id}`);
    await expect(page.getByRole("blockquote")).toHaveText(quote.text);
    await page.getByRole("button", { name: "Share quote" }).click();
    await page.getByRole("button", { name: "Copy quote" }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`“${quote.text}” — ${quote.author}`);
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "View quote source" }).click();
    await expect(page.getByRole("blockquote")).toHaveText(quote.text);
    await expect(page.getByRole("link", { name: /^(Read|Listen to|Watch) original$/ })).toHaveAttribute("href", quote.sourceURL);
  }

  await page.goto("/discover");
  const search = page.getByRole("searchbox", { name: "Search quotes" });
  for (const category of catalogJSON.categories) {
    await search.fill(category);
    for (const quote of catalogJSON.quotes.filter((item) => item.primaryCategory === category)) {
      await expect(page.getByText(quote.text)).toBeVisible();
    }
  }

  await page.evaluate(({ savedIDs, storageKey }) => {
    const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    localStorage.setItem(storageKey, JSON.stringify({ ...state, schemaVersion: 1, savedIDs }));
  }, { savedIDs: catalogJSON.quotes.map(({ id }) => id), storageKey: stateKey });
  await page.goto("/saved");
  for (const quote of catalogJSON.quotes) await expect(page.getByText(quote.text)).toBeVisible();
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
  await page.goto(homePath);

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
  await expect(page.getByRole("button", { name: "Notify me daily" })).not.toBeVisible();
});

test("local-data export and reset include the learned-swipe state", async ({ page }) => {
  await page.evaluate((storageKey) => {
    const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    localStorage.setItem(storageKey, JSON.stringify({ ...state, successfulSwipeCount: 3 }));
  }, stateKey);
  await page.goto("/settings");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8")).successfulSwipeCount).toBe(3);

  await page.getByRole("button", { name: "Reset all app data" }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").successfulSwipeCount, stateKey)).toBe(0);
});

test("key screens have no serious accessibility violations", async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of ["/", "/app", "/discover", "/saved", `/source/${catalogJSON.quotes[0].id}`, "/install", "/more", "/settings", "/privacy"]) {
    await page.goto(path);
    // Let quote entrance transitions settle before axe computes color contrast.
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")), `Accessibility violations on ${path}`).toEqual([]);
  }
});

test("editorial surfaces preserve the branded quote and dark library distinction", async ({ page }) => {
  await page.goto(homePath);
  await expect(page.locator("main")).toHaveClass(/quote-surface/);
  await expect(page.locator('[data-surface="quote"]')).toBeVisible();
  await expect(page.locator("main.quote-surface")).toHaveCSS("background-color", leilaProduct ? "rgb(255, 255, 255)" : "rgb(107, 44, 255)");
  await page.goto("/discover");
  await expect(page.locator('[data-surface="library"]')).toBeVisible();
  await expect(page.locator("main")).not.toHaveClass(/quote-surface/);
});
