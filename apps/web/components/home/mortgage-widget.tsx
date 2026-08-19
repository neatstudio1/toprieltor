"use client";

import { useRef, useState } from "react";
import type { MortgageScenario } from "@/lib/cms/client";
import { formatRub } from "@/lib/format";
import styles from "./mortgage-section.module.css";

export function MortgageWidget({ scenarios }: { scenarios: MortgageScenario[] }) {
  const [tab, setTab] = useState(0);
  const [value, setValue] = useState(scenarios[0]?.payment ?? 0);
  const rafRef = useRef<number | null>(null);

  // rAF-driven tween triggered only from this click handler, never during render.
  const selectTab = (i: number) => {
    if (i === tab) return;
    const from = value;
    const to = scenarios[i].payment;
    setTab(i);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/purity -- performance.now() is read inside an event handler, not render
    const start = performance.now();
    const duration = 650;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (to - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const active = scenarios[tab];

  return (
    <div className={styles.card}>
      <div className={styles.tabs}>
        {scenarios.map((s, i) => (
          <button
            key={s.label}
            type="button"
            data-mtab=""
            data-on={i === tab ? "true" : "false"}
            className={styles.tab}
            onClick={() => selectTab(i)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className={styles.body}>
        <div className={styles.label}>Платёж в месяц</div>
        <div className={styles.value}>
          {formatRub(value)} <span className={styles.valueSuffix}>₽/мес</span>
        </div>
        <div className={styles.factsRow}>
          <div>
            <div className={styles.factLabel}>Первый взнос</div>
            <div className={styles.factValue}>{active.down}</div>
          </div>
          <div className={styles.factBordered}>
            <div className={styles.factLabel}>Ставка</div>
            <div className={styles.factValueAccent}>{active.rate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
