import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, PlayCircle, Lock, Circle } from 'lucide-react';
import { academyService } from '@/features/academy/services/academyService';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['academy', 'course', courseId, session?.user.id],
    queryFn: () => academyService.getCourseWithLockStatus(courseId!, session?.user.id),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const modules = data?.modules ?? [];
  const lockMap = data?.lockMap ?? new Map<string, boolean>();
  const completedIds = data?.completedIds ?? new Set<string>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Parcours</h1>

      <div className="space-y-4">
        {modules.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle className="text-base">{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {module.lessons
                ?.slice()
                .sort((a, b) => a.position - b.position)
                .map((lesson) => {
                  const isLocked = !lesson.published || lockMap.get(lesson.id) === true;
                  const isCompleted = completedIds.has(lesson.id);

                  const content = (
                    <>
                      {!lesson.published ? (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : lockMap.get(lesson.id) ? (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="flex-1">{lesson.title}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </>
                  );

                  if (isLocked) {
                    return (
                      <div
                        key={lesson.id}
                        className="flex cursor-not-allowed items-center gap-3 rounded-md border border-border p-3 text-sm text-muted-foreground opacity-60"
                        title={
                          !lesson.published
                            ? 'Leçon pas encore disponible'
                            : 'Termine la leçon précédente pour débloquer celle-ci'
                        }
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={lesson.id}
                      to={`/academy/lesson/${lesson.id}`}
                      className={cn(
                        'flex items-center gap-3 rounded-md border border-border p-3 text-sm text-foreground transition-colors hover:bg-muted',
                      )}
                    >
                      {content}
                    </Link>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
