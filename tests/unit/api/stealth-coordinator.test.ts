import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => {
  return {
    DurableObject: class DurableObject {
      ctx: any;
      env: any;
      constructor(ctx: any, env: any) {
        this.ctx = ctx;
        this.env = env;
      }
    },
  };
});

import { StealthCoordinator } from "../../../src/server/api/stealth-coordinator";
import type { IdempotencyRecord, Receipt } from "../../../src/server/api/domain";

class MockDurableObjectState {
  public id = { toString: () => "mock-do-id" };
  public storage = {
    store: new Map<string, any>(),
    async get(key: string) {
      return this.store.get(key);
    },
    async put(key: string, value: any) {
      this.store.set(key, value);
    },
    async delete(key: string) {
      return this.store.delete(key);
    },
  };
}

describe("StealthCoordinator - Durable Object Operations", () => {
  let state: MockDurableObjectState;
  let coordinator: StealthCoordinator;

  beforeEach(() => {
    state = new MockDurableObjectState();
    coordinator = new StealthCoordinator(state as any, {});
  });

  it("handles idempotency records", async () => {
    const record: IdempotencyRecord = {
      body: { ok: true },
      createdAt: new Date().toISOString(),
      status: 201,
    };

    expect(await coordinator.getIdempotencyRecord("key-1")).toBeNull();
    await coordinator.setIdempotencyRecord("key-1", record);
    expect(await coordinator.getIdempotencyRecord("key-1")).toEqual(record);
  });

  it("handles counter sliding window rate-limiting", async () => {
    expect(await coordinator.getCounter("limiter-1")).toBe(0);

    const now = Date.now();
    const dateSpy = vi.spyOn(Date, "now");

    // First increment at T = 0
    dateSpy.mockReturnValue(now);
    expect(await coordinator.incrementCounter("limiter-1", 60)).toBe(1);

    // Second increment at T = 10s
    dateSpy.mockReturnValue(now + 10000);
    expect(await coordinator.incrementCounter("limiter-1", 60)).toBe(2);

    // Get counter should reflect current size (2)
    expect(await coordinator.getCounter("limiter-1")).toBe(2);

    // Third increment at T = 70s (this should drop the first timestamp at T = 0 since 70 - 0 = 70 > 60)
    dateSpy.mockReturnValue(now + 70000);
    expect(await coordinator.incrementCounter("limiter-1", 60)).toBe(2); // T=10s and T=70s remain

    // Get counter should reflect current size (2)
    expect(await coordinator.getCounter("limiter-1")).toBe(2);

    dateSpy.mockRestore();
  });

  it("creates receipts once and replays duplicate deliveries", async () => {
    const receipt: Receipt = {
      deliveredAt: "2026-06-14T12:00:00.000Z",
      messageId: "a".repeat(64),
      readAt: null,
      recipient: `G${"A".repeat(55)}`,
      sender: `G${"B".repeat(55)}`,
    };
    const duplicate = { ...receipt, deliveredAt: "2026-06-14T12:05:00.000Z" };

    await expect(coordinator.createReceiptIfAbsent(receipt)).resolves.toEqual({
      created: true,
      receipt,
    });
    await expect(coordinator.createReceiptIfAbsent(duplicate)).resolves.toEqual({
      created: false,
      receipt,
    });
    await expect(coordinator.getReceipt(receipt.messageId)).resolves.toEqual(receipt);
  });

  it("marks receipts read once and replays duplicate reads", async () => {
    const receipt: Receipt = {
      deliveredAt: "2026-06-14T12:00:00.000Z",
      messageId: "b".repeat(64),
      readAt: null,
      recipient: `G${"A".repeat(55)}`,
      sender: `G${"B".repeat(55)}`,
    };
    const expected = { ...receipt, readAt: "2026-06-14T12:30:00.000Z" };

    await coordinator.setReceipt(receipt);

    await expect(
      coordinator.markReceiptRead(receipt.messageId, "2026-06-14T12:30:00.000Z"),
    ).resolves.toEqual({ receipt: expected, updated: true });
    await expect(
      coordinator.markReceiptRead(receipt.messageId, "2026-06-14T12:45:00.000Z"),
    ).resolves.toEqual({ receipt: expected, updated: false });
  });
});
