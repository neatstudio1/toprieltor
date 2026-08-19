"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { WhyFreeStep } from "@/lib/cms/client";
import styles from "./why-free-flow.module.css";

export function WhyFreeFlow({
  eyebrow,
  title,
  steps,
}: {
  eyebrow: string;
  title: string;
  steps: WhyFreeStep[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [litCount, setLitCount] = useState(0);
  const [stampShown, setStampShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          if (reduceMotion) {
            setLitCount(steps.length);
            setStampShown(true);
            continue;
          }
          steps.forEach((_, i) => {
            setTimeout(() => setLitCount((c) => Math.max(c, i + 1)), i * 320);
          });
          setTimeout(() => setStampShown(true), steps.length * 320 + 120);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [steps]);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.flow} ref={ref}>
          {steps.map((step, i) => (
            <Fragment key={step.n}>
              <div className={`${styles.step} ${i < litCount ? styles.lit : ""}`}>
                <div className={styles.stepNum}>{step.n}</div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDesc}>{step.desc}</div>
              </div>
              <div className={styles.arrow}>→</div>
            </Fragment>
          ))}
          <div className={`${styles.stamp} ${stampShown ? styles.shown : ""}`}>
            <div className={styles.stampInner}>
              <div className={styles.stampValue}>0 ₽</div>
              <div className={styles.stampLabel}>для клиента</div>
            </div>
          </div>
        </div>
        <p className={styles.footnote}>
          * Бесплатно при покупке через нашу команду. Расчёты предварительные, точные условия по ипотеке подтверждает
          банк.
        </p>
      </div>
    </section>
  );
}
