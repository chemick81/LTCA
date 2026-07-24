import { supabase } from '@/lib/supabase';
import type { ModuleRow, LessonRow, LessonBlockRow, LessonBlockType } from '@/types/database.types';

export interface LessonBreadcrumb {
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
}

export const adminContentService = {
  async uploadImage(file: File) {
    const path = `content/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, '-')}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  },

  async getBreadcrumb(lessonId: string): Promise<LessonBreadcrumb> {
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('title, module_id')
      .eq('id', lessonId)
      .single();
    if (lessonError) throw lessonError;

    const { data: mod, error: moduleError } = await supabase
      .from('modules')
      .select('title, course_id')
      .eq('id', (lesson as { module_id: string }).module_id)
      .single();
    if (moduleError) throw moduleError;

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', (mod as { course_id: string }).course_id)
      .single();
    if (courseError) throw courseError;

    return {
      courseId: (course as { id: string }).id,
      courseTitle: (course as { title: string }).title,
      moduleTitle: (mod as { title: string }).title,
      lessonTitle: (lesson as { title: string }).title,
    };
  },

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

  /** Insère un bloc à un index donné (0-based) parmi une liste déjà triée, en décalant les positions suivantes. */
  async insertBlockAt(
    lessonId: string,
    existingSorted: LessonBlockRow[],
    index: number,
    type: LessonBlockType,
    content: unknown,
  ) {
    const before = existingSorted.slice(0, index);
    const after = existingSorted.slice(index);
    // Repositionne tout en séquence pour garder des positions propres 0..n
    await Promise.all(before.map((b, i) => supabase.from('lesson_blocks').update({ position: i }).eq('id', b.id)));
    const { error: insertError } = await supabase
      .from('lesson_blocks')
      .insert({ lesson_id: lessonId, type, title: null, content, position: before.length });
    if (insertError) throw insertError;
    await Promise.all(
      after.map((b, i) => supabase.from('lesson_blocks').update({ position: before.length + 1 + i }).eq('id', b.id)),
    );
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
