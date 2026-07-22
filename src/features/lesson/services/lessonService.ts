import { supabase } from '@/lib/supabase';
import type { ProgressStatus } from '@/types/database.types';

export const lessonService = {
  async getLessonWithBlocks(lessonId: string) {
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    if (lessonError) throw lessonError;

    const { data: blocks, error: blocksError } = await supabase
      .from('lesson_blocks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });
    if (blocksError) throw blocksError;

    return { lesson, blocks };
  },

  async getQuizWithQuestions(quizId: string) {
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('*, quiz_answers(*)')
      .eq('quiz_id', quizId)
      .order('position', { ascending: true });
    if (error) throw error;
    return questions;
  },

  async upsertProgress(userId: string, lessonId: string, status: ProgressStatus, progressPercent: number) {
    const { error } = await supabase.from('progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status,
        progress_percent: progressPercent,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,lesson_id' },
    );
    if (error) throw error;
  },

  async submitFeedback(userId: string, lessonBlockId: string, rating: number | null, freeText: string | null) {
    const { error } = await supabase.from('feedback_responses').insert({
      user_id: userId,
      lesson_block_id: lessonBlockId,
      rating,
      free_text: freeText,
    });
    if (error) throw error;
  },
};
