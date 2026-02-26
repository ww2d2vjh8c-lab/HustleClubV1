-- Enable realtime feeds used by /notifications live updates.
-- Safe to run after baseline migration.

begin;

alter table public.creator_requests replica identity full;
alter table public.job_applications replica identity full;
alter table public.marketplace_orders replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'creator_requests'
  ) then
    alter publication supabase_realtime add table public.creator_requests;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'job_applications'
  ) then
    alter publication supabase_realtime add table public.job_applications;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'marketplace_orders'
  ) then
    alter publication supabase_realtime add table public.marketplace_orders;
  end if;
end
$$;

commit;
