import { NextResponse } from "next/server";
import { processPaymentWebhookEvent, type PaymentProvider } from "@/lib/payments/service";

function parseProvider(value: string | null): PaymentProvider {
  const normalized = (value ?? process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (normalized === "stripe" || normalized === "razorpay" || normalized === "mock") {
    return normalized;
  }
  return "mock";
}

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[HustleClub] PAYMENT_WEBHOOK_SECRET is not set — webhook endpoint is insecure");
    }
    console.warn("[HustleClub] Warning: PAYMENT_WEBHOOK_SECRET is not set — accepting all webhook requests in development");
  } else {
    const incoming = request.headers.get("x-hustleclub-webhook-secret");
    if (incoming !== secret) {
      return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const provider = parseProvider(
    new URL(request.url).searchParams.get("provider") ??
      request.headers.get("x-payment-provider")
  );

  const result = await processPaymentWebhookEvent({ provider, payload });
  return NextResponse.json(result, { status: result.handled ? 200 : 202 });
}
