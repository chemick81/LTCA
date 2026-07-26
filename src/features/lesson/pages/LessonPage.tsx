import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { lessonService } from '@/features/lesson/services/lessonService';
import { academyService } from '@/features/academy/services/academyService';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { BlockRenderer } from '@/features/lesson/components/BlockRenderer';
import { LessonNotes } from '@/features/lesson/components/LessonNotes';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonService.getLessonWithBlocks(lessonId!),
    enabled: !!lessonId,
  });

  const { data: progress } = useQuery({
    queryKey: ['lesson-progress', lessonId, userId],
    queryFn: () => lessonService.getProgress(userId!, lessonId!),
    enabled: !!userId && !!lessonId,
  });

  // Garde-fou : re-vérifie le verrouillage séquentiel côté client, au cas où
  // l'étudiant accèderait directement par URL sans passer par CourseDetailPage.
  const { data: breadcrumb } = useQuery({
    queryKey: ['lesson-breadcrumb', lessonId],
    queryFn: () => adminContentService.getBreadcrumb(lessonId!),
    enabled: !!lessonId,
    retry: false,
  });

  const { data: lockData, isLoading: isLockLoading } = useQuery({
    queryKey: ['lesson-lock', breadcrumb?.courseId, userId],
    queryFn: () => academyService.getCourseWithLockStatus(breadcrumb!.courseId, userId),
    enabled: !!breadcrumb?.courseId,
  });

  const isLocked = !!lessonId && lockData?.lockMap.get(lessonId) === true;

  // Marque la leçon comme "in_progress" dès l'ouverture (sauf si déjà terminée ou verrouillée).
  useEffect(() => {
    if (session && lessonId && progress?.status !== 'completed' && !isLocked) {
      lessonService.upsertProgress(session.user.id, lessonId, 'in_progress', 10).catch((err) => {
        console.error('Erreur lors du marquage in_progress', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, lessonId, isLocked]);

  function invalidateProgressQueries() {
    void queryClient.invalidateQueries({ queryKey: ['lesson-progress', lessonId] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['progress'] });
  }

  async function handleMarkComplete() {
    if (!session || !lessonId) {
      toast.error('Tu dois être connecté pour valider cette leçon.');
      return;
    }
    setIsSaving(true);
    try {
      await lessonService.upsertProgress(session.user.id, lessonId, 'completed', 100);
      toast.success('Leçon marquée comme terminée !');
      invalidateProgressQueries();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isLockLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">Impossible de charger cette leçon.</p>;
  }

  if (isLocked) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Cette leçon est verrouillée</p>
        <p className="text-sm text-muted-foreground">
          Termine la leçon précédente du parcours pour la débloquer.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/academy">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'Academy
          </Link>
        </Button>
      </div>
    );
  }

  const { lesson, blocks } = data;
  const isCompleted = progress?.status === 'completed';

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

      <LessonNotes lessonId={lessonId!} />

      <div className="border-t border-border pt-6">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            Leçon terminée
          </div>
        ) : (
          <Button onClick={handleMarkComplete} disabled={isSaving}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isSaving ? 'Enregistrement...' : 'Marquer comme terminée'}
          </Button>
        )}
      </div>
    </div>
  );
}
