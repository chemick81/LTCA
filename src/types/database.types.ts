// Types manuels reflétant le schéma supabase/migrations/0001_init.sql
// À terme, régénérer avec: supabase gen types typescript --local > src/types/database.types.ts

export type UserRole = 'ADMIN' | 'STUDENT';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type LessonBlockType =
  | 'content'
  | 'video'
  | 'quiz'
  | 'feedback'
  | 'flashcard'
  | 'hotspot_image'
  | 'drag_drop'
  | 'interactive_slideshow'
  | 'ai_dialogue';

interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface ProfileRow extends Timestamps {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
}

export interface CourseRow extends Timestamps {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  position: number;
  published: boolean;
}

export interface ModuleRow extends Timestamps {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
}

export interface LessonRow extends Timestamps {
  id: string;
  module_id: string;
  title: string;
  position: number;
  performance_outcome: string | null;
  published: boolean;
}

export interface LessonBlockRow extends Timestamps {
  id: string;
  lesson_id: string;
  type: LessonBlockType;
  title: string | null;
  content: unknown; // JSONB — voir src/features/lesson/types.ts pour les schémas discriminés
  position: number;
}

export interface QuizRow extends Timestamps {
  id: string;
  lesson_block_id: string;
  title: string | null;
}

export interface QuizQuestionRow extends Timestamps {
  id: string;
  quiz_id: string;
  type: 'multiple_choice' | 'fill_blank';
  question: string;
  position: number;
}

export interface QuizAnswerRow extends Timestamps {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  position: number;
}

export interface ProgressRow extends Timestamps {
  id: string;
  user_id: string;
  lesson_id: string;
  status: ProgressStatus;
  progress_percent: number;
  completed_at: string | null;
}

export interface NoteRow extends Timestamps {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
}

export interface AnnouncementRow extends Timestamps {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
}

export interface FeedbackResponseRow extends Timestamps {
  id: string;
  user_id: string;
  lesson_block_id: string;
  rating: number | null;
  free_text: string | null;
}

export interface SettingRow extends Timestamps {
  id: string;
  key: string;
  value: unknown;
}

// Le type Database générique minimal utilisé par le client supabase-js typé.
// Simplifié: Insert = Row sans id/created_at/updated_at (optionnels), Update = Partial.
type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row> & Omit<Row, 'id' | 'created_at' | 'updated_at'>;
  Update: Partial<Row>;
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      courses: TableDef<CourseRow>;
      modules: TableDef<ModuleRow>;
      lessons: TableDef<LessonRow>;
      lesson_blocks: TableDef<LessonBlockRow>;
      quizzes: TableDef<QuizRow>;
      quiz_questions: TableDef<QuizQuestionRow>;
      quiz_answers: TableDef<QuizAnswerRow>;
      progress: TableDef<ProgressRow>;
      notes: TableDef<NoteRow>;
      announcements: TableDef<AnnouncementRow>;
      settings: TableDef<SettingRow>;
      feedback_responses: TableDef<FeedbackResponseRow>;
    };
  };
}
