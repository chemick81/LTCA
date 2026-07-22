import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Quote, Megaphone, PlayCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { dashboardService, getQuoteOfTheDay } from '@/features/dashboard/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const { profile, session } = useAuth();
  const userId = session?.user.id;

  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['dashboard', 'progress', userId],
    queryFn: () => dashboardService.getOverallProgress(userId!),
    enabled: !!userId,
  });

  const { data: inProgress, isLoading: isLoadingInProgress } = useQuery({
    queryKey: ['dashboard', 'in-progress', userId],
    queryFn: () => dashboardService.getInProgressLessons(userId!),
    enabled: !!userId,
  });

  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['dashboard', 'announcements'],
    queryFn: () => dashboardService.getAnnouncements(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenue, {profile?.full_name?.split(' ')[0] ?? 'Trader'}
        </h1>
        <p className="text-sm text-muted-foreground">Continuez votre parcours EPB.</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Quote className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm italic text-foreground">{getQuoteOfTheDay()}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PlayCircle className="h-4 w-4 text-primary" />
              Continuer le parcours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingInProgress ? (
              <Spinner />
            ) : inProgress && inProgress.length > 0 ? (
              inProgress.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <span className="text-sm text-foreground">{item.lessons?.title ?? 'Leçon'}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/academy/lesson/${item.lesson_id}`}>Reprendre</Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Aucun parcours en cours. Direction l'Academy pour commencer.
                </p>
                <Button asChild size="sm">
                  <Link to="/academy">Voir l'Academy</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progression globale</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProgress ? (
              <Spinner />
            ) : (
              <div className="space-y-2">
                <Progress value={progressData?.percent ?? 0} />
                <p className="text-xs text-muted-foreground">
                  {progressData?.completed ?? 0} / {progressData?.total ?? 0} leçons terminées
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" />
            Annonces
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingAnnouncements ? (
            <Spinner />
          ) : announcements && announcements.length > 0 ? (
            announcements.map((a) => (
              <div key={a.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.content}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
