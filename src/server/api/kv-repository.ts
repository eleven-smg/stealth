import type { ApiRepository } from "./repository";
import type { MailboxPolicy, SenderRule, Postage, Receipt, IdempotencyRecord } from "./domain";

export class HybridApiRepository implements ApiRepository {
  constructor(
    private readonly kv: KVNamespace,
    private readonly coordinator: DurableObjectNamespace,
  ) {}

  private key(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(":")}`;
  }

  async getPolicy(owner: string): Promise<MailboxPolicy | null> {
    const policy = await this.kv.get(this.key("policy", owner), "json");
    return (policy as MailboxPolicy) ?? null;
  }

  async setPolicy(owner: string, policy: MailboxPolicy): Promise<MailboxPolicy> {
    await this.kv.put(this.key("policy", owner), JSON.stringify(policy));
    return policy;
  }

  async getSenderRule(owner: string, sender: string): Promise<SenderRule> {
    const rule = await this.kv.get(this.key("sender-rule", owner, sender), "text");
    return (rule as SenderRule) ?? "default";
  }

  async setSenderRule(owner: string, sender: string, rule: SenderRule): Promise<SenderRule> {
    const ruleKey = this.key("sender-rule", owner, sender);
    if (rule === "default") {
      await this.kv.delete(ruleKey);
    } else {
      await this.kv.put(ruleKey, rule);
    }
    return rule;
  }

  async getPostage(messageId: string): Promise<Postage | null> {
    const postage = await this.kv.get(this.key("postage", messageId), "json");
    return (postage as Postage) ?? null;
  }

  async setPostage(postage: Postage): Promise<Postage> {
    await this.kv.put(this.key("postage", postage.messageId), JSON.stringify(postage));
    return postage;
  }

  async getReceipt(messageId: string): Promise<Receipt | null> {
    const coordinatedReceipt = await this.getStub().getReceipt(messageId);
    if (coordinatedReceipt) return coordinatedReceipt;

    const receipt = await this.kv.get(this.key("receipt", messageId), "json");
    if (!receipt) return null;

    await this.getStub().setReceipt(receipt as Receipt);
    return receipt as Receipt;
  }

  async setReceipt(receipt: Receipt): Promise<Receipt> {
    await this.getStub().setReceipt(receipt);
    await this.kv.put(this.key("receipt", receipt.messageId), JSON.stringify(receipt));
    return receipt;
  }

  async createReceiptIfAbsent(receipt: Receipt): Promise<{ created: boolean; receipt: Receipt }> {
    const existing = await this.getReceipt(receipt.messageId);
    if (existing) return { created: false, receipt: existing };

    const result = await this.getStub().createReceiptIfAbsent(receipt);
    if (result.created) {
      await this.kv.put(
        this.key("receipt", result.receipt.messageId),
        JSON.stringify(result.receipt),
      );
    }
    return result;
  }

  async markReceiptRead(
    messageId: string,
    readAt: string,
  ): Promise<{ receipt: Receipt; updated: boolean } | null> {
    await this.getReceipt(messageId);
    const result = await this.getStub().markReceiptRead(messageId, readAt);
    if (!result) return null;

    if (result.updated) {
      await this.kv.put(
        this.key("receipt", result.receipt.messageId),
        JSON.stringify(result.receipt),
      );
    }
    return result;
  }

  // Consistent layer delegated to Durable Object via RPC
  private getStub() {
    const id = this.coordinator.idFromName("global-stealth-coordinator");
    return this.coordinator.get(id);
  }

  async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    return this.getStub().getIdempotencyRecord(key);
  }

  async setIdempotencyRecord(key: string, record: IdempotencyRecord): Promise<void> {
    await this.getStub().setIdempotencyRecord(key, record);
  }

  async getCounter(key: string): Promise<number> {
    return this.getStub().getCounter(key);
  }

  async incrementCounter(key: string, windowSeconds: number): Promise<number> {
    return this.getStub().incrementCounter(key, windowSeconds);
  }

  // Relay stats stubs matching MemoryApiRepository exactly
  async getRelayQueueDepth(_relayId: string): Promise<number> {
    return 0;
  }

  async getRelayRetryCount(_relayId: string): Promise<number> {
    return 0;
  }

  async getRelayLastSuccessfulDelivery(_relayId: string): Promise<string | null> {
    return null;
  }

  async getRelayLastFailedDelivery(_relayId: string): Promise<string | null> {
    return null;
  }

  async getRelayDeadLetterCount(_relayId: string): Promise<number> {
    return 0;
  }
}
