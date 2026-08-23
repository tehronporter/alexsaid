import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/catalog";
import { makePushPayload } from "@/lib/push";
import { TestPushSubscriptionRepository } from "@/lib/push-test-repository";

describe("push payload", () => {
  it("routes to the exact quote represented by the notification", () => {
    const quote = catalog.quotes[3];
    const payload = makePushPayload(quote);
    expect(payload.quoteID).toBe(quote.id);
    expect(payload.url).toBe(`/q/${quote.id}`);
  });
});

describe("test push repository", () => {
  it("records preferences, deactivation, and exact delivery dates", async () => {
    const repository = new TestPushSubscriptionRepository();
    await repository.subscribe({ id: "device-1", endpoint: "https://push.example/1", timezone: "America/Los_Angeles", localTime: "09:00", topics: ["Sales"], active: true, lastSentLocalDate: null });
    await repository.recordDelivery("device-1", "2026-08-23");
    expect(await repository.findDue(new Date())).toMatchObject([{ id: "device-1", lastSentLocalDate: "2026-08-23" }]);
    await repository.unsubscribe("device-1");
    expect(await repository.findDue(new Date())).toEqual([]);
  });
});
