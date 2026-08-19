"use client";

import { useEffect, useRef } from "react";

/**
 * Plain `<video autoPlay muted>` is unreliable after SSR/hydration — React
 * doesn't always sync the `muted` JSX attribute to the actual DOM property,
 * and browsers check that property (not the attribute) before allowing
 * autoplay. Setting it imperatively on mount is the reliable fix.
 */
export function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Autoplay blocked (e.g. low-power mode) — poster stays visible, that's fine.
    });
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      poster="/hero-poster.webp"
      src="/hero.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    />
  );
}
