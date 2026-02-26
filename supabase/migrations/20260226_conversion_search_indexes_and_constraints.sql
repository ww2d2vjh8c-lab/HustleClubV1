-- Conversion/search optimization migration
-- Safe follow-up after baseline + creator dashboard migrations.

begin;

set local search_path = public, extensions;

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Data hygiene (protect numeric fields used in UI filters/sorting)
-- ---------------------------------------------------------------------------

update public.courses
set price = 0
where price < 0;

update public.jobs
set budget = 0
where budget < 0;

update public.marketplace_items
set price = 0
where price < 0;

update public.marketplace_orders
set price = 0
where price < 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'courses_price_nonnegative_chk'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_price_nonnegative_chk
      check (price >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_budget_nonnegative_chk'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_budget_nonnegative_chk
      check (budget is null or budget >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_items_price_nonnegative_chk'
      and conrelid = 'public.marketplace_items'::regclass
  ) then
    alter table public.marketplace_items
      add constraint marketplace_items_price_nonnegative_chk
      check (price >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_orders_price_nonnegative_chk'
      and conrelid = 'public.marketplace_orders'::regclass
  ) then
    alter table public.marketplace_orders
      add constraint marketplace_orders_price_nonnegative_chk
      check (price >= 0);
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Sort/filter indexes for public conversion pages
-- ---------------------------------------------------------------------------

create index if not exists courses_published_created_idx
  on public.courses (created_at desc)
  where status = 'published';

create index if not exists courses_published_price_idx
  on public.courses (price, created_at desc)
  where status = 'published';

create index if not exists jobs_open_created_idx
  on public.jobs (created_at desc)
  where is_open = true;

create index if not exists jobs_open_type_created_idx
  on public.jobs (type, created_at desc)
  where is_open = true;

create index if not exists marketplace_items_live_created_idx
  on public.marketplace_items (created_at desc)
  where is_published = true and is_sold = false;

create index if not exists marketplace_items_live_price_idx
  on public.marketplace_items (price, created_at desc)
  where is_published = true and is_sold = false;

-- ---------------------------------------------------------------------------
-- Search indexes for ilike-based listing pages
-- ---------------------------------------------------------------------------

create index if not exists courses_search_trgm_idx
  on public.courses
  using gin (
    (
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(instructor, '')
    ) gin_trgm_ops
  )
  where status = 'published';

create index if not exists jobs_search_trgm_idx
  on public.jobs
  using gin (
    (
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    ) gin_trgm_ops
  )
  where is_open = true;

create index if not exists marketplace_items_search_trgm_idx
  on public.marketplace_items
  using gin (
    (
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    ) gin_trgm_ops
  )
  where is_published = true and is_sold = false;

commit;
