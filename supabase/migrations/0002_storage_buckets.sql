-- =========================================================================
-- LTCA — Buckets Storage + policies de base
-- =========================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('videos', 'videos', true),
  ('documents', 'documents', true),
  ('images', 'images', true),
  ('course-covers', 'course-covers', true),
  ('logos', 'logos', true)
on conflict (id) do nothing;

-- Lecture publique pour tous ces buckets (contenu de formation, logos, etc.)
create policy "public_read_ltca_buckets" on storage.objects
  for select using (
    bucket_id in ('avatars', 'videos', 'documents', 'images', 'course-covers', 'logos')
  );

-- Écriture réservée aux ADMIN, sauf avatars où chaque utilisateur gère le sien
-- (convention de chemin attendue: avatars/{user_id}/...)
create policy "admin_write_ltca_buckets" on storage.objects
  for insert with check (
    bucket_id in ('videos', 'documents', 'images', 'course-covers', 'logos')
    and is_admin()
  );

create policy "admin_update_ltca_buckets" on storage.objects
  for update using (
    bucket_id in ('videos', 'documents', 'images', 'course-covers', 'logos')
    and is_admin()
  );

create policy "admin_delete_ltca_buckets" on storage.objects
  for delete using (
    bucket_id in ('videos', 'documents', 'images', 'course-covers', 'logos')
    and is_admin()
  );

create policy "user_write_own_avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_update_own_avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_delete_own_avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
