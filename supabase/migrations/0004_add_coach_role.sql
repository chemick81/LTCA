-- =========================================================================
-- LTCA — Ajout du rôle COACH
-- COACH = accès complet au contenu (cours/modules/leçons/blocs/annonces) +
-- vue sur la progression de tous les étudiants, MAIS aucune gestion des
-- comptes/rôles utilisateurs (réservé à ADMIN — is_admin() reste utilisé
-- pour la table profiles).
-- =========================================================================

alter type user_role add value if not exists 'COACH';

create or replace function can_edit_content()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('ADMIN', 'COACH')
  );
$$ language sql security definer stable set search_path = public;

-- ---------- courses ----------
drop policy if exists "courses_select_published_or_admin" on courses;
create policy "courses_select_published_or_staff" on courses
  for select using (published or can_edit_content());

drop policy if exists "courses_admin_write" on courses;
create policy "courses_staff_write" on courses
  for all using (can_edit_content()) with check (can_edit_content());

-- ---------- modules ----------
drop policy if exists "modules_select_via_course" on modules;
create policy "modules_select_via_course_staff" on modules
  for select using (
    can_edit_content() or exists (
      select 1 from courses c where c.id = modules.course_id and c.published
    )
  );

drop policy if exists "modules_admin_write" on modules;
create policy "modules_staff_write" on modules
  for all using (can_edit_content()) with check (can_edit_content());

-- ---------- lessons ----------
drop policy if exists "lessons_select_published_or_admin" on lessons;
create policy "lessons_select_published_or_staff" on lessons
  for select using (published or can_edit_content());

drop policy if exists "lessons_admin_write" on lessons;
create policy "lessons_staff_write" on lessons
  for all using (can_edit_content()) with check (can_edit_content());

-- ---------- lesson_blocks ----------
drop policy if exists "lesson_blocks_select_via_lesson" on lesson_blocks;
create policy "lesson_blocks_select_via_lesson_staff" on lesson_blocks
  for select using (
    can_edit_content() or exists (
      select 1 from lessons l where l.id = lesson_blocks.lesson_id and l.published
    )
  );

drop policy if exists "lesson_blocks_admin_write" on lesson_blocks;
create policy "lesson_blocks_staff_write" on lesson_blocks
  for all using (can_edit_content()) with check (can_edit_content());

-- ---------- announcements ----------
drop policy if exists "announcements_admin_write" on announcements;
create policy "announcements_staff_write" on announcements
  for all using (can_edit_content()) with check (can_edit_content());

-- ---------- progress : COACH/ADMIN voient la progression de tous ----------
drop policy if exists "progress_owner_select" on progress;
create policy "progress_select_own_or_staff" on progress
  for select using (user_id = auth.uid() or can_edit_content());

-- ---------- Storage : écriture des buckets de contenu ouverte à COACH aussi ----------
drop policy if exists "admin_write_ltca_buckets" on storage.objects;
create policy "staff_write_ltca_buckets" on storage.objects
  for insert with check (
    bucket_id in ('videos', 'documents', 'images', 'course-covers', 'logos')
    and can_edit_content()
  );

drop policy if exists "admin_update_ltca_buckets" on storage.objects;
create policy "staff_update_ltca_buckets" on storage.objects
  for update using (
    bucket_id in ('videos', 'documents', 'images', 'course-covers', 'logos')
    and can_edit_content()
  );

drop policy if exists "admin_delete_ltca_buckets" on storage.objects;
create policy "staff_delete_ltca_buckets" on storage.objects
  for delete using (
    bucket_id in ('videos', 'documents', 'images', 'course-covers', 'logos')
    and can_edit_content()
  );

-- Note: la table `profiles` (gestion des comptes/rôles) reste strictement
-- réservée à is_admin() — aucun changement ici, c'est volontaire.
