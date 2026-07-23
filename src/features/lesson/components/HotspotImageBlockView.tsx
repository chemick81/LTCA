import { useState } from 'react';
import type { HotspotImageBlockData } from '@/features/lesson/types';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { cn } from '@/lib/utils';

export function HotspotImageBlockView({ data }: { data: HotspotImageBlockData }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = data.hotspots.find((h) => h.id === activeId);

  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-hidden rounded-md border border-border">
        <img src={data.imageUrl} alt="" className="w-full" />
        {data.hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            type="button"
            onClick={() => setActiveId(hotspot.id === activeId ? null : hotspot.id)}
            className={cn(
              'absolute rounded-md border-2 border-primary bg-primary/30 transition-colors hover:bg-primary/50',
              hotspot.id === activeId && 'bg-primary/50',
            )}
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
              borderColor: hotspot.color,
            }}
            title={hotspot.label}
          />
        ))}
      </div>
      {active && (
        <div className="rounded-md border border-border p-3">
          <p className="text-sm font-medium text-foreground">{active.label}</p>
          <div
            className="prose prose-invert prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(active.content) }}
          />
        </div>
      )}
    </div>
  );
}
