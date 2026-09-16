"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { MortgageConfig } from "@/lib/cms/client";
import { calcMonthlyPayment } from "@/lib/mortgage";
import { formatRub } from "@/lib/format";
import { submitLead } from "@/lib/cms/leads";
import { GOALS, reachGoal, trafficSource } from "@/lib/analytics";
import { TELEGRAM_URL } from "@/lib/site";
import styles from "./quiz-popup.module.css";

interface OptionDef {
  v: string;
  l: string;
  d: string;
  sum?: number;
}

interface StepDef {
  key: string;
  type: "opts" | "budget" | "contact";
  tag?: string;
  q?: string;
  opts?: OptionDef[];
}

const BUDGET_MIN = 3_000_000;
const BUDGET_MAX = 15_000_000;
const BUDGET_STEP = 250_000;
const TERM_MONTHS = 240;
const ADVANCE_DELAY_MS = 220;
const SHOW_DELAY_MS = 1200;
const AUTO_OPEN_DELAY_MS = 7000;
const NUDGE_INTERVAL_MS = 22000;
const DONE_STORAGE_KEY = "qpDone";

function buildSteps(config: MortgageConfig): StepDef[] {
  return [
    {
      key: "goal",
      type: "opts",
      tag: "Цель",
      q: "Для чего покупаете?",
      opts: [
        { v: "Жить самому", l: "Жить самому", d: "Первая квартира" },
        { v: "Для семьи", l: "Для семьи", d: "Комнаты и школы рядом" },
        { v: "Инвестиция", l: "Инвестиция", d: "Под сдачу или перепродажу" },
        { v: "Переезд", l: "Переезд", d: "Смена района" },
      ],
    },
    {
      key: "rooms",
      type: "opts",
      tag: "Комнатность",
      q: "Сколько комнат нужно?",
      opts: [
        { v: "Студия", l: "Студия", d: "Компактно и доступно" },
        { v: "1-комнатная", l: "1 комната", d: "Для одного или пары" },
        { v: "2-комнатная", l: "2 комнаты", d: "Для семьи с ребёнком" },
        { v: "3+ комнаты", l: "3 и больше", d: "Просторная планировка" },
      ],
    },
    { key: "budget", type: "budget" },
    {
      key: "matkap",
      type: "opts",
      tag: "Капитал",
      q: "Есть материнский капитал?",
      opts: [
        { v: "Нет", l: "Нет", d: "Рассчитаем без него" },
        { v: "На первого ребёнка", l: "На первого ребёнка", d: `${formatRub(config.matkap_sum_family)} ₽`, sum: config.matkap_sum_family },
        { v: "На второго ребёнка", l: "На второго ребёнка", d: `${formatRub(config.matkap_sum_default)} ₽`, sum: config.matkap_sum_default },
      ],
    },
    {
      key: "term",
      type: "opts",
      tag: "Сроки",
      q: "Когда планируете покупку?",
      opts: [
        { v: "Сейчас", l: "Готов сейчас", d: "Хочу выйти на сделку" },
        { v: "1–3 месяца", l: "1–3 месяца", d: "Собираю информацию" },
        { v: "Присматриваюсь", l: "Присматриваюсь", d: "Изучаю рынок" },
      ],
    },
    { key: "contact", type: "contact" },
  ];
}

export function QuizPopup({ config }: { config: MortgageConfig }) {
  const pathname = usePathname();
  const rate = useMemo(() => {
    const preferential = config.rates.find((r) => r.label.toLowerCase().includes("льготн"));
    return preferential?.rate ?? config.rates[0]?.rate ?? 0.06;
  }, [config]);
  const steps = useMemo(() => buildSteps(config), [config]);

  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState(6_000_000);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedAtRef = useRef(Date.now());
  const startedRef = useRef(false);

  useEffect(() => {
    let closed = false;
    try {
      closed = sessionStorage.getItem(DONE_STORAGE_KEY) === "1";
    } catch {
      // sessionStorage unavailable (e.g. privacy mode) — just show the widget.
    }
    if (closed) return;

    const t1 = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    const iv = setInterval(() => {
      setNudge(true);
      setTimeout(() => setNudge(false), 900);
    }, NUDGE_INTERVAL_MS);

    return () => {
      clearTimeout(t1);
      clearInterval(iv);
    };
  }, []);

  // Auto-open after AUTO_OPEN_DELAY_MS unless the user already opened or finished it.
  useEffect(() => {
    const t = setTimeout(() => {
      setOpen((prev) => {
        if (prev || done) return prev;
        return true;
      });
    }, AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot timer, deliberately not re-armed on done/open changes
  }, []);

  const total = steps.length;
  const current = steps[step];
  const isOptions = !done && current?.type === "opts";
  const isBudget = !done && current?.type === "budget";
  const isContact = !done && current?.type === "contact";
  const shownNum = Math.min(step + 1, total);
  const progressPct = Math.round(((done ? total : step) / total) * 100);

  function payFor(price: number): number {
    return calcMonthlyPayment({ price, down: price * 0.15, annualRate: rate, termMonths: TERM_MONTHS });
  }

  function matkapSum(): number {
    const matkapStep = steps.find((s) => s.key === "matkap");
    const opt = matkapStep?.opts?.find((o) => o.v === answers.matkap);
    return opt?.sum ?? 0;
  }

  function resultPay(): number {
    const down = Math.max(budget * 0.1, matkapSum());
    const principal = Math.max(budget * 0.3, budget - down);
    return calcMonthlyPayment({ price: principal, down: 0, annualRate: rate, termMonths: TERM_MONTHS });
  }

  function pick(key: string, val: string) {
    // Попап и страница шлют одну цель с разным `place`: воронка общая, а
    // сравнить, где люди доходят до конца чаще, всё равно нужно.
    if (!startedRef.current) {
      startedRef.current = true;
      reachGoal(GOALS.quizStart, { place: "popup", campaign: trafficSource().campaign ?? "none" });
    }
    setAnswers((a) => ({ ...a, [key]: val }));
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => next(), ADVANCE_DELAY_MS);
  }

  function next() {
    setStep((s) => Math.min(steps.length, s + 1));
  }

  function back() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setStep((s) => Math.max(0, s - 1));
    setDone(false);
  }

  async function submit() {
    if (!name.trim() || phone.trim().length < 4 || !consent) return;
    setSubmitStatus("submitting");
    setErrorMessage("");
    const result = await submitLead({
      name,
      phone,
      comment: "",
      website,
      sourcePath: typeof window !== "undefined" ? window.location.pathname : "/",
      sourceTitle: typeof document !== "undefined" ? document.title : "Квиз (попап)",
      elapsedMs: Date.now() - mountedAtRef.current,
      quizAnswers: { ...answers, budget },
    });
    if (result.ok) {
      setSubmitStatus("idle");
      setDone(true);
      const src = trafficSource();
      reachGoal(GOALS.quizSubmit, {
        place: "popup",
        campaign: src.campaign ?? "none",
        medium: src.medium ?? "none",
      });
      try {
        sessionStorage.setItem(DONE_STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    } else {
      setSubmitStatus("error");
      setErrorMessage(result.message);
    }
  }

  function minimize() {
    setOpen(false);
  }

  const nameReady = name.trim().length > 0 && phone.trim().length >= 4 && consent;

  if (!visible || pathname?.startsWith("/quiz")) return null;

  const hasStickyBar = pathname?.startsWith("/zhk/") ?? false;

  return (
    <div className={`${styles.wrap} ${hasStickyBar ? styles.raised : ""}`}>
      {!open ? (
        <button type="button" data-nudge={nudge ? "true" : "false"} className={styles.bubble} onClick={() => setOpen(true)}>
          <span className={styles.bubbleIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l2.4 5.6L20 9l-4 4 1 6-5-2.8L7 19l1-6-4-4 5.6-.4L12 3z" />
            </svg>
            <span className={styles.bubbleDot} />
          </span>
          Подобрать за 2 мин
        </button>
      ) : (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.cardHeaderLeft}>
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect x="3" y="22" width="8" height="15" rx="3" fill="#C4C7F7" />
                  <rect x="15" y="9" width="8" height="28" rx="3" fill="#4F46E5" />
                  <rect x="27" y="16" width="8" height="21" rx="3" fill="#C4C7F7" />
                </svg>
                <span className={styles.cardHeaderLabel}>Подбор за 2 минуты</span>
              </div>
              <button type="button" onClick={minimize} aria-label="Свернуть" className={styles.closeBtn}>
                ×
              </button>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className={styles.body}>
            {isOptions && current.opts ? (
              <div key={`s${step}`} className={styles.stepIn}>
                <div className={styles.stepMetaRow}>
                  <span className={styles.stepTag}>{current.tag}</span>
                  <span className={styles.stepCount}>
                    {shownNum} / {total}
                  </span>
                </div>
                <h3 className={styles.stepQ}>{current.q}</h3>
                <div className={styles.optionsList}>
                  {current.opts.map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      data-sel={answers[current.key] === o.v ? "true" : "false"}
                      className={styles.option}
                      onClick={() => pick(current.key, o.v)}
                    >
                      <span>
                        <span className={styles.optionLabel}>{o.l}</span>
                        <span className={styles.optionDesc}>{o.d}</span>
                      </span>
                      <span className={styles.optionArrow}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isBudget ? (
              <div className={styles.stepIn}>
                <div className={styles.stepMetaRow}>
                  <span className={styles.stepTag}>Бюджет</span>
                  <span className={styles.stepCount}>
                    {shownNum} / {total}
                  </span>
                </div>
                <h3 className={styles.stepQ}>Какой бюджет рассматриваете?</h3>
                <div className={styles.budgetValue}>
                  до {formatRub(budget)} <span className={styles.budgetCurrency}>₽</span>
                </div>
                <div className={styles.budgetPay}>≈ платёж от {formatRub(payFor(budget))} ₽/мес</div>
                <input
                  type="range"
                  min={BUDGET_MIN}
                  max={BUDGET_MAX}
                  step={BUDGET_STEP}
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value, 10))}
                  className={styles.range}
                />
                <div className={styles.budgetBounds}>
                  <span>{formatRub(BUDGET_MIN)} ₽</span>
                  <span>{formatRub(BUDGET_MAX)} ₽</span>
                </div>
              </div>
            ) : null}

            {isContact ? (
              <div className={styles.stepIn}>
                <div className={styles.stepMetaRow}>
                  <span className={styles.stepTag}>Последний шаг</span>
                  <span className={styles.stepCount}>
                    {shownNum} / {total}
                  </span>
                </div>
                <h3 className={styles.stepQ}>Куда прислать подборку?</h3>
                <p className={styles.contactLead}>Пришлём варианты и расчёт платежа. Без спама.</p>
                <div className={styles.contactFields}>
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.field}
                    autoComplete="name"
                  />
                  <input
                    type="tel"
                    placeholder="Телефон или @telegram"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.field}
                    autoComplete="tel"
                  />
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className={styles.honeypot}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                </div>
                <label className={styles.consentRow}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className={styles.consentCheckbox}
                  />
                  <span>
                    Согласен(на) с{" "}
                    <Link href="/privacy" target="_blank" className={styles.consentLink}>
                      политикой конфиденциальности
                    </Link>
                  </span>
                </label>
                {submitStatus === "error" ? <div className={styles.errorText}>{errorMessage}</div> : null}
              </div>
            ) : null}

            {done ? (
              <div className={styles.doneWrap}>
                <div className={styles.doneIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className={styles.doneTitle}>Готово, {name.trim() || "друзья"}!</h3>
                <p className={styles.doneLead}>Подберём варианты и пришлём расчёт в течение рабочего дня.</p>
                <div className={styles.doneSummary}>
                  <span className={styles.doneSummaryKey}>Платёж от</span>
                  <span className={styles.doneSummaryValue}>{formatRub(resultPay())} ₽/мес</span>
                </div>
                <a href={TELEGRAM_URL} className={styles.telegramLink}>
                  Написать в Telegram
                </a>
              </div>
            ) : null}
          </div>

          {!done && (isBudget || isContact) ? (
            <div className={styles.footer}>
              {step > 0 ? (
                <button type="button" onClick={back} className={styles.backBtn}>
                  ←
                </button>
              ) : null}
              <button
                type="button"
                className={styles.actionBtn}
                disabled={isContact && (!nameReady || submitStatus === "submitting")}
                onClick={isContact ? submit : next}
              >
                {isContact ? (submitStatus === "submitting" ? "Отправляем…" : "Получить подборку") : "Далее"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
