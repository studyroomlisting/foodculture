-- ============================================================================
-- MIGRATION 012 — Create the Storage buckets the app has always assumed
-- exist ("avatars" and "listing-images"), plus RLS policies for them.
--
-- Root cause of both "photo upload not working" reports: lib/storage.ts and
-- app/api/profile/avatar/route.ts upload into buckets named 'listing-images'
-- and 'avatars', but no migration ever created those buckets. Supabase
-- Storage buckets aren't implied by application code — they're rows in
-- storage.buckets, same as any other table, and must be created explicitly
-- (via SQL here, or the dashboard). Without the bucket:
--   - listing photo upload (ImageUploader -> lib/storage.ts, browser/anon
--     key) fails and is swallowed silently (uploadListingImage returns
--     null on error, no banner is shown) — looked like "nothing happens".
--   - avatar upload (/api/profile/avatar, service-role key) returns the
--     upload error as JSON -> surfaced in the UI as "Upload failed."
--
-- Both buckets are public because both code paths call getPublicUrl() and
-- render the result directly as an <img src>.
--
-- Run AFTER migration_011_fix_listing_update_recursion.sql.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('listing-images', 'listing-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─── avatars ────────────────────────────────────────────────────────────────
-- Uploads always go through /api/profile/avatar with the service role key
-- (bypasses RLS), which writes to `avatars/{user_id}.{ext}`. These policies
-- are a safety net, not load-bearing for the current upload path.
drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users manage own avatar" on storage.objects;
create policy "users manage own avatar" on storage.objects for all
  using (bucket_id = 'avatars' and name like 'avatars/' || auth.uid()::text || '.%')
  with check (bucket_id = 'avatars' and name like 'avatars/' || auth.uid()::text || '.%');

-- ─── listing-images ────────────────────────────────────────────────────────
-- Uploaded directly from the browser (anon key) by lib/storage.ts, at
-- `{restaurant_id}/{timestamp}.{ext}` — so RLS here is load-bearing: only
-- the restaurant's own owner may upload into / delete from its folder.
drop policy if exists "public read listing images" on storage.objects;
create policy "public read listing images" on storage.objects for select
  using (bucket_id = 'listing-images');

-- NOTE: `storage.objects.name` is qualified explicitly below. `restaurants`
-- also has a column called `name` — an unqualified `name` inside the `exists`
-- subquery resolves to `r.name` (the restaurant's name) instead of the
-- object's path, the same ambiguous-reference trap fixed in migration_011,
-- and silently blocks every upload (including the owner's own).
drop policy if exists "owners upload listing images" on storage.objects;
create policy "owners upload listing images" on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(storage.objects.name))[1]
        and r.owner_id = auth.uid()
    )
  );

drop policy if exists "owners delete listing images" on storage.objects;
create policy "owners delete listing images" on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(storage.objects.name))[1]
        and r.owner_id = auth.uid()
    )
  );
