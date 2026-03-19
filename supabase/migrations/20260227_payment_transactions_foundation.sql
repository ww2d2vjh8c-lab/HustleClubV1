-- Payment transactions foundation (provider-agnostic)
-- Run after baseline migration.

begin;

set local search_path = public, extensions;

create table if not exists public.payment_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null default 'mock',
  provider_reference text,
  status text not null default 'created',
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  order_id uuid references public.marketplace_orders(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  checkout_url text,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  failed_at timestamptz
);

alter table public.payment_transactions add column if not exists provider text not null default 'mock';
alter table public.payment_transactions add column if not exists provider_reference text;
alter table public.payment_transactions add column if not exists status text not null default 'created';
alter table public.payment_transactions add column if not exists buyer_id uuid;
alter table public.payment_transactions add column if not exists seller_id uuid;
alter table public.payment_transactions add column if not exists item_id uuid;
alter table public.payment_transactions add column if not exists order_id uuid;
alter table public.payment_transactions add column if not exists amount numeric(12,2);
alter table public.payment_transactions add column if not exists currency text not null default 'INR';
alter table public.payment_transactions add column if not exists checkout_url text;
alter table public.payment_transactions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.payment_transactions add column if not exists error_message text;
alter table public.payment_transactions add column if not exists created_at timestamptz not null default now();
alter table public.payment_transactions add column if not exists updated_at timestamptz not null default now();
alter table public.payment_transactions add column if not exists paid_at timestamptz;
alter table public.payment_transactions add column if not exists failed_at timestamptz;

create table if not exists public.payment_webhook_events (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payment_webhook_events add column if not exists provider text;
alter table public.payment_webhook_events add column if not exists event_id text;
alter table public.payment_webhook_events add column if not exists event_type text;
alter table public.payment_webhook_events add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.payment_webhook_events add column if not exists status text not null default 'received';
alter table public.payment_webhook_events add column if not exists processed_at timestamptz;
alter table public.payment_webhook_events add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_transactions_status_chk'
      and conrelid = 'public.payment_transactions'::regclass
  ) then
    alter table public.payment_transactions
      add constraint payment_transactions_status_chk
      check (
        status in (
          'created',
          'requires_action',
          'processing',
          'succeeded',
          'failed',
          'cancelled',
          'refunded'
        )
      );
  end if;
end
$$;

drop trigger if exists trg_payment_transactions_set_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_set_updated_at
before update on public.payment_transactions
for each row execute function public.set_updated_at();

create index if not exists payment_transactions_buyer_idx
  on public.payment_transactions (buyer_id, created_at desc);

create index if not exists payment_transactions_seller_idx
  on public.payment_transactions (seller_id, created_at desc);

create index if not exists payment_transactions_status_idx
  on public.payment_transactions (status, created_at desc);

create index if not exists payment_transactions_item_idx
  on public.payment_transactions (item_id);

create unique index if not exists payment_transactions_order_unique_idx
  on public.payment_transactions (order_id)
  where order_id is not null;

create unique index if not exists payment_transactions_provider_ref_unique_idx
  on public.payment_transactions (provider, provider_reference)
  where provider_reference is not null;

create index if not exists payment_webhook_events_created_idx
  on public.payment_webhook_events (created_at desc);

create unique index if not exists payment_webhook_events_provider_event_unique_idx
  on public.payment_webhook_events (provider, event_id);

alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

drop policy if exists payment_transactions_select_scope on public.payment_transactions;
create policy payment_transactions_select_scope
on public.payment_transactions
for select
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists payment_transactions_insert_scope on public.payment_transactions;
create policy payment_transactions_insert_scope
on public.payment_transactions
for insert
with check (
  public.is_admin(auth.uid())
  or (
    buyer_id = auth.uid()
    and buyer_id <> seller_id
  )
);

drop policy if exists payment_transactions_update_admin on public.payment_transactions;
create policy payment_transactions_update_admin
on public.payment_transactions
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists payment_transactions_delete_admin on public.payment_transactions;
create policy payment_transactions_delete_admin
on public.payment_transactions
for delete
using (public.is_admin(auth.uid()));

drop policy if exists payment_webhook_events_select_admin on public.payment_webhook_events;
create policy payment_webhook_events_select_admin
on public.payment_webhook_events
for select
using (public.is_admin(auth.uid()));

drop policy if exists payment_webhook_events_insert_admin on public.payment_webhook_events;
create policy payment_webhook_events_insert_admin
on public.payment_webhook_events
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists payment_webhook_events_update_admin on public.payment_webhook_events;
create policy payment_webhook_events_update_admin
on public.payment_webhook_events
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists payment_webhook_events_delete_admin on public.payment_webhook_events;
create policy payment_webhook_events_delete_admin
on public.payment_webhook_events
for delete
using (public.is_admin(auth.uid()));

commit;
