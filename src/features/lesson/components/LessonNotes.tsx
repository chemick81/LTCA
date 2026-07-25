import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StickyNote, Save } from 'lucide-react';
import { toast } from 'sonner';
import { lessonService } from '@/features/lesson/services/lessonService';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function LessonNotes({ lessonId }: { lessonId: string }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: note } = useQuery({
    queryKey: ['note', lessonId, userId],
    queryFn: () => lessonService.getNote(userId!, lessonId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (note) setContent(note.content);
  }, [note]);

  async function handleSave() {
    if (!userId) return;
    setIsSaving(true);
    try {
      await lessonService.upsertNote(userId, lessonId, note?.id ?? null, content);
      setIsDirty(false);
      toast.success('Note enregistrée');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <StickyNote className="h-4 w-4 text-primary" />
        Mes notes personnelles
      </div>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setIsDirty(true);
        }}
        placeholder="Prends des notes pendant cette leçon — elles ne sont visibles que par toi."
        rows={4}
        className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />
      <Button size="sm" variant="outline" onClick={handleSave} disabled={!isDirty || isSaving}>
        <Save className="mr-2 h-3.5 w-3.5" />
        {isSaving ? 'Enregistrement...' : 'Enregistrer la note'}
      </Button>
    </div>
  );
}
