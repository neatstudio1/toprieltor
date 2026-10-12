"use client";

import { useEffect, useRef } from "react";
import { PROCESS_STEPS } from "@/lib/landings";
import { Reveal } from "@/components/reveal";
import s from "./lp.module.css";

export function ProcessSteps() {
  const rail = useRef<HTMLDivElement | null>(null);
  const fill = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const railEl = rail.current;
      const fillEl = fill.current;
      if (!railEl || !fillEl || !mobile.matches) return;
      const r = railEl.getBoundingClientRect();
      const line = window.innerHeight * 0.6 - r.top;
      const span = Math.max(1, r.height - 16);
      const p = Math.max(0, Math.min(1, line / span));
      fillEl.style.height = `${p * span}px`;
      railEl.querySelectorAll<HTMLElement>("[data-step-dot]").forEach((dot) => {
        const on = dot.getBoundingClientRect().top - r.top + 12 <= line;
        dot.dataset.on = on ? "true" : "false";
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rail} className={s.steps}>
      <div className={s.railLine} aria-hidden="true" />
      <div ref={fill} className={s.railFill} aria-hidden="true" />
      {PROCESS_STEPS.map((step, i) => (
        <Reveal key={step.n} delayMs={(i % 3) * 120} className={s.step}>
          <span data-step-dot="" data-on="false" className={s.stepDot} aria-hidden="true" />
          <div>
            <div className={s.stepTag}>
              <span className={s.stepNum}>{step.n} · </span>
              {step.tag}
            </div>
            <div className={s.stepTitle}>{step.title}</div>
            <div className={s.stepText}>{step.text}</div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
