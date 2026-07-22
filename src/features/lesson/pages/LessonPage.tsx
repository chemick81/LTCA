import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { lessonService } from '@/features/lesson/services/lessonService';
import { BlockRenderer } from '@/features/lesson/components/BlockRenderer';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { session } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonService.getLessonWithBlocks(lessonId!),
    enabled: !!lessonId,
  });

  // Marque la leçon comme "in_progress" dès l'ouverture.
  useEffect(() => {
    if (session && lessonId) {
      void lessonService.upsertProgress(session.user.id, lessonId, 'in_progress', 10);
    }
  }, [session, lessonId]);

  async function handleMarkComplete() {
    if (!session || !lessonId) return;
    await lessonService.upsertProgress(session.user.id, lessonId, 'completed', 100);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">Impossible de charger cette leçon.</p>;
  }

  const { lesson, blocks } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Button asChild variant="ghost" size="sm">
        <Link to="/academy">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'Academy
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
        {lesson.performance_outcome && (
          <p className="mt-1 text-sm text-muted-foreground">{lesson.performance_outcome}</p>
        )}
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Le contenu de cette leçon n'est pas encore disponible.
        </p>
      ) : (
        <div className="space-y-10">
          {blocks.map((block) => (
            <div key={block.id}>
              {block.title && <h2 className="mb-3 text-lg font-semibold text-foreground">{block.title}</h2>}
              <BlockRenderer block={block} />
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-6">
        <Button onClick={handleMarkComplete}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Marquer comme terminée
        </Button>
      </div>
    </div>
  );
}
