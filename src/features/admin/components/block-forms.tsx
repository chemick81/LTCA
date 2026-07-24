import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RowsCellsEditor } from '@/features/admin/components/RowsCellsEditor';
import { RichTextEditor } from '@/features/admin/components/RichTextEditor';
import type {
  ContentBlockData,
  EmbedBlockData,
  VideoBlockData,
  FlashcardBlockData,
  FeedbackBlockData,
  FeedbackQuestion,
  QuizBlockData,
  QuizQuestion,
  QuizOption,
} from '@/features/lesson/types';

// ---------- content (toujours édité en grille rows/cells — même une simple colonne unique) ----------
export function ContentForm({
  data,
  onChange,
}: {
  data: ContentBlockData;
  onChange: (data: ContentBlockData) => void;
}) {
  // Normalise l'ancien format { html } vers { rows } de façon transparente au premier rendu —
  // dès que l'utilisateur édite, le bloc bascule définitivement en rows (comportement invisible pour lui).
  const rows = data.rows ?? [
    { id: crypto.randomUUID(), cells: [{ id: crypto.randomUUID(), type: 'text' as const, content: data.html ?? '<p></p>' }] },
  ];

  return <RowsCellsEditor data={{ rows }} onChange={onChange} />;
}

// Extrait l'URL du src si l'utilisateur colle le code d'embed complet (ex: <iframe src="...">)
// plutôt que de le forcer à extraire l'URL lui-même.
function extractEmbedUrl(pasted: string): string {
  const match = pasted.match(/src=["']([^"']+)["']/);
  return match ? match[1]! : pasted.trim();
}

// ---------- embed (Genially ou autre iframe) ----------
export function EmbedForm({ data, onChange }: { data: EmbedBlockData; onChange: (data: EmbedBlockData) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>URL Genially (colle l'URL seule, ou le code d'embed complet — on extrait l'URL automatiquement)</Label>
        <Input
          value={data.url}
          onChange={(e) => onChange({ ...data, url: extractEmbedUrl(e.target.value) })}
          placeholder="https://view.genially.com/..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Titre (accessibilité)</Label>
        <Input value={data.title ?? ''} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      </div>
      {data.url && (
        <div style={{ width: '100%' }}>
          <div style={{ position: 'relative', paddingBottom: `${data.aspectRatioPercent ?? 56.25}%`, height: 0 }}>
            <iframe
              title={data.title ?? 'Aperçu'}
              src={data.url}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              className="rounded-md border border-border"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- video ----------
export function VideoForm({ data, onChange }: { data: VideoBlockData; onChange: (data: VideoBlockData) => void }) {
  const subtitle = data.subtitles?.[0];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>URL de la vidéo (mp4)</Label>
        <Input value={data.mediaUrl} onChange={(e) => onChange({ ...data, mediaUrl: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>URL des sous-titres (.vtt, optionnel)</Label>
        <Input
          value={subtitle?.url ?? ''}
          onChange={(e) =>
            onChange({
              ...data,
              subtitles: e.target.value
                ? [{ url: e.target.value, label: 'Français', language: 'fr', isDefault: true }]
                : [],
            })
          }
        />
      </div>
      {data.mediaUrl && (
        <video src={data.mediaUrl} controls className="w-full rounded-md border border-border" />
      )}
    </div>
  );
}

// ---------- flashcard ----------
export function FlashcardForm({
  data,
  onChange,
}: {
  data: FlashcardBlockData;
  onChange: (data: FlashcardBlockData) => void;
}) {
  function updateCard(index: number, patch: Partial<(typeof data.cards)[number]>) {
    const cards = data.cards.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ ...data, cards });
  }

  function addCard() {
    onChange({
      ...data,
      cards: [...data.cards, { id: crypto.randomUUID(), front: '<p>Recto</p>', back: '<p>Verso</p>' }],
    });
  }

  function removeCard(index: number) {
    onChange({ ...data, cards: data.cards.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      {data.cards.map((card, i) => (
        <div key={card.id} className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Carte {i + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => removeCard(i)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Recto</Label>
              <RichTextEditor value={card.front} onChange={(html) => updateCard(i, { front: html })} minHeightClass="min-h-[70px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Verso</Label>
              <RichTextEditor value={card.back} onChange={(html) => updateCard(i, { back: html })} minHeightClass="min-h-[70px]" />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addCard}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        Ajouter une carte
      </Button>
    </div>
  );
}

// ---------- feedback ----------
export function FeedbackForm({
  data,
  onChange,
}: {
  data: FeedbackBlockData;
  onChange: (data: FeedbackBlockData) => void;
}) {
  function updateQuestion(index: number, patch: Partial<FeedbackQuestion>) {
    const questions = data.questions.map((q, i) => (i === index ? ({ ...q, ...patch } as FeedbackQuestion) : q));
    onChange({ ...data, questions });
  }

  function addQuestion() {
    onChange({
      ...data,
      questions: [...data.questions, { id: crypto.randomUUID(), type: 'star_rating', question: '' }],
    });
  }

  function removeQuestion(index: number) {
    onChange({ ...data, questions: data.questions.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      {data.questions.map((q, i) => (
        <div key={q.id} className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center gap-2">
            <select
              value={q.type}
              onChange={(e) => updateQuestion(i, { type: e.target.value as FeedbackQuestion['type'] })}
              className="h-9 rounded-md border border-border bg-muted px-2 text-xs text-foreground"
            >
              <option value="star_rating">Note (étoiles)</option>
              <option value="free_text">Texte libre</option>
            </select>
            <Input
              value={q.question}
              onChange={(e) => updateQuestion(i, { question: e.target.value })}
              placeholder="Question"
              className="flex-1"
            />
            <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        Ajouter une question
      </Button>
    </div>
  );
}

// ---------- quiz ----------
function newOption(): QuizOption {
  return { id: crypto.randomUUID(), text: '', is_correct: false };
}

function QuizQuestionEditor({
  question,
  onChange,
  onRemove,
}: {
  question: QuizQuestion;
  onChange: (q: QuizQuestion) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <select
          value={question.type}
          onChange={(e) => {
            const type = e.target.value as QuizQuestion['type'];
            if (type === 'multiple_choice') {
              onChange({ id: question.id, type, question: question.question, options: [newOption(), newOption()] });
            } else if (type === 'fill_blank') {
              onChange({
                id: question.id,
                type,
                question: question.question,
                text_with_blanks: 'Complète : [blank1]',
                blanks: [{ id: 'blank1', position: 0, accepted_answers: [''] }],
              });
            } else {
              onChange({ id: question.id, type, question: question.question });
            }
          }}
          className="h-9 rounded-md border border-border bg-muted px-2 text-xs text-foreground"
        >
          <option value="multiple_choice">QCM</option>
          <option value="fill_blank">Texte à trous</option>
          <option value="short_answer">Réponse libre</option>
        </select>
        <Input
          value={question.question}
          onChange={(e) => onChange({ ...question, question: e.target.value })}
          placeholder="Énoncé de la question"
          className="flex-1"
        />
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      {question.type === 'multiple_choice' && (
        <div className="space-y-2 pl-2">
          {question.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="radio"
                checked={opt.is_correct}
                onChange={() =>
                  onChange({
                    ...question,
                    options: question.options.map((o, j) => ({ ...o, is_correct: j === i })),
                  })
                }
                title="Bonne réponse"
              />
              <Input
                value={opt.text}
                onChange={(e) =>
                  onChange({
                    ...question,
                    options: question.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                  })
                }
                placeholder={`Option ${i + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange({ ...question, options: question.options.filter((_, j) => j !== i) })}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...question, options: [...question.options, newOption()] })}
          >
            <Plus className="mr-1 h-3 w-3" />
            Option
          </Button>
        </div>
      )}

      {question.type === 'fill_blank' && (
        <div className="space-y-2 pl-2">
          <Label className="text-xs text-muted-foreground">
            Phrase — utilise [blank1], [blank2]... pour marquer les trous
          </Label>
          <Input
            value={question.text_with_blanks}
            onChange={(e) => onChange({ ...question, text_with_blanks: e.target.value })}
          />
          {question.blanks.map((blank, i) => (
            <div key={blank.id} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">[{blank.id}]</span>
              <Input
                value={blank.accepted_answers.join(', ')}
                onChange={(e) =>
                  onChange({
                    ...question,
                    blanks: question.blanks.map((b, j) =>
                      j === i ? { ...b, accepted_answers: e.target.value.split(',').map((s) => s.trim()) } : b,
                    ),
                  })
                }
                placeholder="Réponses acceptées, séparées par des virgules"
                className="flex-1"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const newId = `blank${question.blanks.length + 1}`;
              onChange({
                ...question,
                blanks: [...question.blanks, { id: newId, position: question.blanks.length, accepted_answers: [''] }],
              });
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            Trou
          </Button>
        </div>
      )}

      {question.type === 'short_answer' && (
        <p className="pl-2 text-xs text-muted-foreground">Réponse libre — non corrigée automatiquement.</p>
      )}
    </div>
  );
}

export function QuizForm({ data, onChange }: { data: QuizBlockData; onChange: (data: QuizBlockData) => void }) {
  function updateQuestion(index: number, q: QuizQuestion) {
    onChange({ questions: data.questions.map((old, i) => (i === index ? q : old)) });
  }

  function addQuestion() {
    onChange({
      questions: [
        ...data.questions,
        { id: crypto.randomUUID(), type: 'multiple_choice', question: '', options: [newOption(), newOption()] },
      ],
    });
  }

  function removeQuestion(index: number) {
    onChange({ questions: data.questions.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      {data.questions.map((q, i) => (
        <QuizQuestionEditor
          key={q.id}
          question={q}
          onChange={(newQ) => updateQuestion(i, newQ)}
          onRemove={() => removeQuestion(i)}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        Ajouter une question
      </Button>
    </div>
  );
}
