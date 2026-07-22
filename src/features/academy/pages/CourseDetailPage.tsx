import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, PlayCircle, Lock } from 'lucide-react';
import { academyService } from '@/features/academy/services/academyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['academy', 'course', courseId],
    queryFn: () => academyService.getCourseWithModulesAndLessons(courseId!),
    enabled: !!courseId,
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
      <h1 className="text-2xl font-bold text-foreground">Parcours</h1>

      <div className="space-y-4">
        {modules?.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle className="text-base">{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {module.lessons
                ?.slice()
                .sort((a, b) => a.position - b.position)
                .map((lesson) => (
                  <Link
                    key={lesson.id}
                    to={`/academy/lesson/${lesson.id}`}
                    className="flex items-center gap-3 rounded-md border border-border p-3 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    {lesson.published ? (
                      <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1">{lesson.title}</span>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
