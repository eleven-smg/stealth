import { DurableObject } from "cloudflare:workers";
import type { IdempotencyRecord } from "./domain";

export class StealthCoordinator extends DurableObject {
  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
  }

  async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    const record = await this.ctx.storage.get<IdempotencyRecord>(`idempotency:${key}`);
    return record ?? null;
  }

  async setIdempotencyRecord(key: string, record: IdempotencyRecord): Promise<void> {
    await this.ctx.storage.put(`idempotency:${key}`, record);
  }

  async getCounter(key: string): Promise<number> {
    const timestamps = (await this.ctx.storage.get<number[]>(`counter:${key}`)) ?? [];
    return timestamps.length;
  }

  async incrementCounter(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const windowMilliseconds = windowSeconds * 1000;
    const timestamps = (await this.ctx.storage.get<number[]>(`counter:${key}`)) ?? [];

    // Filter timestamps falling within the sliding window
    const filtered = [...timestamps, now].filter(
      (timestamp) => now - timestamp <= windowMilliseconds,
    );

    await this.ctx.storage.put(`counter:${key}`, filtered);
    return filtered.length;
  }
}
