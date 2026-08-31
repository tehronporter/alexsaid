import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settleAnimations } from "../visual/pinned-clock";
import alexCatalog from "../../src/data/catalog.json" with { type: "json" };
import leilaCatalog from "../../src/data/leila/catalog.json" with { type: "json" };

const productionPWA = Boolean(process.env.CI || process.env.E2E_PRODUCTION);
const leilaProduct = process.env.SAID_PRODUCT === "leila";
const catalogJSON = leilaProduct ? leilaCatalog : alexCatalog;
const homePath = leilaProduct ? "/" : "/app";
const stateKey = leilaProduct ? "leila-said:user-state:v1" : "hormozi-said:user-state:v1";

/**
 * The whole app sits behind a `next/dynamic` boundary (src/components/product-root.tsx),
 * so during hydration the server-rendered tree and a freshly client-rendered tree briefly
 * coexist and `main.quote-surface` matches two elements. Playwright does NOT retry strict
 * mode violations, so a plain `expect(locator)` aborts on that transient state instead of
 * waiting it out. Polling the DOM tolerates the double mount, and asserting exactly one
 * main is a guarantee the suite did not previously make.
 */
async function waitForQuoteSurface(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const mains = [...document.querySelectorAll("main.quote-surface")];
    if (mains.length !== 1) return `mains:${mains.length}`;
    return `${mains[0].getAttribute("data-catalog-ready")}|${mains[0].getAttribute("data-interactive")}`;
  })).toBe("true|true");
}

/**
 * A deterministic, catalog-derived sample covering every data shape the share/copy/source
 * path branches on: non-ASCII text (the clipboard string wraps it in smart quotes), each
 * `sourceType` (which picks the Read/Listen to/Watch link label), each `sourceLocator.kind`
 * (`media` appends ?t=Ns to the href, `web` does not), each category, and both length
 * extremes. Derived rather than a hardcoded id list so it self-maintains as content
 * changes; `the sampled quotes cover every source shape` fails if a new shape appears.
 */
function stratifiedQuoteSample(quotes: typeof catalogJSON.quotes) {
  const picked = new Map<string, (typeof quotes)[number]>();
  const add = (quote?: (typeof quotes)[number]) => { if (quote) picked.set(quote.id, quote); };
  // Group by the *set* of non-ASCII codepoints present rather than taking every quote
  // that has any: the catalog's 17 non-ASCII quotes reduce to 4 distinct signatures
  // (U+2019; U+2014; U+201C/D; and all three together, where a quote already containing
  // curly double quotes gets wrapped in them again). Two per signature covers the
  // variance the clipboard format can actually trip on.
  const nonASCIISignature = (text: string) =>
    [...new Set([...text].filter((character) => (character.codePointAt(0) ?? 0) > 0x7f))].sort().join("");
  const bySignature = new Map<string, (typeof quotes)[number][]>();
  for (const quote of quotes) {
    const signature = nonASCIISignature(quote.text);
    if (!signature) continue;
    bySignature.set(signature, [...(bySignature.get(signature) ?? []), quote]);
  }
  for (const group of bySignature.values()) group.slice(0, 2).forEach(add);
  for (const sourceType of new Set(quotes.map((quote) => quote.sourceType))) {
    quotes.filter((quote) => quote.sourceType === sourceType).slice(0, 3).forEach(add);
  }
  for (const kind of new Set(quotes.map((quote) => quote.sourceLocator?.kind))) {
    quotes.filter((quote) => quote.sourceLocator?.kind === kind).slice(0, 2).forEach(add);
  }
  for (const category of new Set(quotes.map((quote) => quote.primaryCategory))) {
    add(quotes.find((quote) => quote.primaryCategory === category));
  }
  const byLength = [...quotes].sort((a, b) => a.text.length - b.text.length);
  add(byLength[0]);
  add(byLength.at(-1));
  return [...picked.values()];
}

async function swipeQuote(stage: Locator, direction: "up" | "down" = "up") {
  await stage.evaluate((element, swipeDirection) => {
    const [startY, endY] = swipeDirection === "up" ? [700, 300] : [300, 700];
    const dispatchPointer = (type: string, clientY: number) => {
      element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, pointerType: "touch", clientY, button: 0 }));
    };
    dispatchPointer("pointerdown", startY);
    dispatchPointer("pointermove", (startY + endY) / 2);
    dispatchPointer("pointerup", endY);
  }, direction);
}

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
      successfulSwipeCount: 0,
      navigationOnboardingVersion: 0
    }));
  }, stateKey);
  await page.reload();
  await expect(page.getByRole("button", { name: "Skip" })).not.toBeVisible();
  await waitForQuoteSurface(page);
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
  await waitForQuoteSurface(page);
  // CSS locator, not getByRole: the onboarding sheet is open here, and Radix marks the
  // content behind it aria-hidden, so the blockquote is absent from the a11y tree.
  await expect(page.locator("blockquote")).toBeVisible();
  const skip = page.getByRole("button", { name: "Skip" });
  await expect(skip).toBeVisible();
  await expect(page.getByRole("button", { name: "Start browsing" })).toBeVisible();
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
  await waitForQuoteSurface(page);
  await expect(page.getByRole("blockquote")).toHaveText(firstQuote ?? "");
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").successfulSwipeCount, stateKey)).toBe(0);
});

test("vertical swipe advances the exact quote", async ({ page }) => {
  const before = await page.getByRole("blockquote").textContent();
  await swipeQuote(page.locator("main section"));
  await expect(page).toHaveURL(/\/q\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("blockquote")).not.toHaveText(before ?? "");
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").successfulSwipeCount, stateKey)).toBe(1);
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").navigationOnboardingVersion, stateKey)).toBe(2);
});

test("visible browse controls and one successful swipe teach the gesture", async ({ page }) => {
  const stage = page.locator(".quote-stage");

  const actions = page.getByTestId("quote-actions");
  const isDesktopViewport = (page.viewportSize()?.width ?? 0) >= 1024;
  await expect(actions.getByRole("button", { name: "Save quote" })).toBeVisible();
  await expect(actions.getByRole("button", { name: "Share quote" })).toBeVisible();
  await expect(actions.getByRole("link", { name: "View quote source" })).toBeVisible();
  const browse = page.getByTestId("quote-browse-controls");
  await expect(browse.getByRole("button", { name: "Previous quote" })).toBeVisible();
  await expect(browse.getByRole("button", { name: "Next quote" })).toBeVisible();
  const coach = page.locator(".navigation-coach");
  if (!isDesktopViewport) {
    await expect(coach).toBeVisible();
    await expect(coach).toContainText("Swipe up for next");
    await expect(coach).toContainText("Swipe down to go back");
  } else {
    await expect(coach).not.toBeVisible();
  }

  await swipeQuote(stage);
  await expect(coach).not.toBeVisible();
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").successfulSwipeCount, stateKey)).toBe(1);
  await page.reload();
  await waitForQuoteSurface(page);
  await expect(page.getByRole("main").locator(".navigation-coach")).not.toBeVisible();
});

test("reduced motion removes the navigation coach without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await waitForQuoteSurface(page);
  await swipeQuote(page.locator(".quote-stage"));
  const coach = page.locator(".navigation-coach");
  await expect(coach).not.toBeVisible();
  await expect(coach).toHaveCSS("transition-duration", "0s");
});

test("browse buttons provide an exact forward and backward path", async ({ page }) => {
  const initialText = await page.getByRole("blockquote").textContent();
  await page.getByRole("button", { name: "Next quote" }).click();
  await expect(page.getByRole("blockquote")).not.toHaveText(initialText ?? "");
  await page.getByRole("button", { name: "Previous quote" }).click();
  await expect(page.getByRole("blockquote")).toHaveText(initialText ?? "");
});

test("keyboard browsing pauses while a dialog is open", async ({ page }) => {
  await page.getByRole("button", { name: "Share quote" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const url = page.url();
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(url);
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

test("every accepted quote stays exact across library and saved views", async ({ page }) => {
  // Eleven page loads assert the whole catalog: ten category searches on /discover plus
  // one /saved render. Cheap, so this stays exhaustive.
  test.setTimeout(120_000);
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

test("the sampled quotes cover every source shape", () => {
  const sample = stratifiedQuoteSample(catalogJSON.quotes);
  expect(new Set(sample.map((quote) => quote.sourceType)))
    .toEqual(new Set(catalogJSON.quotes.map((quote) => quote.sourceType)));
  expect(new Set(sample.map((quote) => quote.sourceLocator?.kind)))
    .toEqual(new Set(catalogJSON.quotes.map((quote) => quote.sourceLocator?.kind)));
  expect(new Set(sample.map((quote) => quote.primaryCategory)))
    .toEqual(new Set(catalogJSON.quotes.map((quote) => quote.primaryCategory)));
});

test("sampled quotes share, copy, and resolve to source exactly", async ({ page, context }) => {
  // The share/copy/source rendering path is identical for every quote; only the data
  // varies. `stratifiedQuoteSample` covers each distinct shape that path branches on, so
  // sampling the interaction is safe while the test above keeps text coverage total.
  test.setTimeout(240_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const quote of stratifiedQuoteSample(catalogJSON.quotes)) {
    await page.goto(`/q/${quote.id}`);
    await waitForQuoteSurface(page);
    await expect(page.getByRole("blockquote")).toHaveText(quote.text);
    await page.getByRole("button", { name: "Share quote" }).first().click();
    const copy = page.getByRole("button", { name: "Copy quote" });
    await copy.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`“${quote.text}” — ${quote.author}`);
    await page.keyboard.press("Escape");
    // Radix keeps `pointer-events: none` on <body> until the exit animation finishes;
    // clicking through before then burns actionability retries on every iteration.
    await expect(copy).toBeHidden();
    await page.getByRole("link", { name: "View quote source" }).click();
    await expect(page.getByRole("blockquote")).toHaveText(quote.text);
    await expect(page.getByRole("link", { name: /^(Read|Listen to|Watch) original$/ })).toHaveAttribute("href", quote.sourceURL);
  }
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
  await waitForQuoteSurface(page);

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
    // Finish the 320ms quote-enter-up animation deterministically. A fixed sleep raced
    // it, because the animation only starts after hydration + the catalog fetch resolve.
    await settleAnimations(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")), `Accessibility violations on ${path}`).toEqual([]);
  }
});

test("editorial surfaces preserve the branded quote and dark library distinction", async ({ page }) => {
  await page.goto(homePath);
  await waitForQuoteSurface(page);
  await expect(page.locator("main")).toHaveClass(/quote-surface/);
  await expect(page.locator('[data-surface="quote"]')).toBeVisible();
  await expect(page.locator("main.quote-surface")).toHaveCSS("background-color", leilaProduct ? "rgb(255, 255, 255)" : "rgb(107, 44, 255)");
  await page.goto("/discover");
  await expect(page.locator('[data-surface="library"]')).toBeVisible();
  await expect(page.locator("main")).not.toHaveClass(/quote-surface/);
});
