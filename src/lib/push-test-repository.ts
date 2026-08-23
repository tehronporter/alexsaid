import type { PushSubscriptionRecord, PushSubscriptionRepository } from "@/domain/catalog";

export class TestPushSubscriptionRepository implements PushSubscriptionRepository {
  private readonly records = new Map<string, PushSubscriptionRecord>();

  async subscribe(record: PushSubscriptionRecord) { this.records.set(record.id, { ...record }); }

  async updatePreferences(id: string, update: Pick<PushSubscriptionRecord, "timezone" | "localTime" | "topics">) {
    const current = this.records.get(id);
    if (!current) throw new Error(`Unknown push subscription: ${id}`);
    this.records.set(id, { ...current, ...update });
  }

  async unsubscribe(id: string) {
    const current = this.records.get(id);
    if (current) this.records.set(id, { ...current, active: false });
  }

  async findDue(now: Date) {
    void now;
    return [...this.records.values()].filter((record) => record.active);
  }

  async recordDelivery(id: string, localDate: string) {
    const current = this.records.get(id);
    if (!current) throw new Error(`Unknown push subscription: ${id}`);
    this.records.set(id, { ...current, lastSentLocalDate: localDate });
  }
}
