import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { lessonService } from '@/features/lesson/services/lessonService';
import type { FeedbackBlockData } from '@/features/lesson/types';
import { Button } from '@/components/ui/button';
import { cn, getErrorMessage } from '@/lib/utils';

export function FeedbackBlockView({ data, blockId }: { data: FeedbackBlockData; blockId: string }) {
  const { session } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!session) return;
    setIsSubmitting(true);
    try {
      // V1 : un seul enregistrement par bloc — on agrège la première note et
      // le premier texte libre trouvés (schéma feedback_responses simple).
      const firstRatingQuestion = data.questions.find((q) => q.type === 'star_rating');
      const firstTextQuestion = data.questions.find((q) => q.type === 'free_text');
      await lessonService.submitFeedback(
        session.user.id,
        blockId,
        firstRatingQuestion ? (ratings[firstRatingQuestion.id] ?? null) : null,
        firstTextQuestion ? (texts[firstTextQuestion.id] ?? null) : null,
      );
      setIsSubmitted(true);
      toast.success('Merci pour votre retour !');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return <p className="text-sm text-muted-foreground">Merci, votre retour a bien été enregistré.</p>;
  }

  return (
    <div className="space-y-5 rounded-md border border-border p-4">
      {data.questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm text-foreground">{q.question}</p>
          {q.type === 'star_rating' ? (
            <div className="flex gap-1">
              {Array.from({ length: q.maxValue ?? 5 }, (_, i) => i + 1).map((star) => (
                <button key={star} type="button" onClick={() => setRatings((prev) => ({ ...prev, [q.id]: star }))}>
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      ratings[q.id] && star <= ratings[q.id]! ? 'fill-primary text-primary' : 'text-muted-foreground',
                    )}
                  />
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={texts[q.id] ?? ''}
              onChange={(e) => setTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder={q.placeholder}
              maxLength={q.maxLength}
              rows={3}
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          )}
        </div>
      ))}
      <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Envoi...' : 'Envoyer'}
      </Button>
    </div>
  );
}
