"use client";

import { useRef, useState } from "react";
import { calcMonthlyPayment } from "@/lib/mortgage";
import { formatRub } from "@/lib/format";
import styles from "./payment-calculator.module.css";

export interface PaymentScenario {
  label: string;
  down: number;
  downText: string;
  rate: number;
  rateText: string;
}

export function PaymentCalculator({
  price,
  scenarios,
}: {
  price: number;
  scenarios: PaymentScenario[];
}) {
  const [tab, setTab] = useState(0);
  const [value, setValue] = useState(() =>
    calcMonthlyPayment({ price, down: scenarios[0].down, annualRate: scenarios[0].rate, termMonths: 240 }),
  );
  const rafRef = useRef<number | null>(null);

  const selectTab = (i: number) => {
    if (i === tab) return;
    const from = value;
    const to = calcMonthlyPayment({
      price,
      down: scenarios[i].down,
      annualRate: scenarios[i].rate,
      termMonths: 240,
    });
    setTab(i);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/purity -- performance.now() is read inside an event handler, not render
    const start = performance.now();
    const duration = 600;
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
            <div className={styles.factValue}>{active.downText}</div>
          </div>
          <div className={styles.factBordered}>
            <div className={styles.factLabel}>Ставка</div>
            <div className={styles.factValueAccent}>{active.rateText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
