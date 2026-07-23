import type { CSSProperties } from 'react';
import type { ContentBlockData } from '@/features/lesson/types';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

export function ContentBlockView({ data }: { data: ContentBlockData }) {
  // Variante 1 : HTML simple pleine largeur
  if (data.html) {
    return (
      <div
        className="prose prose-invert max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.html) }}
      />
    );
  }

  // Variante 2 : grille de cellules texte/image
  if (data.rows) {
    return (
      <div className="space-y-4">
        {data.rows.map((row) => (
          <div
            key={row.id}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(0, 1fr))` }}
          >
            {row.cells.map((cell) =>
              cell.type === 'image' ? (
                <img
                  key={cell.id}
                  src={cell.content}
                  alt=""
                  className="w-full rounded-md border border-border"
                  style={{ objectFit: (cell.objectFit as CSSProperties['objectFit']) ?? 'cover' }}
                />
              ) : (
                <div
                  key={cell.id}
                  className="prose prose-invert prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(cell.content) }}
                />
              ),
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
