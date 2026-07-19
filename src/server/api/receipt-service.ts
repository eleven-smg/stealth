import type { Receipt } from "./domain";
import { ApiError } from "./errors";
import type { ApiRepository } from "./repository";

function isSameReceiptParticipants(
  receipt: Pick<Receipt, "recipient" | "sender">,
  input: Pick<Receipt, "recipient" | "sender">,
) {
  return receipt.recipient === input.recipient && receipt.sender === input.sender;
}

export async function createDeliveryReceipt(
  repository: ApiRepository,
  input: Pick<Receipt, "messageId" | "recipient" | "sender">,
  now = new Date(),
) {
  const { receipt } = await repository.createReceiptIfAbsent({
    ...input,
    deliveredAt: now.toISOString(),
    readAt: null,
  });

  if (!isSameReceiptParticipants(receipt, input)) {
    throw new ApiError(
      409,
      "conflict",
      "A delivery receipt already exists for this message with different participants",
    );
  }

  return receipt;
}

export async function getReceipt(repository: ApiRepository, messageId: string) {
  const receipt = await repository.getReceipt(messageId);
  if (!receipt) {
    throw new ApiError(404, "not_found", "Receipt was not found");
  }
  return receipt;
}

export function assertReceiptParticipant(receipt: Receipt, actor: string) {
  if (actor !== receipt.sender && actor !== receipt.recipient) {
    throw new ApiError(403, "forbidden", "Only message participants can read this receipt");
  }
}

export async function markReceiptRead(
  repository: ApiRepository,
  messageId: string,
  now = new Date(),
) {
  const result = await repository.markReceiptRead(messageId, now.toISOString());
  if (!result) {
    throw new ApiError(404, "not_found", "Receipt was not found");
  }

  return result.receipt;
}
