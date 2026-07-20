import type { Postage } from "./domain";
import { ApiError, type ApiErrorCode } from "./errors";
import {
  checkAccountLimit,
  checkDeviceLimit,
  checkIpLimit,
  checkRelayLimit,
  checkSenderRecipientLimit,
  type AbuseDecision,
} from "./abuse-service";
import { getMailboxPolicy } from "./policy-service";
import * as metrics from "./metrics";
import type { ApiRepository } from "./repository";

export type SubmitPostageContext = {
  actorId?: string;
  fingerprint?: string;
  ip?: string;
  relayId?: string;
  sender?: string;
};

function throwAbuseLimitError(
  decision: AbuseDecision,
  status: number,
  code: ApiErrorCode,
  message: string,
) {
  throw new ApiError(status, code, message, {
    ...(decision.retryAfterSeconds === undefined
      ? {}
      : { retryAfterSeconds: decision.retryAfterSeconds }),
    ...(decision.outage === undefined
      ? {}
      : {
          outagePolicy: decision.outage.policy,
          outageRoute: decision.outage.route,
        }),
  });
}

function rejectLimitedPostage(
  decision: AbuseDecision,
  labels: Record<string, string>,
  limitMessage: string,
) {
  metrics.incrementCounter("postage_limit_rejected", labels);

  if (decision.outage) {
    throwAbuseLimitError(
      decision,
      503,
      "dependency_unavailable",
      `Abuse ${decision.outage.check} check is unavailable`,
    );
  }

  throwAbuseLimitError(decision, 429, "too_many_requests", limitMessage);
}

export async function quotePostage(
  repository: ApiRepository,
  input: { recipient: string; sender: string },
) {
  const rule = await repository.getSenderRule(input.recipient, input.sender);
  const { policy } = await getMailboxPolicy(repository, input.recipient);

  if (rule === "block") {
    return {
      amount: policy.minimumPostage,
      eligible: false,
      reason: "sender_blocked" as const,
      trusted: false,
    };
  }

  const trusted = rule === "allow";

  return {
    amount: trusted ? "0" : policy.minimumPostage,
    eligible: true,
    reason: trusted ? ("trusted_sender" as const) : ("mailbox_minimum" as const),
    trusted,
  };
}

export async function submitPostage(
  repository: ApiRepository,
  input: Omit<Postage, "createdAt" | "status">,
  now = new Date(),
  context: SubmitPostageContext = {},
) {
  const actorId = context.actorId ?? "unknown";

  const accountLimit = await checkAccountLimit(repository, input.sender);
  if (!accountLimit.allowed) {
    rejectLimitedPostage(
      accountLimit,
      {
        actorId,
        limit: "account",
      },
      "Account limit exceeded",
    );
  }

  const ip = context.ip ?? "unknown";
  const ipLimit = await checkIpLimit(repository, ip);
  if (!ipLimit.allowed) {
    rejectLimitedPostage(
      ipLimit,
      {
        ip,
        limit: "ip",
      },
      "IP limit exceeded",
    );
  }

  const fingerprint = context.fingerprint ?? "";
  const deviceLimit = await checkDeviceLimit(repository, fingerprint);
  if (!deviceLimit.allowed) {
    rejectLimitedPostage(
      deviceLimit,
      {
        fingerprint: fingerprint || "unknown",
        limit: "device",
      },
      "Device limit exceeded",
    );
  }

  const senderRecipientLimit = await checkSenderRecipientLimit(
    repository,
    input.sender,
    input.recipient,
  );

  if (!senderRecipientLimit.allowed) {
    const sender = context.sender ?? input.sender;

    rejectLimitedPostage(
      senderRecipientLimit,
      {
        limit: "sender_recipient",
        sender,
      },
      "Sender-recipient limit exceeded",
    );
  }

  const relayId = context.relayId?.trim() || "unknown";
  const relayLimit = await checkRelayLimit(repository, relayId);

  if (!relayLimit.allowed) {
    rejectLimitedPostage(
      relayLimit,
      {
        limit: "relay",
        relayId,
      },
      "Relay limit exceeded",
    );
  }

  if (await repository.getPostage(input.messageId)) {
    throw new ApiError(409, "conflict", "Postage already exists for this message");
  }

  const rule = await repository.getSenderRule(input.recipient, input.sender);

  if (rule === "block") {
    throw new ApiError(403, "forbidden", "The recipient has blocked this sender");
  }

  const { policy } = await getMailboxPolicy(repository, input.recipient);

  if (BigInt(input.amount) < BigInt(policy.minimumPostage)) {
    throw new ApiError(422, "validation_error", "Postage is below the mailbox minimum", {
      minimumPostage: policy.minimumPostage,
    });
  }

  return repository.setPostage({
    ...input,
    createdAt: now.toISOString(),
    status: "pending",
  });
}

export async function getPostage(repository: ApiRepository, messageId: string) {
  const postage = await repository.getPostage(messageId);

  if (!postage) {
    throw new ApiError(404, "not_found", "Postage was not found");
  }

  return postage;
}

export function assertPostageParticipant(postage: Postage, actor: string) {
  if (actor !== postage.sender && actor !== postage.recipient) {
    throw new ApiError(403, "forbidden", "Only message participants can read this postage");
  }
}

export async function resolvePostage(
  repository: ApiRepository,
  messageId: string,
  status: "refunded" | "settled",
) {
  const postage = await getPostage(repository, messageId);

  if (postage.status !== "pending") {
    // Provide detailed explanations for terminal states to aid debugging and retry logic
    const explanations: Record<string, string> = {
      settled:
        "Postage has already been settled. The escrow was previously released to the recipient.",
      refunded:
        "Postage has already been refunded. The escrow was previously returned to the sender.",
    };

    const explanation =
      explanations[postage.status] || `Postage is in terminal state: ${postage.status}`;

    throw new ApiError(409, "conflict", explanation, {
      currentStatus: postage.status,
      attemptedStatus: status,
      messageId,
    });
  }

  return repository.setPostage({ ...postage, status });
}
