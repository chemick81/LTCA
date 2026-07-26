import { supabase } from '@/lib/supabase';
import type { ModuleRow, LessonRow, CourseRow } from '@/types/database.types';

export interface ModuleWithLessons extends ModuleRow {
  lessons: LessonRow[];
}

export interface CourseProgress {
  completed: number;
  total: number;
}

export const academyService = {
  async getPublishedCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('published', true)
      .order('position', { ascending: true });
    if (error) throw error;
    return data as CourseRow[];
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

  /**
   * Modules/leçons du cours + une Map<lessonId, isLocked> calculée sur la séquence
   * complète des leçons du cours (toutes modules confondus, triées par position) :
   * une leçon avec require_sequential=true est verrouillée tant que la précédente
   * de la séquence n'est pas "completed" pour cet utilisateur.
   */
  async getCourseWithLockStatus(courseId: string, userId: string | undefined) {
    const modules = await this.getCourseWithModulesAndLessons(courseId);
    const orderedLessons = modules.flatMap((m) => m.lessons.slice().sort((a, b) => a.position - b.position));

    let completedIds = new Set<string>();
    if (userId) {
      const { data, error } = await supabase
        .from('progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('status', 'completed');
      if (error) throw error;
      completedIds = new Set((data as { lesson_id: string }[]).map((r) => r.lesson_id));
    }

    const lockMap = new Map<string, boolean>();
    orderedLessons.forEach((lesson, index) => {
      const previous = orderedLessons[index - 1];
      const locked = !!lesson.require_sequential && index > 0 && !!previous && !completedIds.has(previous.id);
      lockMap.set(lesson.id, locked);
    });

    return { modules, lockMap, completedIds };
  },

  /** Nombre de leçons publiées / terminées par cours, pour l'utilisateur donné. */
  async getProgressByCourse(userId: string): Promise<Record<string, CourseProgress>> {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, published, modules(course_id)')
      .eq('published', true);
    if (lessonsError) throw lessonsError;

    const { data: progressRows, error: progressError } = await supabase
      .from('progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed');
    if (progressError) throw progressError;

    const completedLessonIds = new Set((progressRows as { lesson_id: string }[]).map((p) => p.lesson_id));

    const map: Record<string, CourseProgress> = {};
    for (const lesson of lessons as unknown as { id: string; modules: { course_id: string } | null }[]) {
      const courseId = lesson.modules?.course_id;
      if (!courseId) continue;
      map[courseId] ??= { completed: 0, total: 0 };
      map[courseId].total += 1;
      if (completedLessonIds.has(lesson.id)) map[courseId].completed += 1;
    }
    return map;
  },
};
