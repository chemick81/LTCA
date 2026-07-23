import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { adminContentService } from '@/features/admin/services/adminContentService';
import type { LessonBlockRow, LessonBlockType } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const BLOCK_TYPES: LessonBlockType[] = [
  'content',
  'video',
  'quiz',
  'feedback',
  'flashcard',
  'hotspot_image',
  'drag_drop',
  'interactive_slideshow',
  'ai_dialogue',
  'embed',
];

const CONTENT_TEMPLATES: Record<LessonBlockType, unknown> = {
  content: { html: '<p>Votre texte ici</p>' },
  video: { mediaUrl: '', subtitles: [], cuepoints: [] },
  quiz: { questions: [] },
  feedback: { questions: [] },
  flashcard: { cards: [] },
  hotspot_image: { imageUrl: '', hotspots: [] },
  drag_drop: { backgroundImage: '', dragItems: [], dropTargets: [] },
  interactive_slideshow: { slides: [] },
  ai_dialogue: { characters: [] },
  embed: { url: 'https://view.genially.com/', title: '', aspectRatioPercent: 56.25 },
};

function BlockEditor({
  block,
  onSaved,
  onDeleted,
  canMoveUp,
  canMoveDown,
  onMove,
}: {
  block: LessonBlockRow;
  onSaved: () => void;
  onDeleted: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const [title, setTitle] = useState(block.title ?? '');
  const [contentText, setContentText] = useState(JSON.stringify(block.content, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(contentText);
      setJsonError(null);
    } catch {
      setJsonError('JSON invalide — vérifiez la syntaxe (guillemets, virgules...)');
      return;
    }
    setIsSaving(true);
    try {
      await adminContentService.updateBlock(block.id, { title: title || null, content: parsed });
      toast.success('Bloc enregistré');
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{block.type}</span>
          <span className="text-xs text-muted-foreground">position {block.position}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={!canMoveUp} onClick={() => onMove('up')}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!canMoveDown} onClick={() => onMove('down')}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDeleted}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Titre du bloc (optionnel)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Contenu (JSON)</Label>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            rows={10}
            spellCheck={false}
            className={cn(
              'w-full rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              jsonError && 'border-destructive',
            )}
          />
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdminLessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const queryClient = useQueryClient();
  const [newBlockType, setNewBlockType] = useState<LessonBlockType>('content');

  const { data: lesson } = useQuery({
    queryKey: ['admin', 'lesson', lessonId],
    queryFn: () => adminContentService.getLesson(lessonId!),
    enabled: !!lessonId,
  });

  const { data: blocks, isLoading } = useQuery({
    queryKey: ['admin', 'blocks', lessonId],
    queryFn: () => adminContentService.listBlocks(lessonId!),
    enabled: !!lessonId,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'blocks', lessonId] });
  }

  const addBlockMutation = useMutation({
    mutationFn: () =>
      adminContentService.createBlock(
        lessonId!,
        newBlockType,
        null,
        CONTENT_TEMPLATES[newBlockType],
        (blocks?.length ?? 0),
      ),
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => adminContentService.deleteBlock(id),
    onSuccess: invalidate,
  });

  const moveBlockMutation = useMutation({
    mutationFn: async ({ block, direction }: { block: LessonBlockRow; direction: 'up' | 'down' }) => {
      if (!blocks) return;
      const sorted = [...blocks].sort((a, b) => a.position - b.position);
      const index = sorted.findIndex((b) => b.id === block.id);
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      const swapBlock = sorted[swapIndex];
      if (!swapBlock) return;
      await adminContentService.updateBlock(block.id, { position: swapBlock.position });
      await adminContentService.updateBlock(swapBlock.id, { position: block.position });
    },
    onSuccess: invalidate,
  });

  const sortedBlocks = blocks ? [...blocks].sort((a, b) => a.position - b.position) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux parcours
        </Link>
      </Button>

      <h1 className="text-2xl font-bold text-foreground">{lesson?.title ?? 'Leçon'}</h1>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {sortedBlocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              onSaved={invalidate}
              onDeleted={() => {
                if (confirm('Supprimer ce bloc ?')) deleteBlockMutation.mutate(block.id);
              }}
              canMoveUp={i > 0}
              canMoveDown={i < sortedBlocks.length - 1}
              onMove={(direction) => moveBlockMutation.mutate({ block, direction })}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter un bloc</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <select
            value={newBlockType}
            onChange={(e) => setNewBlockType(e.target.value as LessonBlockType)}
            className="h-10 flex-1 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button onClick={() => addBlockMutation.mutate()} disabled={addBlockMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
