"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { MortgageConfig } from "@/lib/cms/client";
import type { PickCard, PickTab } from "@/lib/podbory-picks";
import { calcMonthlyPayment } from "@/lib/mortgage";
import { CARD_TIER, FAMILY_LABEL, FAMILY_SUBSIDY_YEARS, FAMILY_TIERS } from "@/lib/family-mortgage";
import { formatRub } from "@/lib/format";
import { GOALS, lpGoal } from "@/lib/analytics";
import { useLp } from "../lp-shell";
import p from "./podbory.module.css";

/** Доля первого взноса в платеже на карточках: условие, выведенное мелким текстом под блоком. */
const CARD_DOWN_SHARE = 0.2;
const PRICE_MIN = 2_000_000;
const PRICE_MAX = 30_000_000;
const PRICE_STEP = 100_000;

type MatkapChoice = "none" | "family" | "default";

interface Program {
  id: string;
  label: string;
  family: boolean;
  /** Ставка для программ из Strapi; у семейной зависит от числа детей. */
  rate: number;
  text: string;
}

function rub(value: number): string {
  return `${formatRub(value).replace(/ /g, " ")} ₽`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function percent(value: number): string {
  return `${String(Math.round(value * 100)).replace(".", ",")}%`;
}

function mln(value: number): string {
  return `${value / 1_000_000} млн ₽`;
}

interface Calc {
  loan: number;
  payment: number;
  /** Часть кредита сверх лимита семейной ипотеки, она идёт по рыночной ставке. */
  overLimit: number;
  hasMarketRate: boolean;
}

export function Selection({ tabs, config }: { tabs: PickTab[]; config: MortgageConfig }) {
  const { landing, openForm } = useLp();
  const [tabId, setTabId] = useState(() => (tabs.find((t) => t.id === "1k") ?? tabs[0]).id);
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];

  const step = config.down_step;
  const defaultDown = (price: number) =>
    clamp(Math.round((price * CARD_DOWN_SHARE) / step) * step, config.down_min, price);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [price, setPrice] = useState(tab.minPrice);
  const [down, setDown] = useState(() => defaultDown(tab.minPrice));
  const [matkap, setMatkap] = useState<MatkapChoice>("none");
  const [programIdx, setProgramIdx] = useState(0);
  const [children, setChildren] = useState(CARD_TIER.children);
  const touched = useRef(false);

  // Семейная ипотека идёт первой, «Льготную» 6% из Strapi она заменяет.
  const programs: Program[] = [
    { id: "family", label: FAMILY_LABEL, family: true, rate: CARD_TIER.rate, text: "" },
    ...config.rates
      .filter((r) => !/льготн|семейн/i.test(r.label))
      .map((r) => ({ id: r.label, label: r.label, family: false, rate: r.rate, text: r.text })),
  ];
  const program = programs[programIdx] ?? programs[0];
  const tier = FAMILY_TIERS.find((t) => t.children === children) ?? CARD_TIER;
  const rate = program.family ? tier.rate : program.rate;
  const marketRate = config.rates.find((r) => /рыночн/i.test(r.label))?.rate;
  const termMonths = config.loan_term_years * 12;

  function calculate(forPrice: number, downTotal: number, family: boolean, familyTier: typeof tier, plainRate: number): Calc {
    const loan = Math.max(0, forPrice - downTotal);
    if (loan === 0) return { loan, payment: 0, overLimit: 0, hasMarketRate: marketRate !== undefined };
    if (!family) {
      return { loan, payment: calcMonthlyPayment({ price: forPrice, down: downTotal, annualRate: plainRate, termMonths }), overLimit: 0, hasMarketRate: true };
    }
    const inLimit = Math.min(loan, familyTier.maxLoan);
    const overLimit = loan - inLimit;
    let payment = calcMonthlyPayment({ price: inLimit, down: 0, annualRate: familyTier.rate, termMonths });
    if (overLimit > 0 && marketRate !== undefined) {
      payment += calcMonthlyPayment({ price: overLimit, down: 0, annualRate: marketRate, termMonths });
    }
    return { loan, payment, overLimit, hasMarketRate: marketRate !== undefined };
  }

  function cardPayment(card: PickCard): number {
    return calculate(card.price, card.price * CARD_DOWN_SHARE, true, CARD_TIER, CARD_TIER.rate).payment;
  }

  function chooseTab(id: string) {
    const next = tabs.find((t) => t.id === id);
    if (!next) return;
    setTabId(id);
    setSelectedId(null);
    setPrice(next.minPrice);
    setDown(defaultDown(next.minPrice));
  }

  function chooseCard(card: PickCard) {
    setSelectedId(card.id);
    setPrice(card.price);
    setDown(defaultDown(card.price));
  }

  function wantCard(card: PickCard) {
    chooseCard(card);
    lpGoal(GOALS.lpPickClick, landing.key, { project: card.projectName, type: tab.title });
    const what = `${card.typeLabel.toLowerCase()}, ${String(card.area).replace(".", ",")} м², ${formatRub(card.price)} ₽`;
    // Название ЖК на странице не показываем, но менеджеру оно нужно: уходит в заявку скрытой строкой.
    openForm("pick", `Интересует: ${what}`, `Карточка из подборки: ЖК ${card.projectName}, ${what}`);
  }

  function otherVariants() {
    lpGoal(GOALS.lpPickClick, landing.key, { project: "other", type: tab.title });
    openForm("more", `Хочу посмотреть другие варианты: ${tab.title.toLowerCase()}`);
  }

  /** Первое действие с калькулятором считаем один раз за визит. */
  function used() {
    if (touched.current) return;
    touched.current = true;
    lpGoal(GOALS.lpCalcUse, landing.key);
  }

  const maxDown = Math.max(config.down_min, Math.floor(price / step) * step);
  const downNow = clamp(down, config.down_min, maxDown);
  const matkapAmount =
    matkap === "default" ? config.matkap_sum_default : matkap === "family" ? config.matkap_sum_family : 0;
  const downTotal = Math.min(price, downNow + matkapAmount);
  const result = calculate(price, downTotal, program.family, tier, rate);
  const noMortgage = result.loan <= 0;

  return (
    <>
      <div className={p.tabs} role="tablist" aria-label="Тип квартиры">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tabId}
            className={`${p.tab} ${t.id === tabId ? p.tabOn : ""}`}
            onClick={() => chooseTab(t.id)}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className={p.pickGrid}>
        {tab.cards.map((card) => (
          <article key={card.id} className={`${p.pickCard} ${card.id === selectedId ? p.pickCardOn : ""}`}>
            <button type="button" className={p.pickSelect} onClick={() => chooseCard(card)} aria-pressed={card.id === selectedId}>
              <div className={`${p.pickPlan} ${card.planUrl ? "" : p.pickPlanEmpty}`}>
                {card.planUrl ? (
                  <Image
                    src={card.planUrl}
                    alt={`Планировка: ${card.typeLabel.toLowerCase()}, ${card.area} м²`}
                    fill
                    sizes="(max-width: 767px) 80vw, 360px"
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  "Планировка уточняется"
                )}
              </div>
              <div className={p.pickBody}>
                <div className={p.pickPrice}>{rub(card.price)}</div>
                <div className={p.pickType}>
                  {card.typeLabel}, {String(card.area).replace(".", ",")}&nbsp;м²
                </div>
                {card.district ? <div className={p.pickProject}>{card.district}</div> : null}
                <div className={p.pickMeta}>{[card.delivery, card.finish].filter(Boolean).join(" · ")}</div>
                <div className={p.pickPayment}>платёж от {rub(Math.round(cardPayment(card) / 100) * 100)}/мес</div>
              </div>
            </button>
            <button type="button" className={p.pickCta} onClick={() => wantCard(card)}>
              Хочу такой вариант
            </button>
          </article>
        ))}
      </div>

      <div className={p.moreRow}>
        <button type="button" className={p.moreBtn} onClick={otherVariants}>
          Подобрать другие варианты
        </button>
      </div>

      <p className={p.pickFine}>
        Платёж предварительный: {FAMILY_LABEL.toLowerCase()}, {CARD_TIER.label}, ставка {percent(CARD_TIER.rate)}, взнос{" "}
        {percent(CARD_DOWN_SHARE)}, срок {config.loan_term_years} лет. Точные условия подтверждает банк.
      </p>

      <div className={p.calc} id="calc">
        {/* На телефоне платёж «прилипает» сверху карточки и меняется, пока двигаете ползунки. */}
        <div className={p.stickyPay} aria-live="polite">
          <span>Платёж в месяц</span>
          <b>{noMortgage ? "Ипотека не нужна" : rub(Math.round(result.payment / 10) * 10)}</b>
        </div>

        <div className={p.controls}>
          <h3 className={p.calcTitle}>Посчитайте платёж по ипотеке</h3>

          <div className={p.field}>
            <div className={p.fieldHead}>
              <label htmlFor="podbory-price">Стоимость квартиры</label>
              <span className={p.fieldValue}>{rub(price)}</span>
            </div>
            <input
              id="podbory-price"
              className={p.range}
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={clamp(price, PRICE_MIN, PRICE_MAX)}
              onChange={(e) => {
                used();
                setSelectedId(null);
                setPrice(Number(e.target.value));
              }}
            />
          </div>

          <div className={p.field}>
            <div className={p.fieldHead}>
              <label htmlFor="podbory-down">Первоначальный взнос</label>
              <span className={p.fieldValue}>
                {rub(downNow)}
                {price > 0 ? ` · ${percent(downNow / price)}` : ""}
              </span>
            </div>
            <input
              id="podbory-down"
              className={p.range}
              type="range"
              min={config.down_min}
              max={maxDown}
              step={step}
              value={downNow}
              onChange={(e) => {
                used();
                setDown(Number(e.target.value));
              }}
            />
          </div>

          <div className={p.field}>
            <div className={p.fieldHead}>
              <span>Материнский капитал</span>
            </div>
            <div className={p.seg} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} role="group" aria-label="Материнский капитал">
              {(
                [
                  ["none", "Нет", ""],
                  ["family", "На 1-го ребёнка", `${Math.round(config.matkap_sum_family / 1000)} тыс. ₽`],
                  ["default", "На 2-го ребёнка", `${Math.round(config.matkap_sum_default / 1000)} тыс. ₽`],
                ] as [MatkapChoice, string, string][]
              ).map(([id, label, sub]) => (
                <button
                  key={id}
                  type="button"
                  className={`${p.segBtn} ${matkap === id ? p.segOn : ""}`}
                  aria-pressed={matkap === id}
                  onClick={() => {
                    used();
                    setMatkap(id);
                  }}
                >
                  <span>{label}</span>
                  {sub ? <small>{sub}</small> : null}
                </button>
              ))}
            </div>
          </div>

          <div className={p.field} style={program.family ? undefined : { marginBottom: 0 }}>
            <div className={p.fieldHead}>
              <span>Программа</span>
              <span className={p.fieldValue}>
                {program.family ? percent(tier.rate) : program.text} · {config.loan_term_years} лет
              </span>
            </div>
            <div
              className={p.seg}
              style={{ gridTemplateColumns: `repeat(${programs.length}, minmax(0, 1fr))` }}
              role="group"
              aria-label="Программа ипотеки"
            >
              {programs.map((pr, i) => (
                <button
                  key={pr.id}
                  type="button"
                  className={`${p.segBtn} ${i === programIdx ? p.segOn : ""}`}
                  aria-pressed={i === programIdx}
                  onClick={() => {
                    used();
                    setProgramIdx(i);
                  }}
                >
                  <span>{pr.family ? "Семейная" : pr.label}</span>
                </button>
              ))}
            </div>
          </div>

          {program.family ? (
            <div className={p.field} style={{ marginBottom: 0 }}>
              <div className={p.fieldHead}>
                <span>Детей в семье</span>
                <span className={p.fieldValue}>{tier.label} · до {mln(tier.maxLoan)}</span>
              </div>
              <div className={p.seg} style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }} role="group" aria-label="Детей в семье">
                {FAMILY_TIERS.map((t) => (
                  <button
                    key={t.children}
                    type="button"
                    className={`${p.segBtn} ${t.children === children ? p.segOn : ""}`}
                    aria-pressed={t.children === children}
                    onClick={() => {
                      used();
                      setChildren(t.children);
                    }}
                  >
                    <span>{t.children === 5 ? "5+" : t.children}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className={p.result}>
          <div className={p.resultLabel}>Платёж в месяц</div>
          <div className={p.resultValue}>{noMortgage ? "Ипотека не нужна" : rub(Math.round(result.payment / 10) * 10)}</div>
          {noMortgage ? <p className={p.warn}>Взнос покрывает стоимость квартиры.</p> : null}
          {result.overLimit > 0 ? (
            <p className={p.warn}>
              Для этой программы максимальная сумма кредита {mln(tier.maxLoan)}.{" "}
              {result.hasMarketRate
                ? "Остальное посчитано по рыночной ставке."
                : "Остальное придётся оформить по рыночной ставке."}
            </p>
          ) : null}
          {noMortgage ? null : (
            <div className={p.resultRows}>
              <div className={p.resultRow}>
                <span>Сумма кредита</span>
                <b>{rub(result.loan)}</b>
              </div>
              <div className={p.resultRow}>
                <span>Взнос с маткапиталом</span>
                <b>{rub(downTotal)}</b>
              </div>
              <div className={p.resultRow}>
                <span>Переплата за {config.loan_term_years} лет</span>
                <b>{rub(Math.max(0, Math.round(result.payment * termMonths - result.loan)))}</b>
              </div>
            </div>
          )}
          <button
            type="button"
            className={p.resultCta}
            onClick={() =>
              openForm(
                "calc",
                noMortgage
                  ? `Расчёт: квартира ${formatRub(price)} ₽, оплата без ипотеки`
                  : `Расчёт: квартира ${formatRub(price)} ₽, взнос ${formatRub(downTotal)} ₽, ${
                      program.family ? `${FAMILY_LABEL.toLowerCase()}, ${tier.label}, ${percent(tier.rate)}` : `${program.label} ${program.text}`
                    }, ${config.loan_term_years} лет, платёж ${formatRub(Math.round(result.payment / 10) * 10)} ₽/мес`,
              )
            }
          >
            Оставить заявку с этим расчётом
          </button>
        </div>

        <p className={p.calcFine}>
          Расчёт предварительный. Точные условия подтверждает банк.
          {program.family
            ? ` Хотя бы одному ребёнку должно быть меньше 7 лет. Государство субсидирует ставку первые ${FAMILY_SUBSIDY_YEARS} лет, дальше она рыночная: расчёт по льготной ставке на весь срок приблизительный.`
            : ""}
        </p>
      </div>
    </>
  );
}
