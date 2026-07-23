import type { LessonBlockRow } from '@/types/database.types';
import type {
  ContentBlockData,
  VideoBlockData,
  QuizBlockData,
  FeedbackBlockData,
  FlashcardBlockData,
  HotspotImageBlockData,
  DragDropBlockData,
  InteractiveSlideshowBlockData,
  AiDialogueBlockData,
  EmbedBlockData,
} from '@/features/lesson/types';
import { ContentBlockView } from '@/features/lesson/components/ContentBlockView';
import { VideoBlockView } from '@/features/lesson/components/VideoBlockView';
import { QuizBlockView } from '@/features/lesson/components/QuizBlockView';
import { FeedbackBlockView } from '@/features/lesson/components/FeedbackBlockView';
import { FlashcardBlockView } from '@/features/lesson/components/FlashcardBlockView';
import { HotspotImageBlockView } from '@/features/lesson/components/HotspotImageBlockView';
import { DragDropBlockView } from '@/features/lesson/components/DragDropBlockView';
import { InteractiveSlideshowBlockView } from '@/features/lesson/components/InteractiveSlideshowBlockView';
import { AiDialogueBlockView } from '@/features/lesson/components/AiDialogueBlockView';
import { EmbedBlockView } from '@/features/lesson/components/EmbedBlockView';

// Le renderer détecte le `type` du bloc et délègue au composant dédié.
// Jamais de page codée en dur pour une leçon — voir LTCA-brief-projet.md.
export function BlockRenderer({ block }: { block: LessonBlockRow }) {
  switch (block.type) {
    case 'content':
      return <ContentBlockView data={block.content as ContentBlockData} />;
    case 'video':
      return <VideoBlockView data={block.content as VideoBlockData} />;
    case 'quiz':
      return <QuizBlockView data={block.content as QuizBlockData} />;
    case 'feedback':
      return <FeedbackBlockView data={block.content as FeedbackBlockData} blockId={block.id} />;
    case 'flashcard':
      return <FlashcardBlockView data={block.content as FlashcardBlockData} />;
    case 'hotspot_image':
      return <HotspotImageBlockView data={block.content as HotspotImageBlockData} />;
    case 'drag_drop':
      return <DragDropBlockView data={block.content as DragDropBlockData} />;
    case 'interactive_slideshow':
      return <InteractiveSlideshowBlockView data={block.content as InteractiveSlideshowBlockData} />;
    case 'ai_dialogue':
      return <AiDialogueBlockView data={block.content as AiDialogueBlockData} />;
    case 'embed':
      return <EmbedBlockView data={block.content as EmbedBlockData} />;
    default:
      return (
        <p className="text-sm text-destructive">Type de bloc inconnu : {block.type}</p>
      );
  }
}
