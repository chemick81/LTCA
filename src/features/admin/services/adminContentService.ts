import { supabase } from '@/lib/supabase';
import type { ModuleRow, LessonRow, LessonBlockRow, LessonBlockType } from '@/types/database.types';

export const adminContentService = {
  // ---------- Modules ----------
  async listModules(courseId: string) {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('position');
    if (error) throw error;
    return data as ModuleRow[];
  },

  async createModule(courseId: string, title: string, position: number) {
    const { data, error } = await supabase
      .from('modules')
      .insert({ course_id: courseId, title, description: null, position })
      .select()
      .single();
    if (error) throw error;
    return data as ModuleRow;
  },

  async updateModule(id: string, input: Partial<Pick<ModuleRow, 'title' | 'description' | 'position'>>) {
    const { error } = await supabase.from('modules').update(input).eq('id', id);
    if (error) throw error;
  },

  async deleteModule(id: string) {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------- Lessons ----------
  async listLessons(moduleId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('position');
    if (error) throw error;
    return data as LessonRow[];
  },

  async getLesson(id: string) {
    const { data, error } = await supabase.from('lessons').select('*').eq('id', id).single();
    if (error) throw error;
    return data as LessonRow;
  },

  async createLesson(moduleId: string, title: string, position: number) {
    const { data, error } = await supabase
      .from('lessons')
      .insert({ module_id: moduleId, title, position, performance_outcome: null, published: false })
      .select()
      .single();
    if (error) throw error;
    return data as LessonRow;
  },

  async updateLesson(
    id: string,
    input: Partial<Pick<LessonRow, 'title' | 'performance_outcome' | 'position' | 'published'>>,
  ) {
    const { error } = await supabase.from('lessons').update(input).eq('id', id);
    if (error) throw error;
  },

  async deleteLesson(id: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------- Lesson blocks ----------
  async listBlocks(lessonId: string) {
    const { data, error } = await supabase
      .from('lesson_blocks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('position');
    if (error) throw error;
    return data as LessonBlockRow[];
  },

  async createBlock(lessonId: string, type: LessonBlockType, title: string | null, content: unknown, position: number) {
    const { data, error } = await supabase
      .from('lesson_blocks')
      .insert({ lesson_id: lessonId, type, title, content, position })
      .select()
      .single();
    if (error) throw error;
    return data as LessonBlockRow;
  },

  async updateBlock(
    id: string,
    input: Partial<Pick<LessonBlockRow, 'type' | 'title' | 'content' | 'position'>>,
  ) {
    const { error } = await supabase.from('lesson_blocks').update(input).eq('id', id);
    if (error) throw error;
  },

  async deleteBlock(id: string) {
    const { error } = await supabase.from('lesson_blocks').delete().eq('id', id);
    if (error) throw error;
  },
};
