import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { ProgressRow, ProgressStatus } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface ProgressItem extends ProgressRow {
  lessons: {
    title: string;
    module_id: string;
    modules: {
      title: string;
      course_id: string;
      courses: { title: string } | null;
    } | null;
  } | null;
}

async function getAllProgress(userId: string) {
  const { data, error } = await supabase
    .from('progress')
    .select('*, lessons(title, module_id, modules(title, course_id, courses(title)))')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as unknown as ProgressItem[];
}

const statusIcon: Record<ProgressStatus, ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  in_progress: <PlayCircle className="h-4 w-4 text-primary" />,
  not_started: <Circle className="h-4 w-4 text-muted-foreground" />,
};

const statusLabel: Record<ProgressStatus, string> = {
  completed: 'Terminée',
  in_progress: 'En cours',
  not_started: 'Non commencée',
};

export function ProgressPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['progress', 'all', session?.user.id],
    queryFn: () => getAllProgress(session!.user.id),
    enabled: !!session,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Progression</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner />
          ) : data && data.length > 0 ? (
            <div className="space-y-2">
              {data.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                  {statusIcon[item.status]}
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.lessons?.title ?? 'Leçon'}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.lessons?.modules?.courses?.title} · {item.lessons?.modules?.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{statusLabel[item.status]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune activité pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
