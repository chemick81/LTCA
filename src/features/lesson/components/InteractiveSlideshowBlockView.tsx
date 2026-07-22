import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { InteractiveSlideshowBlockData } from '@/features/lesson/types';
import { Button } from '@/components/ui/button';

// TODO V2: moteur d'interactions/scoring entre les éléments des slides.
// V1 = affichage fidèle en lecture seule avec simple navigation prev/next.
export function InteractiveSlideshowBlockView({ data }: { data: InteractiveSlideshowBlockData }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = data.slides[slideIndex];
  if (!slide) return null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
        {slide.elements.map((el) => (
          <div
            key={el.id}
            className="absolute"
            style={{
              left: `${el.xPercent}%`,
              top: `${el.yPercent}%`,
              width: el.widthPercent ? `${el.widthPercent}%` : undefined,
            }}
          >
            {el.type === 'image' ? (
              <img src={el.content} alt="" className="w-full" />
            ) : (
              <p className="text-sm text-foreground">{el.content}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={slideIndex === 0}
          onClick={() => setSlideIndex((i) => i - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Précédent
        </Button>
        <span className="text-xs text-muted-foreground">
          {slideIndex + 1} / {data.slides.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={slideIndex === data.slides.length - 1}
          onClick={() => setSlideIndex((i) => i + 1)}
        >
          Suivant
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
