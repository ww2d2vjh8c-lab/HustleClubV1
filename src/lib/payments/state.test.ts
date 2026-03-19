import { describe, expect, it } from "vitest";
import {
  ACTIVE_PAYMENT_STATUSES,
  canTransitionPaymentStatus,
  isActivePaymentStatus,
  isPaymentStatus,
  isTerminalPaymentStatus,
  validateIdempotencyKey,
} from "./state";

describe("payment state machine", () => {
  it("allows valid transitions and blocks invalid transitions", () => {
    expect(canTransitionPaymentStatus("created", "requires_action")).toBe(true);
    expect(canTransitionPaymentStatus("processing", "succeeded")).toBe(true);
    expect(canTransitionPaymentStatus("succeeded", "failed")).toBe(false);
    expect(canTransitionPaymentStatus("failed", "processing")).toBe(false);
  });

  it("classifies active and terminal statuses", () => {
    expect(isActivePaymentStatus("created")).toBe(true);
    expect(isActivePaymentStatus("processing")).toBe(true);
    expect(isActivePaymentStatus("succeeded")).toBe(false);
    expect(isTerminalPaymentStatus("succeeded")).toBe(true);
    expect(isTerminalPaymentStatus("failed")).toBe(true);
    expect(isTerminalPaymentStatus("requires_action")).toBe(false);
  });

  it("validates idempotency key format", () => {
    expect(validateIdempotencyKey("  key_12345678  ")).toBe("key_12345678");
    expect(() => validateIdempotencyKey("short")).toThrow("Invalid idempotency key");
    expect(() => validateIdempotencyKey("")).toThrow("Missing idempotency key");
  });

  it("checks known payment statuses", () => {
    expect(ACTIVE_PAYMENT_STATUSES).toEqual(["created", "requires_action", "processing"]);
    expect(isPaymentStatus("created")).toBe(true);
    expect(isPaymentStatus("unknown")).toBe(false);
  });
});
