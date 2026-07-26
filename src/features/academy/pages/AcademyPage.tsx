import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { academyService } from '@/features/academy/services/academyService';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function AcademyPage() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: courses, isLoading } = useQuery({
    queryKey: ['academy', 'courses'],
    queryFn: academyService.getPublishedCourses,
  });

  const { data: progressMap } = useQuery({
    queryKey: ['academy', 'progress', userId],
    queryFn: () => academyService.getProgressByCourse(userId!),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Academy</h1>
        <p className="text-sm text-muted-foreground">Tous les parcours de formation à la méthode EAR.</p>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const progress = progressMap?.[course.id];
            const percent = progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
            return (
              <Card key={course.id} className="flex flex-col overflow-hidden">
                {course.cover_url ? (
                  <img src={course.cover_url} alt={course.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-muted">
                    <GraduationCap className="h-10 w-10 text-primary/50" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  {course.description && <CardDescription>{course.description}</CardDescription>}
                </CardHeader>
                <CardContent className="flex-1 space-y-1.5">
                  {progress && progress.total > 0 && (
                    <>
                      <Progress value={percent} />
                      <p className="text-xs text-muted-foreground">
                        {progress.completed} / {progress.total} leçons terminées
                      </p>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/academy/course/${course.id}`}>
                      {percent > 0 ? 'Continuer le parcours' : 'Accéder au parcours'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun parcours publié pour le moment.</p>
      )}
    </div>
  );
}
