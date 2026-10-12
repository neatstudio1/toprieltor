"use client";

import { useEffect, useRef, useState } from "react";
import s from "./lp.module.css";

/**
 * Затемнённое видео на фоне первого экрана — только на десктопе: на телефоне
 * первый экран держится на фото, а гнать видео по мобильному трафику ради
 * фона не нужно. Тег монтируется после проверки ширины, поэтому телефон файл не качает.
 */
export function HeroVideo() {
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(wide.matches && !calm.matches);
    update();
    wide.addEventListener("change", update);
    calm.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      calm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // см. components/home/hero-video.tsx: muted в JSX не всегда доезжает до DOM
    video.muted = true;
    video.play().catch(() => {});
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={s.heroVideoWrap} aria-hidden="true">
      <video
        ref={ref}
        className={s.heroVideo}
        poster="/hero-poster.webp"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className={s.heroVideoShade} />
    </div>
  );
}
