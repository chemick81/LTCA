import { useState } from 'react';
import { getErrorMessage } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { adminService } from '@/features/admin/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: adminService.listAnnouncements,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminService.createAnnouncement({ title, content, published_at: new Date().toISOString() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      setTitle('');
      setContent('');
      toast.success('Annonce publiée');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteAnnouncement(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle annonce</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim() && content.trim()) createMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="a-title">Titre</Label>
              <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-content">Contenu</Label>
              <textarea
                id="a-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Publier
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Annonces publiées</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner />
          ) : announcements && announcements.length > 0 ? (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.content}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune annonce.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
