import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, FolderOpen, Pencil, Upload, X, Check } from 'lucide-react';
import { adminService } from '@/features/admin/services/adminService';
import type { CourseRow } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

function CourseEditForm({ course, onDone }: { course: CourseRow; onDone: () => void }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(course.title);
  const [slug, setSlug] = useState(course.slug);
  const [description, setDescription] = useState(course.description ?? '');
  const [coverUrl, setCoverUrl] = useState(course.cover_url ?? '');
  const [isUploading, setIsUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminService.updateCourse(course.id, {
        title,
        slug,
        description: description || null,
        cover_url: coverUrl || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast.success('Parcours mis à jour');
      onDone();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await adminService.uploadCourseCover(course.id, file);
      setCoverUrl(url);
      toast.success('Image envoyée');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de l\'envoi');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-md border border-primary/40 bg-primary/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Titre</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug (URL)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Image de couverture</Label>
        <div className="flex items-center gap-3">
          {coverUrl && <img src={coverUrl} alt="" className="h-16 w-28 rounded-md border border-border object-cover" />}
          <div className="flex-1 space-y-2">
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL de l'image" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Upload className="mr-2 h-3.5 w-3.5" />
              {isUploading ? 'Envoi...' : 'Envoyer une image'}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Check className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          <X className="mr-2 h-4 w-4" />
          Annuler
        </Button>
      </div>
    </div>
  );
}

export function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

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
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      setTitle('');
      setEditingId(created.id);
      toast.success('Parcours créé — complète les infos ci-dessous');
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
              {courses.map((course) =>
                editingId === course.id ? (
                  <CourseEditForm key={course.id} course={course} onDone={() => setEditingId(null)} />
                ) : (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {course.cover_url && (
                        <img src={course.cover_url} alt="" className="h-10 w-16 rounded object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground">/{course.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(course.id)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Éditer
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/admin/courses/${course.id}`}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Gérer le contenu
                        </Link>
                      </Button>
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
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun parcours pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
