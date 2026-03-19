-- Fix marketplace storage bucket RLS policies.
-- The previous UPDATE and DELETE policies allowed any authenticated user to
-- overwrite or delete any other user's marketplace images. We now restrict
-- to the image owner by matching the first path segment against auth.uid().
--
-- Upload paths must use {userId}/{uuid} format (enforced by ImageUploader.tsx).

drop policy if exists marketplace_update_authenticated on storage.objects;
drop policy if exists marketplace_delete_authenticated on storage.objects;

create policy marketplace_update_owner
  on storage.objects
  for update
  using (
    bucket_id = 'marketplace'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'marketplace'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy marketplace_delete_owner
  on storage.objects
  for delete
  using (
    bucket_id = 'marketplace'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );
