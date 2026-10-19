import { useEffect, useRef } from 'react';

export function SantimClip({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (media.matches) {
        video.pause();
        return;
      }
      void video.play().catch(() => undefined);
    };
    sync();
    video.addEventListener('canplay', sync);
    media.addEventListener('change', sync);
    return () => {
      video.removeEventListener('canplay', sync);
      media.removeEventListener('change', sync);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      src="/santim.mp4"
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
    />
  );
}
