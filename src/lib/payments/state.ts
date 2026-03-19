export const PAYMENT_STATUSES = [
  "created",
  "requires_action",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ACTIVE_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "created",
  "requires_action",
  "processing",
];

const TERMINAL_STATUSES: PaymentStatus[] = ["succeeded", "failed", "cancelled", "refunded"];

const STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  created: ["requires_action", "processing", "succeeded", "failed", "cancelled"],
  requires_action: ["processing", "succeeded", "failed", "cancelled"],
  processing: ["succeeded", "failed", "cancelled", "refunded"],
  succeeded: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function isActivePaymentStatus(status: PaymentStatus): boolean {
  return ACTIVE_PAYMENT_STATUSES.includes(status);
}

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function isPaymentStatus(status: string): status is PaymentStatus {
  return PAYMENT_STATUSES.includes(status as PaymentStatus);
}

export function validateIdempotencyKey(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    throw new Error("Missing idempotency key");
  }
  if (normalized.length < 8 || normalized.length > 128) {
    throw new Error("Invalid idempotency key");
  }
  return normalized;
}