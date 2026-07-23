import { supabase } from '@/lib/supabase';
import type { ProgressRow, AnnouncementRow, ProgressStatus } from '@/types/database.types';

interface InProgressLessonItem extends ProgressRow {
  lessons: { id: string; title: string; module_id: string } | null;
}

export const dashboardService = {
  async getAnnouncements(limit = 5) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as AnnouncementRow[];
  },

  async getInProgressLessons(userId: string) {
    const { data, error } = await supabase
      .from('progress')
      .select('*, lessons(id, title, module_id)')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(3);
    if (error) throw error;
    return data as unknown as InProgressLessonItem[];
  },

  async getOverallProgress(userId: string) {
    const { data, error } = await supabase.from('progress').select('status').eq('user_id', userId);
    if (error) throw error;
    const rows = data as { status: ProgressStatus }[];
    const total = rows.length;
    const completed = rows.filter((p) => p.status === 'completed').length;
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  },
};

// Citation du jour : contenu statique côté client pour la V1.
// TODO: déplacer vers la table `settings` (clé "quotes") pour édition via l'Admin.
const QUOTES = [
  'Le marché ne récompense pas l\'intelligence, il récompense la discipline.',
  'La tendance est ton amie, jusqu\'à ce qu\'elle se retourne.',
  'Le risque vient de ne pas savoir ce que l\'on fait.',
  'Le meilleur trade est parfois celui que l\'on ne prend pas.',
];

export function getQuoteOfTheDay(): string {
  const dayIndex = new Date().getDate() % QUOTES.length;
  return QUOTES[dayIndex] ?? QUOTES[0]!;
}
