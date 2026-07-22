import { useState } from 'react';
import type { HotspotImageBlockData } from '@/features/lesson/types';
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
              'absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/60 transition-transform hover:scale-125',
              hotspot.id === activeId && 'scale-125 bg-primary',
            )}
            style={{ left: `${hotspot.xPercent}%`, top: `${hotspot.yPercent}%` }}
            title={hotspot.title}
          />
        ))}
      </div>
      {active && (
        <div className="rounded-md border border-border p-3">
          <p className="text-sm font-medium text-foreground">{active.title}</p>
          <p className="text-sm text-muted-foreground">{active.content}</p>
        </div>
      )}
    </div>
  );
}
