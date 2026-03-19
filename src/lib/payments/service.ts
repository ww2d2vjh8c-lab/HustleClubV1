import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ACTIVE_PAYMENT_STATUSES,
  canTransitionPaymentStatus,
  isActivePaymentStatus,
  isPaymentStatus,
  validateIdempotencyKey,
  type PaymentStatus,
} from "./state";

export type PaymentProvider = "mock" | "stripe" | "razorpay";

type JsonObject = Record<string, unknown>;

type PaymentTransactionRow = {
  id: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  order_id: string | null;
  amount: number | string;
  currency: string;
  checkout_url: string | null;
  metadata: JsonObject | null;
  idempotency_key: string | null;
  checkout_started_at: string | null;
  reservation_expires_at: string | null;
  error_message: string | null;
  created_at: string;
  paid_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
};

type CheckoutResult = {
  status: Extract<
    PaymentStatus,
    "succeeded" | "requires_action" | "processing" | "failed" | "cancelled"
  >;
  providerReference?: string;
  checkoutUrl?: string;
  message?: string;
};

export type StartCheckoutResult = {
  transactionId: string;
  idempotencyKey?: string;
  status: CheckoutResult["status"];
  provider: PaymentProvider;
  orderId?: string;
  checkoutUrl?: string;
  message?: string;
};

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type PgErrorLike = {
  code?: string;
  message?: string;
  details?: string;
};

const PAYMENT_TRANSACTION_SELECT =
  "id, provider, provider_reference, status, buyer_id, seller_id, item_id, order_id, amount, currency, checkout_url, metadata, idempotency_key, checkout_started_at, reservation_expires_at, error_message, created_at, paid_at, failed_at, cancelled_at, refunded_at";

const PAYMENT_RESERVATION_MINUTES = 30;
const ACTIVE_STATUS_LIST: string[] = [...ACTIVE_PAYMENT_STATUSES];

function getConfiguredProvider(): PaymentProvider {
  const value = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (value === "stripe" || value === "razorpay" || value === "mock") {
    return value;
  }
  return "mock";
}

function toPaymentProvider(value: string): PaymentProvider {
  if (value === "stripe" || value === "razorpay" || value === "mock") {
    return value;
  }
  return "mock";
}

function toNumber(value: number | string): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePaymentStatus(status: string): PaymentStatus {
  if (!isPaymentStatus(status)) {
    throw new Error(`Unknown payment status: ${status}`);
  }
  return status;
}

function nowIsoString(): string {
  return new Date().toISOString();
}

function reservationExpiryIso(from: Date): string {
  return new Date(from.getTime() + PAYMENT_RESERVATION_MINUTES * 60 * 1000).toISOString();
}

function isUniqueViolation(error: unknown, constraintName?: string): boolean {
  const pgError = error as PgErrorLike;
  if (!pgError || pgError.code !== "23505") {
    return false;
  }

  if (!constraintName) {
    return true;
  }

  const haystack = `${pgError.message ?? ""} ${pgError.details ?? ""}`.toLowerCase();
  return haystack.includes(constraintName.toLowerCase());
}

function generatedIdempotencyKey(): string {
  return validateIdempotencyKey(`mkp_${crypto.randomUUID().replace(/-/g, "")}`);
}

function mergeMetadata(base: JsonObject | null, patch: JsonObject): JsonObject {
  return {
    ...(base ?? {}),
    ...patch,
  };
}

function toStartCheckoutResultFromActiveTransaction(
  tx: PaymentTransactionRow,
  status: Extract<PaymentStatus, "requires_action" | "processing">,
  message?: string
): StartCheckoutResult {
  return {
    transactionId: tx.id,
    idempotencyKey: tx.idempotency_key ?? undefined,
    status,
    provider: toPaymentProvider(tx.provider),
    checkoutUrl: tx.checkout_url ?? undefined,
    message,
  };
}

async function fetchPaymentTransactionById(
  supabaseAdmin: SupabaseAdminClient,
  transactionId: string
): Promise<PaymentTransactionRow> {
  const { data, error } = await supabaseAdmin
    .from("payment_transactions")
    .select(PAYMENT_TRANSACTION_SELECT)
    .eq("id", transactionId)
    .single<PaymentTransactionRow>();

  if (error || !data) {
    throw new Error("Payment transaction not found");
  }

  return data;
}

async function findPaymentTransactionByIdempotency(
  supabaseAdmin: SupabaseAdminClient,
  buyerId: string,
  idempotencyKey: string
): Promise<PaymentTransactionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("payment_transactions")
    .select(PAYMENT_TRANSACTION_SELECT)
    .eq("buyer_id", buyerId)
    .eq("idempotency_key", idempotencyKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PaymentTransactionRow>();

  if (error) {
    throw new Error("Failed to load payment transaction by idempotency key");
  }

  return data;
}

async function findActiveTransactionForBuyerItem(
  supabaseAdmin: SupabaseAdminClient,
  buyerId: string,
  itemId: string
): Promise<PaymentTransactionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("payment_transactions")
    .select(PAYMENT_TRANSACTION_SELECT)
    .eq("buyer_id", buyerId)
    .eq("item_id", itemId)
    .is("order_id", null)
    .in("status", ACTIVE_STATUS_LIST)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PaymentTransactionRow>();

  if (error) {
    throw new Error("Failed to load active payment transaction");
  }

  return data;
}

async function transitionPaymentTransactionStatus(params: {
  supabaseAdmin: SupabaseAdminClient;
  transactionId: string;
  targetStatus: PaymentStatus;
  patch?: Record<string, unknown>;
}): Promise<PaymentTransactionRow> {
  const { supabaseAdmin, transactionId, targetStatus, patch = {} } = params;

  const current = await fetchPaymentTransactionById(supabaseAdmin, transactionId);
  const currentStatus = parsePaymentStatus(current.status);

  if (currentStatus === targetStatus) {
    if (Object.keys(patch).length === 0) {
      return current;
    }

    const { data, error } = await supabaseAdmin
      .from("payment_transactions")
      .update(patch)
      .eq("id", transactionId)
      .select(PAYMENT_TRANSACTION_SELECT)
      .single<PaymentTransactionRow>();

    if (error || !data) {
      throw new Error("Failed to update payment transaction details");
    }

    return data;
  }

  if (!canTransitionPaymentStatus(currentStatus, targetStatus)) {
    throw new Error(`Invalid payment transition: ${currentStatus} -> ${targetStatus}`);
  }

  const { data, error } = await supabaseAdmin
    .from("payment_transactions")
    .update({ status: targetStatus, ...patch })
    .eq("id", transactionId)
    .eq("status", currentStatus)
    .select(PAYMENT_TRANSACTION_SELECT)
    .maybeSingle<PaymentTransactionRow>();

  if (error) {
    throw new Error("Failed to update payment transaction status");
  }

  if (data) {
    return data;
  }

  const latest = await fetchPaymentTransactionById(supabaseAdmin, transactionId);
  const latestStatus = parsePaymentStatus(latest.status);

  if (latestStatus === targetStatus) {
    return latest;
  }

  throw new Error("Payment transaction status changed unexpectedly");
}

async function createCheckoutWithProvider(
  provider: PaymentProvider,
  transaction: PaymentTransactionRow
): Promise<CheckoutResult> {
  if (provider === "mock") {
    return {
      status: "succeeded",
      providerReference: `mock_${transaction.id}`,
      message: "Mock checkout succeeded",
    };
  }

  return {
    status: "requires_action",
    message: `${provider} provider contract is ready. Add SDK + API calls in lib/payments/service.ts:createCheckoutWithProvider.`,
  };
}

async function markExpiredActiveTransactionsForBuyerItem(
  supabaseAdmin: SupabaseAdminClient,
  buyerId: string,
  itemId: string
) {
  const nowIso = nowIsoString();
  await supabaseAdmin
    .from("payment_transactions")
    .update({
      status: "cancelled",
      cancelled_at: nowIso,
      reservation_expires_at: null,
      checkout_url: null,
      error_message: "Checkout session expired",
    })
    .eq("buyer_id", buyerId)
    .eq("item_id", itemId)
    .is("order_id", null)
    .in("status", ACTIVE_STATUS_LIST)
    .lt("reservation_expires_at", nowIso);
}

async function runCheckoutForCreatedTransaction(
  supabaseAdmin: SupabaseAdminClient,
  transaction: PaymentTransactionRow,
  provider: PaymentProvider
): Promise<StartCheckoutResult> {
  const checkout = await createCheckoutWithProvider(provider, transaction);

  const metadata = mergeMetadata(transaction.metadata, {
    checkout_message: checkout.message ?? null,
  });

  if (checkout.status === "failed") {
    const updated = await transitionPaymentTransactionStatus({
      supabaseAdmin,
      transactionId: transaction.id,
      targetStatus: "failed",
      patch: {
        provider_reference: checkout.providerReference ?? null,
        checkout_url: checkout.checkoutUrl ?? null,
        metadata,
        error_message: checkout.message ?? "Checkout failed",
        failed_at: nowIsoString(),
        reservation_expires_at: null,
      },
    });

    return {
      transactionId: updated.id,
      idempotencyKey: updated.idempotency_key ?? undefined,
      status: "failed",
      provider,
      message: updated.error_message ?? checkout.message ?? "Checkout failed",
    };
  }

  if (checkout.status === "cancelled") {
    const updated = await transitionPaymentTransactionStatus({
      supabaseAdmin,
      transactionId: transaction.id,
      targetStatus: "cancelled",
      patch: {
        provider_reference: checkout.providerReference ?? null,
        checkout_url: checkout.checkoutUrl ?? null,
        metadata,
        error_message: checkout.message ?? "Checkout cancelled",
        cancelled_at: nowIsoString(),
        reservation_expires_at: null,
      },
    });

    return {
      transactionId: updated.id,
      idempotencyKey: updated.idempotency_key ?? undefined,
      status: "cancelled",
      provider,
      message: updated.error_message ?? checkout.message ?? "Checkout cancelled",
    };
  }

  if (checkout.status === "requires_action" || checkout.status === "processing") {
    const updated = await transitionPaymentTransactionStatus({
      supabaseAdmin,
      transactionId: transaction.id,
      targetStatus: checkout.status,
      patch: {
        provider_reference: checkout.providerReference ?? null,
        checkout_url: checkout.checkoutUrl ?? null,
        metadata,
        error_message: null,
        failed_at: null,
        cancelled_at: null,
      },
    });

    return {
      transactionId: updated.id,
      idempotencyKey: updated.idempotency_key ?? undefined,
      status: checkout.status,
      provider,
      checkoutUrl: updated.checkout_url ?? checkout.checkoutUrl,
      message: checkout.message,
    };
  }

  await transitionPaymentTransactionStatus({
    supabaseAdmin,
    transactionId: transaction.id,
    targetStatus: "succeeded",
    patch: {
      provider_reference: checkout.providerReference ?? null,
      checkout_url: checkout.checkoutUrl ?? null,
      metadata,
      error_message: null,
      failed_at: null,
      cancelled_at: null,
    },
  });

  const finalized = await finalizeMarketplacePaymentTransaction(transaction.id);

  return {
    transactionId: transaction.id,
    idempotencyKey: transaction.idempotency_key ?? undefined,
    status: "succeeded",
    provider,
    orderId: finalized.orderId,
    message: checkout.message,
  };
}

async function resumeExistingTransaction(
  supabaseAdmin: SupabaseAdminClient,
  transaction: PaymentTransactionRow
): Promise<StartCheckoutResult> {
  const provider = toPaymentProvider(transaction.provider);
  const status = parsePaymentStatus(transaction.status);

  if (transaction.order_id) {
    return {
      transactionId: transaction.id,
      idempotencyKey: transaction.idempotency_key ?? undefined,
      status: "succeeded",
      provider,
      orderId: transaction.order_id,
      message: "Using existing successful transaction",
    };
  }

  if (status === "succeeded") {
    const finalized = await finalizeMarketplacePaymentTransaction(transaction.id);
    return {
      transactionId: transaction.id,
      idempotencyKey: transaction.idempotency_key ?? undefined,
      status: "succeeded",
      provider,
      orderId: finalized.orderId,
      message: "Payment already captured. Order finalized.",
    };
  }

  if (status === "created") {
    return runCheckoutForCreatedTransaction(supabaseAdmin, transaction, provider);
  }

  if (status === "requires_action" || status === "processing") {
    return toStartCheckoutResultFromActiveTransaction(transaction, status, transaction.error_message ?? undefined);
  }

  return {
    transactionId: transaction.id,
    idempotencyKey: transaction.idempotency_key ?? undefined,
    status: "failed",
    provider,
    message: transaction.error_message ?? "Previous checkout attempt ended. Start a new checkout.",
  };
}

async function tryCreatePaymentTransaction(params: {
  supabaseAdmin: SupabaseAdminClient;
  provider: PaymentProvider;
  buyerId: string;
  sellerId: string;
  itemId: string;
  amount: number;
  idempotencyKey: string;
}): Promise<PaymentTransactionRow> {
  const { supabaseAdmin, provider, buyerId, sellerId, itemId, amount, idempotencyKey } = params;

  const startedAt = new Date();
  const { data, error } = await supabaseAdmin
    .from("payment_transactions")
    .insert({
      provider,
      status: "created",
      buyer_id: buyerId,
      seller_id: sellerId,
      item_id: itemId,
      amount,
      currency: "INR",
      metadata: { source: "marketplace_buy_button" },
      idempotency_key: idempotencyKey,
      checkout_started_at: startedAt.toISOString(),
      reservation_expires_at: reservationExpiryIso(startedAt),
    })
    .select(PAYMENT_TRANSACTION_SELECT)
    .single<PaymentTransactionRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to create payment transaction");
  }

  return data;
}

export async function markPaymentTransactionFailed(transactionId: string, reason: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const current = await fetchPaymentTransactionById(supabaseAdmin, transactionId);
  const currentStatus = parsePaymentStatus(current.status);
  const failureReason = reason.trim() || "Payment marked as failed";

  if (currentStatus === "failed") {
    await supabaseAdmin
      .from("payment_transactions")
      .update({
        error_message: failureReason,
        failed_at: current.failed_at ?? nowIsoString(),
        reservation_expires_at: null,
      })
      .eq("id", transactionId);
    return;
  }

  if (!canTransitionPaymentStatus(currentStatus, "failed")) {
    throw new Error(`Cannot mark transaction as failed from status: ${currentStatus}`);
  }

  await transitionPaymentTransactionStatus({
    supabaseAdmin,
    transactionId,
    targetStatus: "failed",
    patch: {
      failed_at: nowIsoString(),
      error_message: failureReason,
      reservation_expires_at: null,
    },
  });
}

export async function markPaymentTransactionCancelled(transactionId: string, reason: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const current = await fetchPaymentTransactionById(supabaseAdmin, transactionId);
  const currentStatus = parsePaymentStatus(current.status);
  const cancelledReason = reason.trim() || "Payment marked as cancelled";

  if (currentStatus === "cancelled") {
    await supabaseAdmin
      .from("payment_transactions")
      .update({
        error_message: cancelledReason,
        cancelled_at: current.cancelled_at ?? nowIsoString(),
        reservation_expires_at: null,
      })
      .eq("id", transactionId);
    return;
  }

  if (!canTransitionPaymentStatus(currentStatus, "cancelled")) {
    throw new Error(`Cannot cancel transaction from status: ${currentStatus}`);
  }

  await transitionPaymentTransactionStatus({
    supabaseAdmin,
    transactionId,
    targetStatus: "cancelled",
    patch: {
      cancelled_at: nowIsoString(),
      error_message: cancelledReason,
      reservation_expires_at: null,
    },
  });
}

export async function finalizeMarketplacePaymentTransaction(transactionId: string): Promise<{ orderId: string }> {
  const supabaseAdmin = createSupabaseAdminClient();

  let tx = await fetchPaymentTransactionById(supabaseAdmin, transactionId);
  if (tx.order_id) {
    return { orderId: tx.order_id };
  }

  const initialStatus = parsePaymentStatus(tx.status);
  if (initialStatus === "failed" || initialStatus === "cancelled" || initialStatus === "refunded") {
    throw new Error("Transaction cannot be finalized");
  }

  if (initialStatus !== "processing" && initialStatus !== "succeeded") {
    tx = await transitionPaymentTransactionStatus({
      supabaseAdmin,
      transactionId,
      targetStatus: "processing",
      patch: {
        error_message: null,
      },
    });
  }

  const { data: lockedItem, error: lockError } = await supabaseAdmin
    .from("marketplace_items")
    .update({ is_sold: true })
    .eq("id", tx.item_id)
    .eq("is_sold", false)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (lockError || !lockedItem) {
    const refreshed = await fetchPaymentTransactionById(supabaseAdmin, transactionId);
    if (refreshed.order_id) {
      return { orderId: refreshed.order_id };
    }

    const refreshedStatus = parsePaymentStatus(refreshed.status);
    if (canTransitionPaymentStatus(refreshedStatus, "failed")) {
      await transitionPaymentTransactionStatus({
        supabaseAdmin,
        transactionId,
        targetStatus: "failed",
        patch: {
          failed_at: nowIsoString(),
          error_message: "Item no longer available",
          reservation_expires_at: null,
        },
      });
    } else {
      await supabaseAdmin
        .from("payment_transactions")
        .update({ error_message: "Item no longer available" })
        .eq("id", transactionId);
    }

    throw new Error("Item is no longer available");
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("marketplace_orders")
    .insert({
      item_id: tx.item_id,
      buyer_id: tx.buyer_id,
      seller_id: tx.seller_id,
      price: toNumber(tx.amount),
      status: "paid",
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    await supabaseAdmin
      .from("marketplace_items")
      .update({ is_sold: false })
      .eq("id", tx.item_id)
      .eq("is_sold", true);

    const refreshed = await fetchPaymentTransactionById(supabaseAdmin, transactionId);
    const refreshedStatus = parsePaymentStatus(refreshed.status);

    if (canTransitionPaymentStatus(refreshedStatus, "failed")) {
      await transitionPaymentTransactionStatus({
        supabaseAdmin,
        transactionId,
        targetStatus: "failed",
        patch: {
          failed_at: nowIsoString(),
          error_message: "Order creation failed after payment",
          reservation_expires_at: null,
        },
      });
    } else {
      await supabaseAdmin
        .from("payment_transactions")
        .update({ error_message: "Order creation failed after payment" })
        .eq("id", transactionId);
    }

    throw new Error("Failed to create marketplace order");
  }

  const finalizedAt = nowIsoString();

  try {
    await transitionPaymentTransactionStatus({
      supabaseAdmin,
      transactionId,
      targetStatus: "succeeded",
      patch: {
        order_id: order.id,
        paid_at: finalizedAt,
        error_message: null,
        failed_at: null,
        cancelled_at: null,
        reservation_expires_at: null,
      },
    });
  } catch {
    const { error: fallbackError } = await supabaseAdmin
      .from("payment_transactions")
      .update({
        order_id: order.id,
        paid_at: finalizedAt,
        error_message: "Order created, but payment status update requires manual review",
        reservation_expires_at: null,
      })
      .eq("id", transactionId);

    if (fallbackError) {
      throw new Error("Order created, but payment transaction update failed");
    }
  }

  return { orderId: order.id };
}

export async function startMarketplaceCheckoutForItem(params: {
  itemId: string;
  buyerId: string;
  idempotencyKey?: string;
}): Promise<StartCheckoutResult> {
  const { itemId, buyerId, idempotencyKey } = params;
  const supabaseAdmin = createSupabaseAdminClient();
  const provider = getConfiguredProvider();

  const normalizedIdempotencyKey = idempotencyKey
    ? validateIdempotencyKey(idempotencyKey)
    : generatedIdempotencyKey();

  const { data: item, error: itemError } = await supabaseAdmin
    .from("marketplace_items")
    .select("id, price, seller_id, is_published, is_sold")
    .eq("id", itemId)
    .single<{
      id: string;
      price: number | string;
      seller_id: string;
      is_published: boolean;
      is_sold: boolean;
    }>();

  if (itemError || !item || !item.is_published || item.is_sold) {
    throw new Error("Item not available");
  }

  if (item.seller_id === buyerId) {
    throw new Error("You cannot buy your own item");
  }

  const amount = toNumber(item.price);
  if (amount < 0) {
    throw new Error("Invalid item price");
  }

  await markExpiredActiveTransactionsForBuyerItem(supabaseAdmin, buyerId, item.id);

  const idempotentTx = await findPaymentTransactionByIdempotency(
    supabaseAdmin,
    buyerId,
    normalizedIdempotencyKey
  );

  if (idempotentTx) {
    if (idempotentTx.item_id !== item.id) {
      throw new Error("Idempotency key already used for another item");
    }

    return resumeExistingTransaction(supabaseAdmin, idempotentTx);
  }

  const activeTx = await findActiveTransactionForBuyerItem(supabaseAdmin, buyerId, item.id);
  if (activeTx) {
    return resumeExistingTransaction(supabaseAdmin, activeTx);
  }

  let createdTx: PaymentTransactionRow;
  try {
    createdTx = await tryCreatePaymentTransaction({
      supabaseAdmin,
      provider,
      buyerId,
      sellerId: item.seller_id,
      itemId: item.id,
      amount,
      idempotencyKey: normalizedIdempotencyKey,
    });
  } catch (error: unknown) {
    if (!isUniqueViolation(error)) {
      throw new Error("Failed to create payment transaction");
    }

    const retryByIdempotency = await findPaymentTransactionByIdempotency(
      supabaseAdmin,
      buyerId,
      normalizedIdempotencyKey
    );

    if (retryByIdempotency) {
      return resumeExistingTransaction(supabaseAdmin, retryByIdempotency);
    }

    const retryActive = await findActiveTransactionForBuyerItem(supabaseAdmin, buyerId, item.id);
    if (retryActive) {
      return resumeExistingTransaction(supabaseAdmin, retryActive);
    }

    throw new Error("Failed to reserve checkout transaction");
  }

  return runCheckoutForCreatedTransaction(supabaseAdmin, createdTx, provider);
}

export async function processPaymentWebhookEvent(params: {
  provider: PaymentProvider;
  payload: Record<string, unknown>;
}): Promise<{ handled: boolean; message: string }> {
  const { provider, payload } = params;
  const supabaseAdmin = createSupabaseAdminClient();

  const eventId =
    typeof payload.id === "string"
      ? payload.id
      : typeof payload.event_id === "string"
        ? payload.event_id
        : crypto.randomUUID();
  const eventType =
    typeof payload.type === "string"
      ? payload.type
      : typeof payload.event_type === "string"
        ? payload.event_type
        : "unknown";

  const { data: createdEvent, error: eventInsertError } = await supabaseAdmin
    .from("payment_webhook_events")
    .insert({
      provider,
      event_id: eventId,
      event_type: eventType,
      payload,
      status: "received",
    })
    .select("id")
    .single<{ id: string }>();

  if (eventInsertError) {
    if (isUniqueViolation(eventInsertError, "payment_webhook_events_provider_event_unique_idx")) {
      return { handled: true, message: "Duplicate webhook event ignored" };
    }

    throw new Error("Failed to persist payment webhook event");
  }

  const webhookEventRowId = createdEvent.id;

  async function finalizeWebhookEvent(
    status: "processed" | "ignored" | "failed",
    message?: string
  ) {
    await supabaseAdmin
      .from("payment_webhook_events")
      .update({
        status,
        processed_at: nowIsoString(),
        error_message: message ?? null,
      })
      .eq("id", webhookEventRowId);
  }

  try {
    if (provider === "mock") {
      const transactionId =
        typeof payload.transactionId === "string" ? payload.transactionId : null;
      const status = typeof payload.status === "string" ? payload.status : null;

      if (!transactionId || !status) {
        await finalizeWebhookEvent("failed", "Missing transactionId or status for mock webhook");
        return { handled: false, message: "Missing transactionId or status for mock webhook" };
      }

      if (status === "succeeded") {
        await finalizeMarketplacePaymentTransaction(transactionId);
        await finalizeWebhookEvent("processed");
        return { handled: true, message: "Mock webhook processed: transaction succeeded" };
      }

      if (status === "failed") {
        await markPaymentTransactionFailed(transactionId, "Marked failed by mock webhook");
        await finalizeWebhookEvent("processed");
        return { handled: true, message: "Mock webhook processed: transaction failed" };
      }

      if (status === "cancelled") {
        await markPaymentTransactionCancelled(transactionId, "Marked cancelled by mock webhook");
        await finalizeWebhookEvent("processed");
        return { handled: true, message: "Mock webhook processed: transaction cancelled" };
      }

      await finalizeWebhookEvent("ignored", "Unsupported mock webhook status");
      return { handled: false, message: "Unsupported mock webhook status" };
    }

    await finalizeWebhookEvent(
      "ignored",
      `${provider} webhook contract is ready. Add signature validation and status mapping in lib/payments/service.ts.`
    );

    return {
      handled: false,
      message: `${provider} webhook contract is ready. Add signature validation and status mapping in lib/payments/service.ts.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    await finalizeWebhookEvent("failed", message);
    return { handled: false, message };
  }
}

export function isPendingPaymentStatus(status: string): boolean {
  return isPaymentStatus(status) && isActivePaymentStatus(status);
}
