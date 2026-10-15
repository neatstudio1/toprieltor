"use client";

import { useEffect, useState } from "react";
import { DeferredVideo } from "@/components/deferred-video";
import s from "./lp.module.css";

/**
 * Затемнённое видео на фоне первого экрана — только на десктопе: на телефоне
 * первый экран держится на фото, а гнать видео по мобильному трафику ради
 * фона не нужно. Сам ролик подключается после загрузки страницы
 * (DeferredVideo): с первого байта он был крупнейшим элементом экрана на ПК
 * и тянул LCP, хотя под затемнением его почти не видно в первые секунды.
 */
export function HeroVideo() {
  const [enabled, setEnabled] = useState(false);

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

  if (!enabled) return null;

  return (
    <div className={s.heroVideoWrap} aria-hidden="true">
      <DeferredVideo src="/hero.mp4" className={s.heroVideo} />
      <div className={s.heroVideoShade} />
    </div>
  );
}
