import { useState } from 'react';
import { Input } from '@/components/ui/input';

/** Titre éditable en un clic — clique pour éditer, Entrée/blur pour enregistrer. */
export function EditableTitle({
  value,
  placeholder,
  onSave,
  className,
}: {
  value: string;
  placeholder?: string;
  onSave: (newValue: string) => void;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setIsEditing(false);
    if (draft.trim() && draft !== value) onSave(draft.trim());
    else setDraft(value);
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setIsEditing(false);
          }
        }}
        className={className}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`text-left hover:underline ${className ?? ''}`}
      title="Cliquer pour renommer"
    >
      {value || placeholder}
    </button>
  );
}
