import type { AiDialogueBlockData } from '@/features/lesson/types';

// TODO V2: branchement conditionnel + appels LLM en direct.
// V1 = affichage linéaire du dialogue scripté.
export function AiDialogueBlockView({ data }: { data: AiDialogueBlockData }) {
  return (
    <div className="space-y-3">
      {data.turns.map((turn, i) => (
        <div key={i} className="flex gap-3">
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {turn.speaker}
          </span>
          <p className="text-sm text-foreground">{turn.text}</p>
        </div>
      ))}
    </div>
  );
}
