import { describe, expect, it } from "vitest";

// Simple test for requests logic and formatting
describe("Requests triage board unit helpers", () => {
  // Test formatting for native Stellar postage amounts (1 XLM = 10,000,000 Stroops)
  const formatPostage = (stroops?: string) => {
    if (!stroops) return "0.0 XLM";
    try {
      const val = BigInt(stroops);
      const xlm = Number(val) / 10_000_000;
      return `${xlm.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 4,
      })} XLM`;
    } catch {
      return `${stroops} stroops`;
    }
  };

  const cleanLabels = (labels?: string[], toAdd?: string) => {
    const filterOut = ["Request", "Paid", "Pending"];
    const current = labels ? labels.filter((l) => !filterOut.includes(l)) : [];
    return toAdd ? [...current, toAdd] : current;
  };

  it("formats postage amounts from stroops to XLM native units", () => {
    expect(formatPostage("10000000")).toBe("1.0 XLM");
    expect(formatPostage("50000000")).toBe("5.0 XLM");
    expect(formatPostage("15000000")).toBe("1.5 XLM");
    expect(formatPostage("100000")).toBe("0.01 XLM");
    expect(formatPostage(undefined)).toBe("0.0 XLM");
    expect(formatPostage("invalid")).toBe("invalid stroops");
  });

  it("cleans temporary triage labels and appends final policy badge", () => {
    const originalLabels = ["Request", "Paid", "Design"];
    const resultApprove = cleanLabels(originalLabels, "Trusted");
    expect(resultApprove).toEqual(["Design", "Trusted"]);
    expect(resultApprove).not.toContain("Request");
    expect(resultApprove).not.toContain("Paid");

    const resultBlock = cleanLabels(originalLabels, "Blocked");
    expect(resultBlock).toEqual(["Design", "Blocked"]);

    const resultRefund = cleanLabels(originalLabels, "Refunded");
    expect(resultRefund).toEqual(["Design", "Refunded"]);
  });
});
