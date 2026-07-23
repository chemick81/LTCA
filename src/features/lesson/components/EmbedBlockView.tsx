import type { EmbedBlockData } from '@/features/lesson/types';

// Iframe responsive générique (Genially ou autre), technique padding-bottom
// classique pour préserver le ratio d'aspect quelle que soit la largeur.
export function EmbedBlockView({ data }: { data: EmbedBlockData }) {
  const ratio = data.aspectRatioPercent ?? 56.25; // 16:9 par défaut

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', paddingBottom: `${ratio}%`, height: 0 }}>
        <iframe
          title={data.title ?? 'Contenu interactif'}
          src={data.url}
          frameBorder={0}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          className="rounded-md border border-border"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
