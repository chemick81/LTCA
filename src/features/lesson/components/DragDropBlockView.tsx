import { useState } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import type { DragDropBlockData } from '@/features/lesson/types';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { cn } from '@/lib/utils';

function DraggableItem({ id, content, isPlaced }: { id: string; content: string; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  if (isPlaced) return null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className="prose prose-invert prose-sm max-w-none cursor-grab select-none rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-foreground active:cursor-grabbing"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}

function DroppableTarget({
  target,
  placedContent,
}: {
  target: DragDropBlockData['dropTargets'][number];
  placedContent: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute flex items-center justify-center rounded-md border-2 border-dashed border-border bg-background/60 p-2 text-center text-xs text-muted-foreground',
        isOver && 'border-primary bg-primary/10',
        placedContent && 'border-success bg-success/10 text-foreground',
      )}
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
        width: `${target.width}%`,
        height: `${target.height}%`,
      }}
    >
      {placedContent ? (
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(placedContent) }}
        />
      ) : (
        target.label
      )}
    </div>
  );
}

export function DragDropBlockView({ data }: { data: DragDropBlockData }) {
  const [placements, setPlacements] = useState<Record<string, string>>({}); // targetId -> itemId

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const item = data.dragItems.find((i) => i.id === active.id);
    if (!item || !item.correctTargets.includes(String(over.id))) return;
    setPlacements((prev) => ({ ...prev, [String(over.id)]: String(active.id) }));
  }

  const placedItemIds = new Set(Object.values(placements));

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted">
          {data.backgroundImage ? (
            <img src={data.backgroundImage} alt="" className="block w-full" />
          ) : (
            <div className="h-72 w-full" />
          )}
          {data.dropTargets.map((target) => (
            <DroppableTarget
              key={target.id}
              target={target}
              placedContent={
                placements[target.id]
                  ? (data.dragItems.find((i) => i.id === placements[target.id])?.content ?? null)
                  : null
              }
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.dragItems.map((item) => (
            <DraggableItem key={item.id} id={item.id} content={item.content} isPlaced={placedItemIds.has(item.id)} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
