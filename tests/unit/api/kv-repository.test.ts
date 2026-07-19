import { beforeEach, describe, expect, it } from "vitest";
import { HybridApiRepository } from "../../../src/server/api/kv-repository";
import type { MailboxPolicy, Postage, Receipt } from "../../../src/server/api/domain";

class MockKVNamespace {
  public store = new Map<string, string>();
  public puts: string[] = [];

  async get(key: string, type: "text" | "json") {
    const val = this.store.get(key);
    if (val === undefined) return null;
    if (type === "json") return JSON.parse(val);
    return val;
  }

  async put(key: string, value: string): Promise<void> {
    this.puts.push(key);
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class MockDurableObjectNamespace {
  private readonly stub = new MockStealthCoordinatorStub();

  idFromName(name: string) {
    return { toString: () => name };
  }
  get(id: any) {
    return this.stub;
  }
}

class MockStealthCoordinatorStub {
  private readonly receipts = new Map<string, Receipt>();

  async getReceipt(messageId: string) {
    return this.receipts.get(messageId) ?? null;
  }

  async setReceipt(receipt: Receipt) {
    this.receipts.set(receipt.messageId, receipt);
    return receipt;
  }

  async createReceiptIfAbsent(receipt: Receipt) {
    const existing = this.receipts.get(receipt.messageId);
    if (existing) return { created: false, receipt: existing };

    this.receipts.set(receipt.messageId, receipt);
    return { created: true, receipt };
  }

  async markReceiptRead(messageId: string, readAt: string) {
    const receipt = this.receipts.get(messageId);
    if (!receipt) return null;
    if (receipt.readAt) return { receipt, updated: false };

    const updated = { ...receipt, readAt };
    this.receipts.set(messageId, updated);
    return { receipt: updated, updated: true };
  }
}

const owner = `G${"A".repeat(55)}`;
const sender = `G${"B".repeat(55)}`;
const messageId = "a".repeat(64);

describe("HybridApiRepository - KV Operations", () => {
  let kv: MockKVNamespace;
  let repo: HybridApiRepository;

  beforeEach(() => {
    kv = new MockKVNamespace();
    const coordinator = new MockDurableObjectNamespace() as any;
    repo = new HybridApiRepository(kv as any, coordinator);
  });

  it("persists and retrieves mailbox policy", async () => {
    const policy: MailboxPolicy = {
      allowUnknown: true,
      minimumPostage: "100",
      requireVerified: false,
    };
    await repo.setPolicy(owner, policy);
    const retrieved = await repo.getPolicy(owner);
    expect(retrieved).toEqual(policy);
  });

  it("returns null for non-existent policy", async () => {
    const retrieved = await repo.getPolicy(owner);
    expect(retrieved).toBeNull();
  });

  it("persists, retrieves, and deletes sender rules", async () => {
    expect(await repo.getSenderRule(owner, sender)).toBe("default");

    await repo.setSenderRule(owner, sender, "allow");
    expect(await repo.getSenderRule(owner, sender)).toBe("allow");

    await repo.setSenderRule(owner, sender, "default");
    expect(await repo.getSenderRule(owner, sender)).toBe("default");
    expect(kv.store.has(`sender-rule:${owner}:${sender}`)).toBe(false);
  });

  it("persists and retrieves postage", async () => {
    const postage: Postage = {
      amount: "200",
      createdAt: new Date().toISOString(),
      messageId,
      paymentHash: "b".repeat(64),
      recipient: owner,
      sender,
      status: "pending",
    };
    await repo.setPostage(postage);
    const retrieved = await repo.getPostage(messageId);
    expect(retrieved).toEqual(postage);
  });

  it("persists and retrieves receipt", async () => {
    const receipt: Receipt = {
      deliveredAt: new Date().toISOString(),
      messageId,
      readAt: null,
      recipient: owner,
      sender,
    };
    await repo.setReceipt(receipt);
    const retrieved = await repo.getReceipt(messageId);
    expect(retrieved).toEqual(receipt);
  });

  it("mirrors only first receipt delivery and read transitions to KV", async () => {
    const receipt: Receipt = {
      deliveredAt: "2026-06-14T12:00:00.000Z",
      messageId,
      readAt: null,
      recipient: owner,
      sender,
    };

    await expect(repo.createReceiptIfAbsent(receipt)).resolves.toEqual({
      created: true,
      receipt,
    });
    await expect(
      repo.createReceiptIfAbsent({ ...receipt, deliveredAt: "2026-06-14T12:05:00.000Z" }),
    ).resolves.toEqual({ created: false, receipt });

    const readReceipt = { ...receipt, readAt: "2026-06-14T12:30:00.000Z" };
    await expect(repo.markReceiptRead(messageId, readReceipt.readAt)).resolves.toEqual({
      receipt: readReceipt,
      updated: true,
    });
    await expect(repo.markReceiptRead(messageId, "2026-06-14T12:45:00.000Z")).resolves.toEqual({
      receipt: readReceipt,
      updated: false,
    });
    expect(kv.puts.filter((key) => key === `receipt:${messageId}`)).toHaveLength(2);
  });

  it("returns defaults/0 for relay stubs", async () => {
    expect(await repo.getRelayQueueDepth("relay-1")).toBe(0);
    expect(await repo.getRelayRetryCount("relay-1")).toBe(0);
    expect(await repo.getRelayLastSuccessfulDelivery("relay-1")).toBeNull();
    expect(await repo.getRelayLastFailedDelivery("relay-1")).toBeNull();
    expect(await repo.getRelayDeadLetterCount("relay-1")).toBe(0);
  });
});
