"use client";

import { useState } from "react";
import type { MortgageConfig } from "@/lib/cms/client";
import { calcMonthlyPayment } from "@/lib/mortgage";
import { formatRub, formatRubPrecise } from "@/lib/format";
import styles from "./mortgage-calculator.module.css";

type MatkapChoice = "none" | "default" | "family";

const TELEGRAM_URL = "https://t.me/Yana_Chekulova";

export function MortgageCalculator({
  price,
  config,
}: {
  price: number;
  config: MortgageConfig;
}) {
  const [down, setDown] = useState(Math.min(700000, config.down_max));
  const [matkap, setMatkap] = useState<MatkapChoice>("default");
  const [rateIdx, setRateIdx] = useState(0);

  const rate = config.rates[rateIdx];
  const matkapAmount =
    matkap === "default" ? config.matkap_sum_default : matkap === "family" ? config.matkap_sum_family : 0;
  const downTotal = down + matkapAmount;
  const payment = calcMonthlyPayment({
    price,
    down: downTotal,
    annualRate: rate.rate,
    termMonths: config.loan_term_years * 12,
  });

  return (
    <div id="calc" className={styles.section}>
      <div className={styles.layout}>
        <div>
          <div className={styles.eyebrow}>Ипотечный калькулятор</div>
          <h2 className={styles.heading}>
            Посчитайте платёж под свою программу
          </h2>
          <p className={styles.lead}>
            Выберите тип ипотеки и первоначальный взнос — платёж
            пересчитается сразу. Маткапитал можно добавить как часть взноса.
            Точные условия подтверждает банк.
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.tabs}>
            {config.rates.map((r, i) => (
              <button
                key={r.label}
                type="button"
                data-mtab=""
                data-on={i === rateIdx ? "true" : "false"}
                className={styles.tab}
                onClick={() => setRateIdx(i)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className={styles.body}>
            <div className={styles.paymentRow}>
              <div>
                <div className={styles.paymentLabel}>Платёж в месяц</div>
                <div className={styles.paymentValue}>
                  {formatRub(payment)}{" "}
                  <span className={styles.paymentCurrency}>₽</span>
                </div>
              </div>
              <div className={styles.rateBlock}>
                <div className={styles.rateLabel}>Ставка</div>
                <div className={styles.rateValue}>{rate.text}</div>
              </div>
            </div>

            <div className={styles.downRow}>
              <span className={styles.downLabel}>Первоначальный взнос</span>
              <span className={styles.downValue}>{formatRub(down)} ₽</span>
            </div>
            <input
              type="range"
              min={config.down_min}
              max={config.down_max}
              step={config.down_step}
              value={down}
              onChange={(e) => setDown(parseInt(e.target.value, 10) || 0)}
            />
            <div className={styles.sliderBounds}>
              <span>{formatRub(config.down_min)} ₽</span>
              <span>{(config.down_max / 1_000_000).toLocaleString("ru-RU")} млн ₽</span>
            </div>

            <div className={styles.matkapGroupLabel}>Материнский капитал</div>
            <div className={styles.matkapOptions}>
              <button
                type="button"
                data-chip=""
                data-on={matkap === "none" ? "true" : "false"}
                className={styles.matkapOption}
                onClick={() => setMatkap("none")}
              >
                Не добавлять
              </button>
              <button
                type="button"
                data-chip=""
                data-on={matkap === "family" ? "true" : "false"}
                className={styles.matkapOption}
                onClick={() => setMatkap("family")}
              >
                На 1-го ребёнка · {formatRubPrecise(config.matkap_sum_family)} ₽
              </button>
              <button
                type="button"
                data-chip=""
                data-on={matkap === "default" ? "true" : "false"}
                className={styles.matkapOption}
                onClick={() => setMatkap("default")}
              >
                На 2-го ребёнка · {formatRubPrecise(config.matkap_sum_default)} ₽
              </button>
            </div>

            <div className={styles.summaryRow}>
              <span>
                Взнос всего: <b style={{ color: "var(--ink)", fontWeight: 600 }}>{formatRub(downTotal)} ₽</b>
              </span>
              <span>срок {config.loan_term_years} лет</span>
            </div>

            <a href={TELEGRAM_URL} className={`tpl-btn-prim ${styles.ctaButton}`}>
              Получить точный расчёт
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
