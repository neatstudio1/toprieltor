"use client";

import { useRef, useState } from "react";
import p from "./podbory.module.css";

interface Row {
  left: string;
  right: string;
}

/**
 * Сравнение для телефона: четыре карточки листаются вправо. В каждой пара
 * «у агрегаторов — у нас», так контраст виден сразу, без двух длинных колонок.
 */
export function CompareSwipe({ left, right, rows }: { left: string; right: string; rows: Row[] }) {
  const track = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = track.current;
    if (!el || !el.firstElementChild) return;
    const card = el.firstElementChild as HTMLElement;
    const stepPx = card.offsetWidth + 12;
    setActive(Math.min(rows.length - 1, Math.max(0, Math.round(el.scrollLeft / stepPx))));
  }

  return (
    <div className={p.swipeWrap}>
      <div ref={track} className={p.swipe} onScroll={onScroll}>
        {rows.map((row) => (
          <article key={row.left} className={p.swipeCard}>
            <div className={p.swipeBad}>
              <span className={p.swipeTag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                {left}
              </span>
              <p>{row.left}</p>
            </div>
            <div className={p.swipeGood}>
              <span className={p.swipeTag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {right}
              </span>
              <p>{row.right}</p>
            </div>
          </article>
        ))}
      </div>
      <div className={p.dots} aria-hidden="true">
        {rows.map((row, i) => (
          <span key={row.left} className={`${p.dot} ${i === active ? p.dotOn : ""}`} />
        ))}
        <span className={p.dotHint}>
          {active + 1} из {rows.length} · листайте
        </span>
      </div>
    </div>
  );
}
