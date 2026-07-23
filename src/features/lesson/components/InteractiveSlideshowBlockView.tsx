import { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { InteractiveSlideshowBlockData } from '@/features/lesson/types';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

// V1 = carte récapitulative en lecture seule (texte + image de fond par slide).
// Le vrai moteur de canvas (formes, variables, interactions cliquables/scoring)
// est hors scope V1 — voir TODO V2 dans features/lesson/types.ts.
export function InteractiveSlideshowBlockView({ data }: { data: InteractiveSlideshowBlockData }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = data.slides[slideIndex];
  if (!slide) return null;

  const textElements = slide.elements.filter((el) => el.type !== 'variable' && el.textContent && el.visible !== false);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Contenu interactif — aperçu en lecture seule (V2 pour l'interactivité complète).
      </div>
      <div
        className="relative min-h-[220px] w-full overflow-hidden rounded-md border border-border bg-muted bg-cover bg-center p-6"
        style={{
          backgroundColor: slide.backgroundColor,
          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
        }}
      >
        <div className="space-y-2 rounded-md bg-background/70 p-4">
          {textElements.map((el) => (
            <div
              key={el.id}
              className="prose prose-invert prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(el.textContent ?? '') }}
            />
          ))}
        </div>
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
