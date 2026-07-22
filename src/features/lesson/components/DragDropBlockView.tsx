import { useState } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import type { DragDropBlockData } from '@/features/lesson/types';
import { cn } from '@/lib/utils';

function DraggableItem({ id, label, isPlaced }: { id: string; label: string; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  if (isPlaced) return null;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className="cursor-grab rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm text-foreground active:cursor-grabbing"
    >
      {label}
    </button>
  );
}

function DroppableTarget({
  target,
  placedLabel,
}: {
  target: DragDropBlockData['dropTargets'][number];
  placedLabel: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute flex h-16 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border-2 border-dashed border-border bg-background/60 text-center text-xs text-muted-foreground',
        isOver && 'border-primary bg-primary/10',
        placedLabel && 'border-success bg-success/10 text-foreground',
      )}
      style={{ left: `${target.xPercent}%`, top: `${target.yPercent}%` }}
    >
      {placedLabel ?? target.label}
    </div>
  );
}

export function DragDropBlockView({ data }: { data: DragDropBlockData }) {
  const [placements, setPlacements] = useState<Record<string, string>>({}); // targetId -> itemId

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const target = data.dropTargets.find((t) => t.id === over.id);
    if (!target || target.acceptsItemId !== active.id) return;
    setPlacements((prev) => ({ ...prev, [target.id]: String(active.id) }));
  }

  const placedItemIds = new Set(Object.values(placements));

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div
          className="relative h-72 w-full rounded-md border border-border bg-muted"
          style={
            data.backgroundImageUrl
              ? { backgroundImage: `url(${data.backgroundImageUrl})`, backgroundSize: 'cover' }
              : undefined
          }
        >
          {data.dropTargets.map((target) => (
            <DroppableTarget
              key={target.id}
              target={target}
              placedLabel={
                placements[target.id]
                  ? data.dragItems.find((i) => i.id === placements[target.id])?.label ?? null
                  : null
              }
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.dragItems.map((item) => (
            <DraggableItem key={item.id} id={item.id} label={item.label} isPlaced={placedItemIds.has(item.id)} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
