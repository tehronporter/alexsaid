import type { Page } from "@playwright/test";

/**
 * The daily feed order is seeded from the local date (see `dailyQuoteOrder` in
 * src/lib/feed.ts), so an unpinned clock rotates the quote every midnight and
 * rots every checked-in screenshot with it. Freeze Date for the visual suite.
 * Paired with `timezoneId: "UTC"` in playwright.visual.config.ts.
 */
export const PINNED_DATE = new Date("2026-01-15T12:00:00.000Z");

export async function pinClock(page: Page) {
  await page.clock.setFixedTime(PINNED_DATE);
}

/**
 * The quote surface plays a 320ms `quote-enter-up` animation that translates the
 * composition down by 28px. Geometry assertions that run before it settles read
 * the animation's start frame, not the resting layout, and trip on the smallest
 * viewport where the resting clearance is under 28px. `toHaveScreenshot` already
 * disables animations for captures; this does the same for measurements.
 */
export async function settleAnimations(page: Page) {
  await page.evaluate(async () => {
    const finite = document.getAnimations().filter((animation) => {
      const endTime = animation.effect?.getComputedTiming().endTime;
      return typeof endTime === "number" && Number.isFinite(endTime);
    });
    finite.forEach((animation) => animation.finish());
    await Promise.allSettled(finite.map((animation) => animation.finished));
  });
}
