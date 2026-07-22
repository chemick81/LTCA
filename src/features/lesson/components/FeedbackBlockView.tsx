import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { lessonService } from '@/features/lesson/services/lessonService';
import type { FeedbackBlockData } from '@/features/lesson/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FeedbackBlockView({ data, blockId }: { data: FeedbackBlockData; blockId: string }) {
  const { session } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [freeText, setFreeText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!session) return;
    setIsSubmitting(true);
    try {
      await lessonService.submitFeedback(
        session.user.id,
        blockId,
        data.starRating ? rating : null,
        data.freeText ? freeText : null,
      );
      setIsSubmitted(true);
      toast.success('Merci pour votre retour !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Envoi impossible');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return <p className="text-sm text-muted-foreground">Merci, votre retour a bien été enregistré.</p>;
  }

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      {data.prompt && <p className="text-sm text-foreground">{data.prompt}</p>}

      {data.starRating && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)}>
              <Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  rating && star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground',
                )}
              />
            </button>
          ))}
        </div>
      )}

      {data.freeText && (
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Votre avis..."
          rows={3}
          className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      )}

      <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Envoi...' : 'Envoyer'}
      </Button>
    </div>
  );
}
