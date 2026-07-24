import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bold, Italic, Underline, Heading2, List, Link2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { toast } from 'sonner';
import { cn, getErrorMessage } from '@/lib/utils';

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      // onMouseDown+preventDefault évite de faire perdre le focus/la sélection de l'éditeur avant le exec
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** Éditeur WYSIWYG minimal (contentEditable + document.execCommand) — pas de dépendance externe. */
export function RichTextEditor({
  value,
  onChange,
  minHeightClass = 'min-h-[100px]',
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  minHeightClass?: string;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Ne réécrit le DOM que si la valeur vient de l'extérieur (changement de bloc, undo...) —
  // évite de faire sauter le curseur à chaque frappe.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = sanitizeHtml(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emitChange() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  }

  async function handleImageFile(file: File) {
    setIsUploading(true);
    try {
      const url = await adminContentService.uploadImage(file);
      exec('insertImage', url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  function handleLink() {
    const url = window.prompt('URL du lien :');
    if (url) exec('createLink', url);
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center gap-0.5 border-b border-border bg-muted px-1.5 py-1">
        <ToolbarButton title="Gras" onClick={() => exec('bold')}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Italique" onClick={() => exec('italic')}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Souligné" onClick={() => exec('underline')}>
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Titre" onClick={() => exec('formatBlock', '<h3>')}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Liste à puces" onClick={() => exec('insertUnorderedList')}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Lien" onClick={handleLink}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Insérer une image" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImageFile(file);
          }}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className={cn(
          'prose prose-invert prose-sm max-w-none px-3 py-2 text-foreground focus:outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
          minHeightClass,
        )}
      />
    </div>
  );
}
