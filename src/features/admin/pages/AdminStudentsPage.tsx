import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

function formatDate(iso: string | null): string {
  if (!iso) return 'Jamais';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AdminStudentsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ['admin', 'students-progress'],
    queryFn: adminContentService.listStudentsProgress,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suivi des étudiants</h1>
        <p className="text-sm text-muted-foreground">Progression de tous les étudiants inscrits.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            {students?.length ?? 0} étudiant{(students?.length ?? 0) > 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner />
          ) : students && students.length > 0 ? (
            <div className="space-y-3">
              {students.map((s) => {
                const percent =
                  s.totalLessons > 0 ? Math.round((s.completedLessons / s.totalLessons) * 100) : 0;
                return (
                  <div key={s.userId} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.fullName ?? s.email}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{s.completedLessons} terminées · {s.inProgressLessons} en cours</p>
                        <p>Dernière activité : {formatDate(s.lastActivityAt)}</p>
                      </div>
                    </div>
                    <Progress value={percent} className="mt-2" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun étudiant inscrit pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
