-- =========================================================================
-- LTCA — Migration initiale
-- Schéma + triggers updated_at + trigger auto-création profil + RLS.
-- Les policies RLS ci-dessous sont un PREMIER JET pragmatique
-- (le brief indique "policies détaillées à définir — pas encore tranché").
-- Modèle retenu pour V1 : STUDENT lit le contenu publié + gère ses propres
-- données (progress/notes/feedback) ; ADMIN a un accès total en écriture.
-- =========================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Types ----------
create type user_role as enum ('ADMIN', 'STUDENT');
create type progress_status as enum ('not_started', 'in_progress', 'completed');
create type lesson_block_type as enum (
  'content', 'video', 'quiz', 'feedback', 'flashcard',
  'hotspot_image', 'drag_drop',
  'interactive_slideshow', 'ai_dialogue'
);
create type quiz_question_type as enum ('multiple_choice', 'fill_blank');

-- ---------- Tables ----------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'STUDENT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_url text,
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  performance_outcome text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  type lesson_block_type not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_block_id uuid not null references lesson_blocks(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  type quiz_question_type not null,
  question text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status progress_status not null default 'not_started',
  progress_percent integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table feedback_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_block_id uuid not null references lesson_blocks(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  free_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Index ----------
create index idx_modules_course_id on modules(course_id);
create index idx_lessons_module_id on lessons(module_id);
create index idx_lesson_blocks_lesson_id on lesson_blocks(lesson_id);
create index idx_quiz_questions_quiz_id on quiz_questions(quiz_id);
create index idx_quiz_answers_question_id on quiz_answers(question_id);
create index idx_progress_user_id on progress(user_id);
create index idx_progress_lesson_id on progress(lesson_id);
create index idx_notes_user_id on notes(user_id);
create index idx_feedback_responses_block_id on feedback_responses(lesson_block_id);

-- ---------- Trigger updated_at générique ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles','courses','modules','lessons','lesson_blocks',
      'quizzes','quiz_questions','quiz_answers','progress','notes',
      'feedback_responses','announcements','settings'
    ])
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------- Trigger création auto du profil à l'inscription ----------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'STUDENT'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Helper: l'utilisateur courant est-il ADMIN ? ----------
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$ language sql security definer stable set search_path = public;

-- =========================================================================
-- RLS — activé sur toutes les tables
-- =========================================================================
alter table profiles enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table lesson_blocks enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table progress enable row level security;
alter table notes enable row level security;
alter table feedback_responses enable row level security;
alter table announcements enable row level security;
alter table settings enable row level security;

-- ---------- profiles ----------
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on profiles
  for all using (is_admin()) with check (is_admin());

-- ---------- courses / modules / lessons / lesson_blocks ----------
-- Lecture : contenu publié pour tous les utilisateurs connectés, tout pour ADMIN.
-- Écriture : réservée à ADMIN.
create policy "courses_select_published_or_admin" on courses
  for select using (published or is_admin());
create policy "courses_admin_write" on courses
  for all using (is_admin()) with check (is_admin());

create policy "modules_select_via_course" on modules
  for select using (
    is_admin() or exists (
      select 1 from courses c where c.id = modules.course_id and c.published
    )
  );
create policy "modules_admin_write" on modules
  for all using (is_admin()) with check (is_admin());

create policy "lessons_select_published_or_admin" on lessons
  for select using (published or is_admin());
create policy "lessons_admin_write" on lessons
  for all using (is_admin()) with check (is_admin());

create policy "lesson_blocks_select_via_lesson" on lesson_blocks
  for select using (
    is_admin() or exists (
      select 1 from lessons l where l.id = lesson_blocks.lesson_id and l.published
    )
  );
create policy "lesson_blocks_admin_write" on lesson_blocks
  for all using (is_admin()) with check (is_admin());

-- ---------- quizzes / quiz_questions / quiz_answers ----------
create policy "quizzes_select_all_authenticated" on quizzes
  for select using (auth.uid() is not null);
create policy "quizzes_admin_write" on quizzes
  for all using (is_admin()) with check (is_admin());

create policy "quiz_questions_select_all_authenticated" on quiz_questions
  for select using (auth.uid() is not null);
create policy "quiz_questions_admin_write" on quiz_questions
  for all using (is_admin()) with check (is_admin());

create policy "quiz_answers_select_all_authenticated" on quiz_answers
  for select using (auth.uid() is not null);
create policy "quiz_answers_admin_write" on quiz_answers
  for all using (is_admin()) with check (is_admin());

-- ---------- progress ----------
create policy "progress_owner_select" on progress
  for select using (user_id = auth.uid() or is_admin());
create policy "progress_owner_write" on progress
  for insert with check (user_id = auth.uid());
create policy "progress_owner_update" on progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress_admin_delete" on progress
  for delete using (is_admin());

-- ---------- notes ----------
create policy "notes_owner_select" on notes
  for select using (user_id = auth.uid() or is_admin());
create policy "notes_owner_write" on notes
  for insert with check (user_id = auth.uid());
create policy "notes_owner_update" on notes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notes_owner_delete" on notes
  for delete using (user_id = auth.uid() or is_admin());

-- ---------- feedback_responses ----------
create policy "feedback_owner_select" on feedback_responses
  for select using (user_id = auth.uid() or is_admin());
create policy "feedback_owner_insert" on feedback_responses
  for insert with check (user_id = auth.uid());
create policy "feedback_admin_delete" on feedback_responses
  for delete using (is_admin());

-- ---------- announcements ----------
create policy "announcements_select_all_authenticated" on announcements
  for select using (auth.uid() is not null);
create policy "announcements_admin_write" on announcements
  for all using (is_admin()) with check (is_admin());

-- ---------- settings ----------
create policy "settings_select_all_authenticated" on settings
  for select using (auth.uid() is not null);
create policy "settings_admin_write" on settings
  for all using (is_admin()) with check (is_admin());
