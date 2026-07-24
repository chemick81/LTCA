import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, FileEdit, GripVertical, Check } from 'lucide-react';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { EditableTitle } from '@/features/admin/components/EditableTitle';
import type { ModuleRow, LessonRow } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';


function LessonListItem({
  lesson,
  onRenamed,
  onTogglePublish,
  onDeleted,
}: {
  lesson: LessonRow;
  onRenamed: (title: string) => void;
  onTogglePublish: () => void;
  onDeleted: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border p-2">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{lesson.position}.</span>
      <EditableTitle value={lesson.title} onSave={onRenamed} className="flex-1 text-sm text-foreground" />
      <Button variant="ghost" size="sm" onClick={onTogglePublish}>
        {lesson.published ? 'Publiée' : 'Brouillon'}
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to={`/admin/lessons/${lesson.id}`}>
          <FileEdit className="mr-1 h-3.5 w-3.5" />
          Éditer
        </Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={onDeleted}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function ModuleCard({ module, onDeleted }: { module: ModuleRow; onDeleted: () => void }) {
  const queryClient = useQueryClient();
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const moduleId = module.id;

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['admin', 'lessons', moduleId],
    queryFn: () => adminContentService.listLessons(moduleId),
  });

  function invalidateLessons() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', moduleId] });
  }

  const renameModuleMutation = useMutation({
    mutationFn: (title: string) => adminContentService.updateModule(moduleId, { title }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const createLessonMutation = useMutation({
    mutationFn: (title: string) => adminContentService.createLesson(moduleId, title, (lessons?.length ?? 0) + 1),
    onSuccess: () => {
      invalidateLessons();
      setNewLessonTitle('');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const renameLessonMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => adminContentService.updateLesson(id, { title }),
    onSuccess: invalidateLessons,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => adminContentService.deleteLesson(id),
    onSuccess: invalidateLessons,
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      adminContentService.updateLesson(id, { published }),
    onSuccess: invalidateLessons,
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <EditableTitle
          value={module.title}
          onSave={(title) => renameModuleMutation.mutate(title)}
          className="text-base font-semibold"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm(`Supprimer le module "${module.title}" et toutes ses leçons ?`)) onDeleted();
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Spinner />
        ) : (
          lessons?.map((lesson) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              onRenamed={(title) => renameLessonMutation.mutate({ id: lesson.id, title })}
              onTogglePublish={() => togglePublishMutation.mutate({ id: lesson.id, published: !lesson.published })}
              onDeleted={() => {
                if (confirm(`Supprimer "${lesson.title}" ?`)) deleteLessonMutation.mutate(lesson.id);
              }}
            />
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

  function invalidateModules() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'modules', courseId] });
  }

  const createModuleMutation = useMutation({
    mutationFn: (title: string) =>
      adminContentService.createModule(courseId!, title, (modules?.length ?? 0) + 1),
    onSuccess: () => {
      invalidateModules();
      setNewModuleTitle('');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => adminContentService.deleteModule(id),
    onSuccess: () => {
      invalidateModules();
      toast.success('Module supprimé');
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
      <p className="text-xs text-muted-foreground">
        <Check className="mr-1 inline h-3 w-3" />
        Clique sur un titre pour le renommer directement.
      </p>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {modules?.map((m) => (
            <ModuleCard key={m.id} module={m} onDeleted={() => deleteModuleMutation.mutate(m.id)} />
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
