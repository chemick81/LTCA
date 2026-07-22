import { useRef } from 'react';
import type { VideoBlockData } from '@/features/lesson/types';

export function VideoBlockView({ data }: { data: VideoBlockData }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function seekTo(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  }

  return (
    <div className="space-y-3">
      <video ref={videoRef} src={data.mediaUrl} controls className="w-full rounded-md border border-border">
        {data.subtitlesUrl && <track kind="subtitles" src={data.subtitlesUrl} srcLang="fr" default />}
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      {data.cuepoints && data.cuepoints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.cuepoints.map((cp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => seekTo(cp.timeSeconds)}
              className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {cp.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
