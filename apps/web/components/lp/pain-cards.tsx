"use client";

import { useRef, useState } from "react";
import { Reveal } from "@/components/reveal";
import s from "./lp.module.css";

export function PainCards({ cards }: { cards: { title: string; text?: string }[] }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  function onScroll() {
    const el = scroller.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const next = Math.round(el.scrollLeft / (first.offsetWidth + 10));
    if (next !== index) setIndex(next);
  }

  return (
    <>
      <div
        ref={scroller}
        onScroll={onScroll}
        className={s.painScroller}
        style={{ "--pain-cols": cards.length } as React.CSSProperties}
      >
        {cards.map((card, i) => (
          <Reveal key={card.title} delayMs={i * 100} className={s.painCard}>
            <div className={s.painNum}>{String(i + 1).padStart(2, "0")}</div>
            <div className={s.painTitle}>{card.title}</div>
            {card.text ? <div className={s.painText}>{card.text}</div> : null}
          </Reveal>
        ))}
      </div>
      <div className={s.painFooter}>
        <div className={s.painDots} aria-hidden="true">
          {cards.map((card, i) => (
            <span key={card.title} className={`${s.painDot} ${i === index ? s.painDotOn : ""}`} />
          ))}
        </div>
        <span className={s.painHint}>листайте →</span>
      </div>
    </>
  );
}
