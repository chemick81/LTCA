import { useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Type, Upload } from 'lucide-react';
import type { ContentBlockData, ContentRow, ContentCell } from '@/features/lesson/types';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { RichTextEditor } from '@/features/admin/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function CellEditor({ cell, onChange, onDelete }: { cell: ContentCell; onChange: (cell: ContentCell) => void; onDelete: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    try {
      const url = await adminContentService.uploadImage(file);
      onChange({ ...cell, content: url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de l\'envoi');
    }
  }

  return (
    <div className="relative flex-1 rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange({ ...cell, type: 'text', content: cell.type === 'text' ? cell.content : '<p></p>' })}
            className={`rounded p-1 ${cell.type === 'text' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            title="Texte"
          >
            <Type className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...cell, type: 'image', content: cell.type === 'image' ? cell.content : '' })}
            className={`rounded p-1 ${cell.type === 'image' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            title="Image pleine largeur"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <button type="button" onClick={onDelete} title="Supprimer la colonne">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>

      {cell.type === 'text' ? (
        <RichTextEditor value={cell.content} onChange={(html) => onChange({ ...cell, content: html })} minHeightClass="min-h-[100px]" placeholder="Écris ton texte ici..." />
      ) : (
        <div className="space-y-2">
          {cell.content && (
            <img src={cell.content} alt="" className="w-full rounded-md border border-border object-cover" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-3.5 w-3.5" />
            {cell.content ? 'Remplacer' : 'Choisir une image'}
          </Button>
        </div>
      )}
    </div>
  );
}

export function RowsCellsEditor({ data, onChange }: { data: ContentBlockData; onChange: (data: ContentBlockData) => void }) {
  const rows = data.rows ?? [];

  function updateRow(index: number, row: ContentRow) {
    onChange({ ...data, rows: rows.map((r, i) => (i === index ? row : r)) });
  }

  function addRow() {
    onChange({
      ...data,
      rows: [...rows, { id: crypto.randomUUID(), cells: [{ id: crypto.randomUUID(), type: 'text', content: '<p></p>' }] }],
    });
  }

  function removeRow(index: number) {
    onChange({ ...data, rows: rows.filter((_, i) => i !== index) });
  }

  function addCell(rowIndex: number) {
    const row = rows[rowIndex]!;
    updateRow(rowIndex, { ...row, cells: [...row.cells, { id: crypto.randomUUID(), type: 'text', content: '<p></p>' }] });
  }

  return (
    <div className="space-y-4">
      {rows.map((row, rowIndex) => (
        <div key={row.id} className="space-y-2">
          <div className="flex gap-3">
            {row.cells.map((cell, cellIndex) => (
              <CellEditor
                key={cell.id}
                cell={cell}
                onChange={(newCell) =>
                  updateRow(rowIndex, { ...row, cells: row.cells.map((c, i) => (i === cellIndex ? newCell : c)) })
                }
                onDelete={() => updateRow(rowIndex, { ...row, cells: row.cells.filter((_, i) => i !== cellIndex) })}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => addCell(rowIndex)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Ajouter une colonne à côté
            </Button>
            {rows.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(rowIndex)}>
                <Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" />
                Supprimer cette section
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        Ajouter une section en dessous
      </Button>
    </div>
  );
}
