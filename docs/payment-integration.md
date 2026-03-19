# Payment Integration Contract

HustleClub now uses a provider-agnostic payment layer so you can plug Stripe or Razorpay later without rewriting order flows.

## Current behavior

- Default provider is `mock` (`PAYMENT_PROVIDER` env, fallback `mock`).
- Buying from marketplace creates a `payment_transactions` row first.
- Mock provider instantly succeeds and finalizes:
  - locks listing (`marketplace_items.is_sold = true`)
  - creates `marketplace_orders` row with `status = paid`
  - marks transaction `succeeded`

## Files to update for real provider

- `lib/payments/service.ts`
  - `createCheckoutWithProvider(...)`
  - `processPaymentWebhookEvent(...)`

## Required env vars for production

- `PAYMENT_PROVIDER` (`mock` | `stripe` | `razorpay`)
- `PAYMENT_WEBHOOK_SECRET` (optional guard used by `/api/payments/webhook`)

Add provider-specific keys when implementing:
- Stripe: secret key, webhook secret, publishable key
- Razorpay: key id, key secret, webhook secret

## Webhook endpoint

- `POST /api/payments/webhook?provider=<provider>`
- Optional header guard:
  - `x-hustleclub-webhook-secret: <PAYMENT_WEBHOOK_SECRET>`

## Testing without gateway

- Use Admin -> Payments page (`/admin/payments`)
  - Mark transaction succeeded (finalizes order)
  - Mark transaction failed

## Database migration

Run:
- `supabase/migrations/20260227_payment_transactions_foundation.sql`

This creates:
- `payment_transactions`
- `payment_webhook_events`
- indexes + RLS + policies
