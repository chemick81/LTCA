import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, FileEdit, GripVertical } from 'lucide-react';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

function ModuleCard({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const queryClient = useQueryClient();
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['admin', 'lessons', moduleId],
    queryFn: () => adminContentService.listLessons(moduleId),
  });

  const createLessonMutation = useMutation({
    mutationFn: (title: string) => adminContentService.createLesson(moduleId, title, (lessons?.length ?? 0) + 1),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', moduleId] });
      setNewLessonTitle('');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => adminContentService.deleteLesson(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', moduleId] }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      adminContentService.updateLesson(id, { published }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', moduleId] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{moduleTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Spinner />
        ) : (
          lessons?.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-2 rounded-md border border-border p-2">
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">
                {lesson.position}. {lesson.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePublishMutation.mutate({ id: lesson.id, published: !lesson.published })}
              >
                {lesson.published ? 'Publiée' : 'Brouillon'}
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={`/admin/lessons/${lesson.id}`}>
                  <FileEdit className="mr-1 h-3.5 w-3.5" />
                  Éditer
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`Supprimer "${lesson.title}" ?`)) deleteLessonMutation.mutate(lesson.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
        <form
          className="flex items-center gap-2 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newLessonTitle.trim()) createLessonMutation.mutate(newLessonTitle.trim());
          }}
        >
          <Input
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            placeholder="Titre de la nouvelle leçon"
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={createLessonMutation.isPending}>
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const { data: modules, isLoading } = useQuery({
    queryKey: ['admin', 'modules', courseId],
    queryFn: () => adminContentService.listModules(courseId!),
    enabled: !!courseId,
  });

  const createModuleMutation = useMutation({
    mutationFn: (title: string) =>
      adminContentService.createModule(courseId!, title, (modules?.length ?? 0) + 1),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
      setNewModuleTitle('');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux parcours
        </Link>
      </Button>

      <h1 className="text-2xl font-bold text-foreground">Contenu du parcours</h1>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {modules?.map((m) => (
            <ModuleCard key={m.id} moduleId={m.id} moduleTitle={`${m.position}. ${m.title}`} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau module</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newModuleTitle.trim()) createModuleMutation.mutate(newModuleTitle.trim());
            }}
          >
            <Input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Titre du module"
              className="flex-1"
            />
            <Button type="submit" disabled={createModuleMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
