import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database.types';

export const profileService = {
  async updateProfile(userId: string, input: Partial<Pick<ProfileRow, 'full_name' | 'avatar_url'>>) {
    const { error } = await supabase.from('profiles').update(input).eq('id', userId);
    if (error) throw error;
  },

  /** Chemin conforme à la policy RLS storage: avatars/{userId}/... */
  async uploadAvatar(userId: string, file: File) {
    const path = `${userId}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },
};
