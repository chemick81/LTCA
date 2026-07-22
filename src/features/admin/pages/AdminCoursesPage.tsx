import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { adminService } from '@/features/admin/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: adminService.listCourses,
  });

  const createMutation = useMutation({
    mutationFn: (newTitle: string) =>
      adminService.createCourse({
        title: newTitle,
        slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: null,
        position: (courses?.length ?? 0) + 1,
        published: false,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      setTitle('');
      toast.success('Parcours créé');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      adminService.updateCourse(id, { published }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCourse(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast.success('Parcours supprimé');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau parcours</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) createMutation.mutate(title.trim());
            }}
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcours existants</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner />
          ) : courses && courses.length > 0 ? (
            <div className="space-y-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">/{course.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        togglePublishMutation.mutate({ id: course.id, published: !course.published })
                      }
                    >
                      {course.published ? 'Dépublier' : 'Publier'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Supprimer "${course.title}" ?`)) deleteMutation.mutate(course.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun parcours pour le moment.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Note : la gestion des modules, leçons et blocs de contenu (drag & drop, quiz, etc.) sera ajoutée
        dans une itération suivante — cette page couvre le CRUD minimal des parcours pour la V1.
      </p>
    </div>
  );
}
