import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database.types';

interface AuthContextValue {
  session: Session | null;
  profile: ProfileRow | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  /** ADMIN ou COACH — accès à l'édition du contenu et à la progression de tous les étudiants. */
  canEditContent: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      console.error('Erreur chargement profil', error);
      setProfile(null);
      return;
    }
    setProfile(data as ProfileRow);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session) {
        void loadProfile(data.session.user.id).finally(() => isMounted && setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        void loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value: AuthContextValue = {
    session,
    profile,
    isLoading,
    isAdmin: profile?.role === 'ADMIN',
    isCoach: profile?.role === 'COACH',
    canEditContent: profile?.role === 'ADMIN' || profile?.role === 'COACH',
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
