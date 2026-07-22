import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import type { FlashcardBlockData } from '@/features/lesson/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FlashcardBlockView({ data }: { data: FlashcardBlockData }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const card = data.cards[index];

  if (!card) return null;

  function goTo(newIndex: number) {
    setIsFlipped(false);
    setIndex(newIndex);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => setIsFlipped((f) => !f)}
        className={cn(
          'flex h-56 w-full max-w-md items-center justify-center rounded-lg border border-border p-6 text-center transition-colors',
          isFlipped ? 'bg-primary/10' : 'bg-muted',
        )}
      >
        <p className="text-base text-foreground">{isFlipped ? card.back : card.front}</p>
      </button>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setIsFlipped((f) => !f)}>
          <RotateCw className="mr-2 h-4 w-4" />
          Retourner
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={index === data.cards.length - 1}
          onClick={() => goTo(index + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {index + 1} / {data.cards.length}
      </p>
    </div>
  );
}
