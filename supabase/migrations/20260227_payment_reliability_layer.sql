-- Payment reliability layer
-- Run after 20260227_payment_transactions_foundation.sql

begin;

set local search_path = public, extensions;

alter table public.payment_transactions
  add column if not exists idempotency_key text;

alter table public.payment_transactions
  add column if not exists checkout_started_at timestamptz;

alter table public.payment_transactions
  add column if not exists reservation_expires_at timestamptz;

alter table public.payment_transactions
  add column if not exists cancelled_at timestamptz;

alter table public.payment_transactions
  add column if not exists refunded_at timestamptz;

update public.payment_transactions
set checkout_started_at = coalesce(checkout_started_at, created_at),
    reservation_expires_at = coalesce(
      reservation_expires_at,
      case
        when status in ('created', 'requires_action', 'processing')
          then created_at + interval '30 minutes'
        else null
      end
    )
where checkout_started_at is null
   or reservation_expires_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_transactions_idempotency_key_chk'
      and conrelid = 'public.payment_transactions'::regclass
  ) then
    alter table public.payment_transactions
      add constraint payment_transactions_idempotency_key_chk
      check (
        idempotency_key is null
        or char_length(idempotency_key) between 8 and 128
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_transactions_reservation_window_chk'
      and conrelid = 'public.payment_transactions'::regclass
  ) then
    alter table public.payment_transactions
      add constraint payment_transactions_reservation_window_chk
      check (
        reservation_expires_at is null
        or reservation_expires_at > coalesce(checkout_started_at, created_at)
      );
  end if;
end
$$;

create unique index if not exists payment_transactions_buyer_idempotency_unique_idx
  on public.payment_transactions (buyer_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists payment_transactions_active_buyer_item_unique_idx
  on public.payment_transactions (buyer_id, item_id)
  where status in ('created', 'requires_action', 'processing')
    and order_id is null;

create index if not exists payment_transactions_active_reservation_idx
  on public.payment_transactions (status, reservation_expires_at)
  where status in ('created', 'requires_action', 'processing');

create index if not exists payment_transactions_item_status_created_idx
  on public.payment_transactions (item_id, status, created_at desc);

alter table public.payment_webhook_events
  add column if not exists error_message text;

alter table public.payment_webhook_events
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_webhook_events_status_chk'
      and conrelid = 'public.payment_webhook_events'::regclass
  ) then
    alter table public.payment_webhook_events
      add constraint payment_webhook_events_status_chk
      check (status in ('received', 'processed', 'ignored', 'failed'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_webhook_events_processed_chk'
      and conrelid = 'public.payment_webhook_events'::regclass
  ) then
    alter table public.payment_webhook_events
      add constraint payment_webhook_events_processed_chk
      check (
        (status = 'received' and processed_at is null)
        or (status <> 'received' and processed_at is not null)
      );
  end if;
end
$$;

drop trigger if exists trg_payment_webhook_events_set_updated_at on public.payment_webhook_events;
create trigger trg_payment_webhook_events_set_updated_at
before update on public.payment_webhook_events
for each row execute function public.set_updated_at();

create index if not exists payment_webhook_events_status_created_idx
  on public.payment_webhook_events (status, created_at desc);

create index if not exists payment_webhook_events_provider_status_created_idx
  on public.payment_webhook_events (provider, status, created_at desc);

commit;
