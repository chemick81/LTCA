import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuizBlockData, QuizQuestion } from '@/features/lesson/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function MultipleChoiceQuestion({
  question,
  selected,
  onSelect,
  isSubmitted,
}: {
  question: Extract<QuizQuestion, { type: 'multiple_choice' }>;
  selected: string | undefined;
  onSelect: (optionId: string) => void;
  isSubmitted: boolean;
}) {
  return (
    <div className="space-y-2">
      {question.options.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={isSubmitted}
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm transition-colors',
              isSelected && !isSubmitted && 'border-primary bg-primary/10',
              isSubmitted && option.is_correct && 'border-success bg-success/10',
              isSubmitted && isSelected && !option.is_correct && 'border-destructive bg-destructive/10',
            )}
          >
            {option.text}
            {isSubmitted && option.is_correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
            {isSubmitted && isSelected && !option.is_correct && (
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
          </button>
        );
      })}
      {isSubmitted && question.explanation && (
        <p className="text-xs text-muted-foreground">{question.explanation}</p>
      )}
    </div>
  );
}

function FillBlankQuestion({
  question,
  values,
  onChange,
  isSubmitted,
}: {
  question: Extract<QuizQuestion, { type: 'fill_blank' }>;
  values: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
  isSubmitted: boolean;
}) {
  const parts = question.text_with_blanks.split(/(\[blank\d+\])/g);

  function isBlankCorrect(blankId: string) {
    const blank = question.blanks.find((b) => b.id === blankId);
    const value = values[blankId]?.trim().toLowerCase();
    return blank?.accepted_answers.some((a) => a.trim().toLowerCase() === value) ?? false;
  }

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
        {parts.map((part, i) => {
          const match = part.match(/^\[(blank\d+)\]$/);
          if (!match) return <span key={i}>{part}</span>;
          const blankId = match[1]!;
          return (
            <Input
              key={i}
              disabled={isSubmitted}
              value={values[blankId] ?? ''}
              onChange={(e) => onChange(blankId, e.target.value)}
              className={cn(
                'inline-block h-8 w-32',
                isSubmitted && isBlankCorrect(blankId) && 'border-success',
                isSubmitted && !isBlankCorrect(blankId) && 'border-destructive',
              )}
            />
          );
        })}
      </p>
      {isSubmitted && question.explanation && (
        <p className="text-xs text-muted-foreground">{question.explanation}</p>
      )}
    </div>
  );
}

function ShortAnswerQuestion({
  question,
  value,
  onChange,
  isSubmitted,
}: {
  question: Extract<QuizQuestion, { type: 'short_answer' }>;
  value: string;
  onChange: (value: string) => void;
  isSubmitted: boolean;
}) {
  return (
    <div className="space-y-2">
      <textarea
        disabled={isSubmitted}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={question.max_length}
        rows={3}
        placeholder="Votre réponse..."
        className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-70"
      />
      {isSubmitted && (
        <p className="text-xs text-muted-foreground">
          Réponse libre — pas de correction automatique en V1.
          {question.explanation && <> {question.explanation}</>}
        </p>
      )}
    </div>
  );
}

export function QuizBlockView({ data }: { data: QuizBlockData }) {
  const [mcAnswers, setMcAnswers] = useState<Record<string, string>>({});
  const [blankAnswers, setBlankAnswers] = useState<Record<string, Record<string, string>>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!data.questions || data.questions.length === 0) {
    return <p className="text-sm text-muted-foreground">Ce quiz n'a pas encore de questions.</p>;
  }

  const scorable = data.questions.filter((q) => q.type === 'multiple_choice' || q.type === 'fill_blank');
  const correctCount = scorable.filter((q) => {
    if (q.type === 'multiple_choice') {
      const chosen = mcAnswers[q.id];
      return q.options.find((o) => o.id === chosen)?.is_correct ?? false;
    }
    if (q.type === 'fill_blank') {
      return q.blanks.every((b) => {
        const value = blankAnswers[q.id]?.[b.id]?.trim().toLowerCase();
        return b.accepted_answers.some((a) => a.trim().toLowerCase() === value);
      });
    }
    return false;
  }).length;

  return (
    <div className="space-y-6">
      {data.questions.map((question) => (
        <div key={question.id} className="rounded-md border border-border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">{question.question}</p>
          {question.type === 'multiple_choice' && (
            <MultipleChoiceQuestion
              question={question}
              selected={mcAnswers[question.id]}
              onSelect={(optionId) => setMcAnswers((prev) => ({ ...prev, [question.id]: optionId }))}
              isSubmitted={isSubmitted}
            />
          )}
          {question.type === 'fill_blank' && (
            <FillBlankQuestion
              question={question}
              values={blankAnswers[question.id] ?? {}}
              onChange={(blankId, value) =>
                setBlankAnswers((prev) => ({
                  ...prev,
                  [question.id]: { ...prev[question.id], [blankId]: value },
                }))
              }
              isSubmitted={isSubmitted}
            />
          )}
          {question.type === 'short_answer' && (
            <ShortAnswerQuestion
              question={question}
              value={shortAnswers[question.id] ?? ''}
              onChange={(value) => setShortAnswers((prev) => ({ ...prev, [question.id]: value }))}
              isSubmitted={isSubmitted}
            />
          )}
        </div>
      ))}

      {isSubmitted ? (
        <p className="text-sm font-medium text-foreground">
          Score : {correctCount} / {scorable.length}
        </p>
      ) : (
        <Button onClick={() => setIsSubmitted(true)}>Valider mes réponses</Button>
      )}
    </div>
  );
}
