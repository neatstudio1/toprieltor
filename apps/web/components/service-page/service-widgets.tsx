"use client";

import { useState } from "react";
import Link from "next/link";
import { calcMonthlyPayment } from "@/lib/mortgage";
import { formatRub } from "@/lib/format";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import {
  BA_SETS,
  CHECKLIST_ITEMS,
  DEFECT_ITEMS,
  DESIGN_STYLES,
  INV_TYPES,
  RATE_PRESETS,
  type BaItem,
} from "./service-widget-data";
import styles from "./service-widgets.module.css";

function rateText(v: number): string {
  return v.toFixed(2).replace(/0$/, "").replace(/\.$/, "").replace(".", ",") + "%";
}

export function MortgageCalcWidget() {
  const [price, setPrice] = useState(5_500_000);
  const [down, setDown] = useState(20);
  const [term, setTerm] = useState(20);
  const [rate, setRate] = useState(5.75);

  const loan = Math.max(0, price * (1 - down / 100));
  const pay = calcMonthlyPayment({ price, down: price * (down / 100), annualRate: rate / 100, termMonths: term * 12 });
  const downSum = price * (down / 100);

  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>Калькулятор платежа</div>
      <h2 className={styles.sectionTitle}>Посчитайте платёж до заявки в банк</h2>
      <div className={styles.calcGrid}>
        <div className={styles.calcCard}>
          <div className={styles.field}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Цена квартиры</span>
              <span className={styles.fieldValue}>{formatRub(price)} ₽</span>
            </div>
            <input type="range" min={2_000_000} max={16_000_000} step={100_000} value={price} onChange={(e) => setPrice(+e.target.value)} className={styles.range} />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Первоначальный взнос</span>
              <span className={styles.fieldValue}>
                {down}% · {formatRub(downSum)} ₽
              </span>
            </div>
            <input type="range" min={10} max={60} step={1} value={down} onChange={(e) => setDown(+e.target.value)} className={styles.range} />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Срок кредита</span>
              <span className={styles.fieldValue}>{term} лет</span>
            </div>
            <input type="range" min={5} max={30} step={1} value={term} onChange={(e) => setTerm(+e.target.value)} className={styles.range} />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Ставка</span>
              <span className={styles.fieldValue}>{rateText(rate)}</span>
            </div>
            <input type="range" min={4} max={20} step={0.25} value={rate} onChange={(e) => setRate(+e.target.value)} className={styles.range} />
            <div className={styles.presets}>
              {RATE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`${styles.chip} ${Math.abs(rate - p.v) < 0.01 ? styles.chipOn : ""}`}
                  onClick={() => setRate(p.v)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.calcResult}>
          <div className={styles.resultKicker}>Ежемесячный платёж</div>
          <div className={styles.resultBig}>{formatRub(pay)} ₽</div>
          <div className={styles.resultRows}>
            <div className={styles.resultRow}>
              <span>Сумма кредита</span>
              <span>{formatRub(loan)} ₽</span>
            </div>
            <div className={styles.resultRow}>
              <span>Взнос деньгами</span>
              <span>{formatRub(downSum)} ₽</span>
            </div>
            <div className={styles.resultRow}>
              <span>Переплата за срок</span>
              <span>{formatRub(pay * term * 12 - loan)} ₽</span>
            </div>
          </div>
          <Link href="/quiz" className={`tpl-btn-prim ${styles.resultCta}`}>
            Проверить одобрение в 25+ банках
          </Link>
          <p className={styles.resultNote}>Расчёт предварительный: точные условия и ставку подтверждает банк после скоринга.</p>
        </div>
      </div>
    </section>
  );
}

export function LegalChecklistWidget() {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>Что мы проверяем</div>
      <h2 className={styles.sectionTitle}>38 пунктов до подписания договора</h2>
      <div className={styles.checklistGrid}>
        <div className={styles.checklistList}>
          {CHECKLIST_ITEMS.map((c) => (
            <div className={styles.checklistItem} key={c.title}>
              <span className={styles.checkIcon}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8.5 L6.5 12 L13 4.5" />
                </svg>
              </span>
              <div>
                <div className={styles.checklistTitle}>{c.title}</div>
                <div className={styles.checklistDesc}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.darkCard}>
          <div className={styles.darkKicker}>Итог проверки</div>
          <div className={styles.darkTitle}>Письменное заключение юриста с зонами риска</div>
          <p className={styles.darkText}>Получаете PDF: что проверено, что вызывает вопросы, какие пункты ДДУ просим изменить до подписания.</p>
          <div className={styles.darkRows}>
            <div className={styles.darkRow}>
              <span>Срок</span>
              <span>2–3 дня</span>
            </div>
            <div className={styles.darkRow}>
              <span>Стоимость для клиента</span>
              <span className={styles.darkRowAccent}>0 ₽</span>
            </div>
            <div className={styles.darkRow}>
              <span>Эскроу-счёт</span>
              <span>обязателен</span>
            </div>
          </div>
          <Link href="/quiz" className={`tpl-btn-prim ${styles.darkCta}`}>
            Отдать объект на проверку
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DefectsWidget() {
  return (
    <section className={styles.sectionTight}>
      <div className={styles.twoCol}>
        <div className={styles.defectsCard}>
          <div className={styles.defectsHead}>
            <div className={styles.defectsKicker}>Чек-лист приёмки</div>
            <div className={styles.defectsTitle}>Что находим чаще всего</div>
          </div>
          {DEFECT_ITEMS.map((d) => (
            <div className={styles.defectRow} key={d.n}>
              <span className={styles.defectN}>{d.n}</span>
              <span className={styles.defectTitle}>{d.title}</span>
              <span className={styles.defectFreq}>{d.freq}</span>
            </div>
          ))}
          <div className={styles.defectsFoot}>Полный чек-лист — 120+ пунктов: геометрия, стяжка, окна, вентиляция, электрика, отделка.</div>
        </div>
        <div className={styles.darkCard}>
          <div className={styles.darkKicker}>Как проходит приёмка</div>
          <div className={styles.darkTitle}>Приходим с приборами и подписываем дефектный акт</div>
          <p className={styles.darkText}>Тепловизор, лазерный уровень, анемометр, пирометр. Дефекты фиксируем фото и вносим в акт — застройщик обязан устранить до подписания.</p>
          <div className={styles.darkRows}>
            <div className={styles.darkRow}>
              <span>Длительность осмотра</span>
              <span>2–3 часа</span>
            </div>
            <div className={styles.darkRow}>
              <span>Повторная приёмка</span>
              <span className={styles.darkRowAccent}>включена</span>
            </div>
            <div className={styles.darkRow}>
              <span>Средний срок устранения</span>
              <span>20–45 дней</span>
            </div>
          </div>
          <Link href="/quiz" className={`tpl-btn-prim ${styles.darkCta}`}>
            Записаться на приёмку
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DesignStylesWidget() {
  const [active, setActive] = useState(0);
  return (
    <section className={styles.sectionTight}>
      <div className={styles.stylesHead}>
        <div>
          <div className={styles.eyebrow}>Дизайн-проект</div>
          <h2 className={styles.sectionTitle}>Выберите стиль — соберём смету под него</h2>
        </div>
        <div className={styles.stylesNote}>Материалы закупаем у партнёров со скидкой до 15% — экономия попадает в вашу смету.</div>
      </div>
      <div className={styles.stylesGrid}>
        {DESIGN_STYLES.map((s, idx) => (
          <button key={s.name} type="button" className={`${styles.styleCard} ${idx === active ? styles.styleCardOn : ""}`} onClick={() => setActive(idx)}>
            <div className={styles.stylePhoto}>
              <PhotoPlaceholder label={s.name} />
              {idx === active ? (
                <span className={styles.styleDot}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8.5 L6.5 12 L13 4.5" />
                  </svg>
                </span>
              ) : null}
            </div>
            <div className={styles.styleBody}>
              <div className={styles.styleName}>{s.name}</div>
              <div className={styles.styleDesc}>{s.desc}</div>
              <div className={styles.stylePrice}>{s.price}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function BeforeAfterWidget({ kind, kicker, title }: { kind: "priemka" | "remont"; kicker: string; title: string }) {
  const items = BA_SETS[kind];
  const [idx, setIdx] = useState(0);
  const [pct, setPct] = useState(50);
  const cur: BaItem = items[Math.min(idx, items.length - 1)];

  return (
    <section className={styles.sectionTight}>
      <div className={styles.eyebrow}>{kicker}</div>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.baTabs}>
        {items.map((it, i) => (
          <button
            key={it.label}
            type="button"
            className={`${styles.chip} ${i === idx ? styles.chipOn : ""}`}
            onClick={() => {
              setIdx(i);
              setPct(50);
            }}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div className={styles.baCard}>
        <div className={styles.baPhoto}>
          <div className={styles.baLayer}>
            <PhotoPlaceholder label={`После: ${cur.title}`} />
          </div>
          <div className={styles.baLayerClip} style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
            <PhotoPlaceholder label={`До: ${cur.title}`} style={{ background: "var(--dark)" }} />
          </div>
          <div className={styles.baDivider} style={{ left: `${pct}%` }} />
          <div className={styles.baLabelLeft}>{kind === "priemka" ? "Дефект" : "До ремонта"}</div>
          <div className={styles.baLabelRight}>{kind === "priemka" ? "Устранено" : "После"}</div>
          <input type="range" min={2} max={98} step={0.5} value={pct} onChange={(e) => setPct(+e.target.value)} aria-label="Сравнение до и после" className={styles.baRange} />
        </div>
        <div className={styles.baFoot}>
          <div className={styles.baFootBody}>
            <div className={styles.baFootTitle}>{cur.title}</div>
            <div className={styles.baFootDesc}>{cur.desc}</div>
          </div>
          <div className={styles.baFootFact}>{cur.fact}</div>
        </div>
      </div>
    </section>
  );
}

export function YieldCalcWidget() {
  const [price, setPrice] = useState(4_700_000);
  const [typeIdx, setTypeIdx] = useState(1);
  const [mode, setMode] = useState<"long" | "short">("long");

  const t = INV_TYPES[typeIdx];
  const scale = price / 4_700_000;
  const rentLong = t.rentBase * Math.pow(scale, 0.72);
  const rent = mode === "short" ? rentLong * 1.72 : rentLong;
  const vacancy = mode === "short" ? 0.22 : 0.06;
  const yearNet = rent * 12 * (1 - vacancy);
  const yieldPct = (yearNet / price) * 100;
  const payback = price / yearNet;

  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>Калькулятор доходности</div>
      <h2 className={styles.sectionTitle}>Сколько принесёт квартира в аренде</h2>
      <div className={styles.calcGrid}>
        <div className={styles.calcCard}>
          <div className={styles.field}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Цена квартиры</span>
              <span className={styles.fieldValue}>{formatRub(price)} ₽</span>
            </div>
            <input type="range" min={2_500_000} max={14_000_000} step={100_000} value={price} onChange={(e) => setPrice(+e.target.value)} className={styles.range} />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel} style={{ marginBottom: 14 }}>
              Тип квартиры
            </div>
            <div className={styles.presets}>
              {INV_TYPES.map((it, i) => (
                <button key={it.label} type="button" className={`${styles.chip} ${i === typeIdx ? styles.chipOn : ""}`} onClick={() => setTypeIdx(i)}>
                  {it.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabel} style={{ marginBottom: 14 }}>
              Стратегия
            </div>
            <div className={styles.presets}>
              {[
                { k: "long" as const, label: "Долгосрочная" },
                { k: "short" as const, label: "Посуточная" },
              ].map((m) => (
                <button key={m.k} type="button" className={`${styles.chip} ${mode === m.k ? styles.chipOn : ""}`} onClick={() => setMode(m.k)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.yieldSplit}>
            <div>
              <div className={styles.yieldSplitLabel}>Аренда в месяц</div>
              <div className={styles.yieldSplitValue}>{formatRub(rent)} ₽</div>
            </div>
            <div>
              <div className={styles.yieldSplitLabel}>Доход за год</div>
              <div className={styles.yieldSplitValue}>{formatRub(yearNet)} ₽</div>
            </div>
          </div>
        </div>
        <div className={styles.calcResult}>
          <div className={styles.resultKicker}>Доходность</div>
          <div className={styles.resultBig}>{yieldPct.toFixed(1).replace(".", ",")}% годовых</div>
          <div className={styles.resultRows}>
            <div className={styles.resultRow}>
              <span>Окупаемость</span>
              <span>{payback.toFixed(1).replace(".", ",")} лет</span>
            </div>
            <div className={styles.resultRow}>
              <span>Меблировка под сдачу</span>
              <span>от {formatRub(t.furnish)} ₽</span>
            </div>
            <div className={styles.resultRow}>
              <span>Простой в году</span>
              <span>{mode === "short" ? "~11 недель" : "~3 недели"}</span>
            </div>
          </div>
          <Link href="/quiz" className={`tpl-btn-prim ${styles.resultCta}`}>
            Подобрать объект под доход
          </Link>
          <p className={styles.resultNote}>Расчёт по средним ставкам аренды Екатеринбурга за 2026 год, без учёта налогов и роста стоимости объекта.</p>
        </div>
      </div>
    </section>
  );
}
