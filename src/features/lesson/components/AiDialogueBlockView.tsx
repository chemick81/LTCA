import { Info } from 'lucide-react';
import type { AiDialogueBlockData } from '@/features/lesson/types';

// V1 = carte de briefing en lecture seule (personnages, mise en situation,
// objectifs pédagogiques). Le dialogue IA génératif multi-tours avec
// évaluation (grading) est hors scope V1 — voir TODO V2 dans
// features/lesson/types.ts.
export function AiDialogueBlockView({ data }: { data: AiDialogueBlockData }) {
  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Dialogue interactif avec l'IA — disponible en V2. Aperçu de la mise en situation ci-dessous.
      </div>

      {data.characters.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {data.characters.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              {c.baseImage && (
                <img src={c.baseImage} alt={c.name} className="h-12 w-12 rounded-full border border-border object-cover" />
              )}
              <span className="text-sm font-medium text-foreground">{c.name}</span>
            </div>
          ))}
        </div>
      )}

      {data.setting && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Contexte : </span>
          {data.setting}
        </p>
      )}

      {data.initialMessage && <p className="text-sm text-foreground">{data.initialMessage}</p>}

      {data.learningOutcomes && data.learningOutcomes.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Objectifs</p>
          <ul className="mt-1 list-inside list-disc text-sm text-foreground">
            {data.learningOutcomes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
