import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { lessonService } from '@/features/lesson/services/lessonService';
import type { QuizBlockData } from '@/features/lesson/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function QuizBlockView({ data }: { data: QuizBlockData }) {
  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz', data.quizId],
    queryFn: () => lessonService.getQuizWithQuestions(data.quizId),
  });

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [fillBlankValues, setFillBlankValues] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isLoading) return <Spinner />;
  if (!questions || questions.length === 0) {
    return <p className="text-sm text-muted-foreground">Ce quiz n'a pas encore de questions.</p>;
  }

  function isCorrectMultipleChoice(questionId: string) {
    const question = questions?.find((q) => q.id === questionId);
    const chosenAnswerId = selectedAnswers[questionId];
    const correctAnswer = question?.quiz_answers.find((a) => a.is_correct);
    return correctAnswer?.id === chosenAnswerId;
  }

  function isCorrectFillBlank(questionId: string) {
    const question = questions?.find((q) => q.id === questionId);
    const correctAnswer = question?.quiz_answers.find((a) => a.is_correct);
    const userValue = fillBlankValues[questionId]?.trim().toLowerCase();
    return userValue === correctAnswer?.text.trim().toLowerCase();
  }

  const correctCount = questions.filter((q) =>
    q.type === 'multiple_choice' ? isCorrectMultipleChoice(q.id) : isCorrectFillBlank(q.id),
  ).length;

  return (
    <div className="space-y-6">
      {questions.map((question) => (
        <div key={question.id} className="rounded-md border border-border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">{question.question}</p>

          {question.type === 'multiple_choice' ? (
            <div className="space-y-2">
              {question.quiz_answers
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((answer) => {
                  const isSelected = selectedAnswers[question.id] === answer.id;
                  const showResult = isSubmitted;
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [question.id]: answer.id }))
                      }
                      className={cn(
                        'flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm transition-colors',
                        isSelected && !showResult && 'border-primary bg-primary/10',
                        showResult && answer.is_correct && 'border-success bg-success/10',
                        showResult && isSelected && !answer.is_correct && 'border-destructive bg-destructive/10',
                      )}
                    >
                      {answer.text}
                      {showResult && answer.is_correct && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {showResult && isSelected && !answer.is_correct && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </button>
                  );
                })}
            </div>
          ) : (
            <Input
              disabled={isSubmitted}
              value={fillBlankValues[question.id] ?? ''}
              onChange={(e) =>
                setFillBlankValues((prev) => ({ ...prev, [question.id]: e.target.value }))
              }
              placeholder="Votre réponse"
              className={cn(
                isSubmitted && isCorrectFillBlank(question.id) && 'border-success',
                isSubmitted && !isCorrectFillBlank(question.id) && 'border-destructive',
              )}
            />
          )}
        </div>
      ))}

      {isSubmitted ? (
        <p className="text-sm font-medium text-foreground">
          Score : {correctCount} / {questions.length}
        </p>
      ) : (
        <Button onClick={() => setIsSubmitted(true)}>Valider mes réponses</Button>
      )}
    </div>
  );
}
