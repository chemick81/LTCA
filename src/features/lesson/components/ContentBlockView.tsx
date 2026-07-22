import type { ContentBlockData } from '@/features/lesson/types';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

export function ContentBlockView({ data }: { data: ContentBlockData }) {
  return (
    <div className="space-y-4">
      {data.rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(0, 1fr))` }}
        >
          {row.cells.map((cell, cellIndex) => (
            <div key={cellIndex} className="space-y-3">
              {cell.imageUrl && (
                <img src={cell.imageUrl} alt="" className="w-full rounded-md border border-border" />
              )}
              {cell.html && (
                <div
                  className="prose prose-invert prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(cell.html) }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
