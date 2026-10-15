"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Фоновое видео, которое не мешает первой отрисовке (2026-10-15).
 *
 * Раньше `<video preload="auto">` стоял в разметке с первого байта: на главной
 * телефон качал 1,4 МБ ролика ещё до текста, а Lighthouse считал сам ролик
 * крупнейшим элементом экрана — LCP 7,9 с на мобильном. Теперь тег монтируется
 * только на широком экране, только после события load и паузы браузера,
 * а до этого фон держит картинка, которую рисует родитель. Телефон и режим
 * «меньше движения» ролик не получают вовсе.
 */
export function DeferredVideo({
  src,
  className,
  minWidth = 768,
}: {
  src: string;
  className?: string;
  minWidth?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!wide.matches || calm.matches) return;

    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback;
      if (idle) idle(() => !cancelled && setMounted(true), { timeout: 2000 });
      else setTimeout(() => !cancelled && setMounted(true), 300);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
    };
  }, [minWidth]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // muted в JSX не всегда доезжает до DOM-свойства после гидрации, а браузер
    // смотрит именно на свойство, решая, можно ли автозапуск.
    video.muted = true;
    video.play().catch(() => {});
  }, [mounted]);

  if (!mounted) return null;

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onPlaying={() => setPlaying(true)}
      style={{ opacity: playing ? undefined : 0, transition: "opacity 600ms ease" }}
    />
  );
}
