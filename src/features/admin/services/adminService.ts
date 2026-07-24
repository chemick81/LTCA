import { supabase } from '@/lib/supabase';
import type { CourseRow, AnnouncementRow } from '@/types/database.types';

export const adminService = {
  async listCourses() {
    const { data, error } = await supabase.from('courses').select('*').order('position');
    if (error) throw error;
    return data as CourseRow[];
  },

  async createCourse(input: Pick<CourseRow, 'title' | 'slug' | 'description' | 'position' | 'published'>) {
    const { data, error } = await supabase.from('courses').insert(input).select().single();
    if (error) throw error;
    return data as CourseRow;
  },

  async updateCourse(id: string, input: Partial<CourseRow>) {
    const { data, error } = await supabase.from('courses').update(input).eq('id', id).select().single();
    if (error) throw error;
    return data as CourseRow;
  },

  async deleteCourse(id: string) {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  },

  async listAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data as AnnouncementRow[];
  },

  async createAnnouncement(input: Pick<AnnouncementRow, 'title' | 'content' | 'published_at'>) {
    const { data, error } = await supabase.from('announcements').insert(input).select().single();
    if (error) throw error;
    return data as AnnouncementRow;
  },

  async uploadCourseCover(courseId: string, file: File) {
    const path = `covers/${courseId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('course-covers')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('course-covers').getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteAnnouncement(id: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
  },
};
