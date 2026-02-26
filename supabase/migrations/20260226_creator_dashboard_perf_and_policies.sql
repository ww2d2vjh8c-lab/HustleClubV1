-- Creator dashboard follow-up migration
-- Run this after baseline migration to optimize creator dashboard queries.

begin;

-- ---------------------------------------------------------------------------
-- Performance indexes for creator dashboard pages
-- ---------------------------------------------------------------------------

create index if not exists jobs_creator_open_created_idx
  on public.jobs (creator_id, is_open, created_at desc);

create index if not exists courses_creator_status_created_idx
  on public.courses (creator_id, status, created_at desc);

create index if not exists marketplace_items_seller_state_created_idx
  on public.marketplace_items (seller_id, is_published, is_sold, created_at desc);

create index if not exists marketplace_orders_seller_status_created_idx
  on public.marketplace_orders (seller_id, status, created_at desc);

create index if not exists marketplace_orders_buyer_status_created_idx
  on public.marketplace_orders (buyer_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Ensure creator can manage seller order lifecycle (paid -> shipped)
-- ---------------------------------------------------------------------------

alter table public.marketplace_orders enable row level security;

drop policy if exists marketplace_orders_select_scope on public.marketplace_orders;
create policy marketplace_orders_select_scope
on public.marketplace_orders
for select
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists marketplace_orders_update_scope on public.marketplace_orders;
create policy marketplace_orders_update_scope
on public.marketplace_orders
for update
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
  or public.is_admin(auth.uid())
);

commit;
