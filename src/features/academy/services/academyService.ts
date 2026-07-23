import { supabase } from '@/lib/supabase';
import type { ModuleRow, LessonRow } from '@/types/database.types';

export interface ModuleWithLessons extends ModuleRow {
  lessons: LessonRow[];
}

export const academyService = {
  async getPublishedCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('published', true)
      .order('position', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getCourseWithModulesAndLessons(courseId: string) {
    const { data, error } = await supabase
      .from('modules')
      .select('*, lessons(*)')
      .eq('course_id', courseId)
      .order('position', { ascending: true });
    if (error) throw error;
    return data as unknown as ModuleWithLessons[];
  },
};
