import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Save,
  Plus,
  Eye,
  Code2,
  LayoutGrid,
  Video,
  HelpCircle,
  MessageSquare,
  Layers,
  MapPin,
  Move,
  Presentation,
  Bot,
  Frame,
} from 'lucide-react';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { EditableTitle } from '@/features/admin/components/EditableTitle';
import { ContentForm, EmbedForm, VideoForm, FlashcardForm, FeedbackForm, QuizForm } from '@/features/admin/components/block-forms';
import type { LessonBlockRow, LessonBlockType } from '@/types/database.types';
import type {
  ContentBlockData,
  EmbedBlockData,
  VideoBlockData,
  FlashcardBlockData,
  FeedbackBlockData,
  QuizBlockData,
} from '@/features/lesson/types';
import { Button } from '@/components/ui/button';
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

const FRIENDLY_TYPES: LessonBlockType[] = ['content', 'embed', 'video', 'flashcard', 'feedback', 'quiz'];

const BLOCK_ICONS: Record<LessonBlockType, typeof LayoutGrid> = {
  content: LayoutGrid,
  video: Video,
  quiz: HelpCircle,
  feedback: MessageSquare,
  flashcard: Layers,
  hotspot_image: MapPin,
  drag_drop: Move,
  interactive_slideshow: Presentation,
  ai_dialogue: Bot,
  embed: Frame,
};

const BLOCK_LABELS: Record<LessonBlockType, string> = {
  content: 'Contenu',
  video: 'Vidéo',
  quiz: 'Quiz',
  feedback: 'Feedback',
  flashcard: 'Flashcards',
  hotspot_image: 'Zones cliquables',
  drag_drop: 'Glisser-déposer',
  interactive_slideshow: 'Diaporama',
  ai_dialogue: 'Dialogue IA',
  embed: 'Module intégré',
};

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

/** Petit bouton "+" qui déroule un sélecteur de type de bloc à insérer à cet endroit précis. */
function InsertBlockButton({ onInsert }: { onInsert: (type: LessonBlockType) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <select
          autoFocus
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              onInsert(e.target.value as LessonBlockType);
              setIsOpen(false);
            }
          }}
          onBlur={() => setIsOpen(false)}
          className="h-8 rounded-md border border-border bg-muted px-2 text-xs text-foreground"
        >
          <option value="" disabled>
            Choisir un type de bloc...
          </option>
          {BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>
              {BLOCK_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-center py-1">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 transition-opacity hover:border-primary hover:text-primary group-hover:opacity-100"
        title="Insérer un bloc ici"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function BlockCard({
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
  const [type, setType] = useState<LessonBlockType>(block.type);
  const [content, setContent] = useState<unknown>(block.content);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showJson, setShowJson] = useState(!FRIENDLY_TYPES.includes(block.type));
  const [jsonText, setJsonText] = useState(JSON.stringify(block.content, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const Icon = BLOCK_ICONS[type];

  function handleTypeChange(newType: LessonBlockType) {
    if (newType === type) return;
    if (!confirm(`Changer le type vers « ${BLOCK_LABELS[newType]} » ? Le contenu actuel du bloc sera remplacé.`)) return;
    setType(newType);
    handleContentChange(CONTENT_TEMPLATES[newType]);
    setShowJson(!FRIENDLY_TYPES.includes(newType));
  }

  function handleContentChange(newContent: unknown) {
    setContent(newContent);
    setJsonText(JSON.stringify(newContent, null, 2));
    setIsDirty(true);
  }

  function handleJsonChange(text: string) {
    setJsonText(text);
    setIsDirty(true);
    try {
      setContent(JSON.parse(text));
      setJsonError(null);
    } catch {
      setJsonError('JSON invalide');
    }
  }

  async function handleSave() {
    if (jsonError) {
      toast.error('Corrige le JSON avant d\'enregistrer');
      return;
    }
    setIsSaving(true);
    try {
      await adminContentService.updateBlock(block.id, { type, title: title || null, content });
      toast.success('Bloc enregistré');
      setIsDirty(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsSaving(false);
    }
  }

  function renderFriendlyForm() {
    switch (type) {
      case 'content':
        return <ContentForm data={content as ContentBlockData} onChange={handleContentChange} />;
      case 'embed':
        return <EmbedForm data={content as EmbedBlockData} onChange={handleContentChange} />;
      case 'video':
        return <VideoForm data={content as VideoBlockData} onChange={handleContentChange} />;
      case 'flashcard':
        return <FlashcardForm data={content as FlashcardBlockData} onChange={handleContentChange} />;
      case 'feedback':
        return <FeedbackForm data={content as FeedbackBlockData} onChange={handleContentChange} />;
      case 'quiz':
        return <QuizForm data={content as QuizBlockData} onChange={handleContentChange} />;
      default:
        return null;
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <EditableTitle
            value={title}
            placeholder={BLOCK_LABELS[type]}
            onSave={(v) => {
              setTitle(v);
              setIsDirty(true);
            }}
            className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
          />
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as LessonBlockType)}
            className="h-7 shrink-0 rounded-md border border-border bg-muted px-1.5 text-xs text-muted-foreground"
            title="Changer le type de bloc"
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>
                {BLOCK_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {FRIENDLY_TYPES.includes(type) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJson((s) => !s)}
              title="Basculer en JSON avancé"
            >
              <Code2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" disabled={!canMoveUp} onClick={() => onMove('up')}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!canMoveDown} onClick={() => onMove('down')}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed((c) => !c)}>
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDeleted}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 p-4">
          {showJson || !FRIENDLY_TYPES.includes(type) ? (
            <div className="space-y-1.5">
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={10}
                spellCheck={false}
                className={cn(
                  'w-full rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  jsonError && 'border-destructive',
                )}
              />
              {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
            </div>
          ) : (
            renderFriendlyForm()
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Enregistrement...' : isDirty ? 'Enregistrer' : 'Enregistré'}
          </Button>
        </div>
      )}
    </div>
  );
}

export function AdminLessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const queryClient = useQueryClient();
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: breadcrumb } = useQuery({
    queryKey: ['admin', 'breadcrumb', lessonId],
    queryFn: () => adminContentService.getBreadcrumb(lessonId!),
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

  const sortedBlocks = blocks ? [...blocks].sort((a, b) => a.position - b.position) : [];

  const insertMutation = useMutation({
    mutationFn: ({ index, type }: { index: number; type: LessonBlockType }) =>
      adminContentService.insertBlockAt(lessonId!, sortedBlocks, index, type, CONTENT_TEMPLATES[type]),
    onSuccess: invalidate,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur'),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => adminContentService.deleteBlock(id),
    onSuccess: invalidate,
  });

  const moveBlockMutation = useMutation({
    mutationFn: async ({ block, direction }: { block: LessonBlockRow; direction: 'up' | 'down' }) => {
      const index = sortedBlocks.findIndex((b) => b.id === block.id);
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      const swapBlock = sortedBlocks[swapIndex];
      if (!swapBlock) return;
      await adminContentService.updateBlock(block.id, { position: swapBlock.position });
      await adminContentService.updateBlock(swapBlock.id, { position: block.position });
    },
    onSuccess: invalidate,
  });

  function scrollToBlock(id: string) {
    blockRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Breadcrumb */}
      <div className="flex h-14 shrink-0 items-center gap-1.5 border-b border-border bg-card px-4 text-sm">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground">
          Dashboard
        </Link>
        {breadcrumb && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Link to={`/admin/courses/${breadcrumb.courseId}`} className="text-muted-foreground hover:text-foreground">
              {breadcrumb.courseTitle}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate font-medium text-foreground">{breadcrumb.lessonTitle}</span>
          </>
        )}
        <div className="ml-auto">
          <Button asChild variant="outline" size="sm">
            <a href={`/academy/lesson/${lessonId}`} target="_blank" rel="noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — outline des blocs */}
        <aside className="w-64 shrink-0 overflow-y-auto scrollbar-thin border-r border-border bg-card p-2">
          {sortedBlocks.map((block, i) => {
            const Icon = BLOCK_ICONS[block.type];
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => scrollToBlock(block.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="w-4 shrink-0 text-right">{i + 1}.</span>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{block.title || BLOCK_LABELS[block.type]}</span>
              </button>
            );
          })}
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="mx-auto max-w-3xl">
            {isLoading ? (
              <Spinner />
            ) : (
              <>
                <InsertBlockButton onInsert={(type) => insertMutation.mutate({ index: 0, type })} />
                {sortedBlocks.map((block, i) => (
                  <div key={block.id}>
                    <div ref={(el) => { blockRefs.current[block.id] = el; }}>
                      <BlockCard
                        block={block}
                        onSaved={invalidate}
                        onDeleted={() => {
                          if (confirm('Supprimer ce bloc ?')) deleteBlockMutation.mutate(block.id);
                        }}
                        canMoveUp={i > 0}
                        canMoveDown={i < sortedBlocks.length - 1}
                        onMove={(direction) => moveBlockMutation.mutate({ block, direction })}
                      />
                    </div>
                    <InsertBlockButton onInsert={(type) => insertMutation.mutate({ index: i + 1, type })} />
                  </div>
                ))}
                {sortedBlocks.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucun bloc — clique sur le + ci-dessus pour commencer.
                  </p>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
