"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { MortgageConfig } from "@/lib/cms/client";
import { calcMonthlyPayment } from "@/lib/mortgage";
import { formatRub } from "@/lib/format";
import { submitLead } from "@/lib/cms/leads";
import { TELEGRAM_URL } from "@/lib/site";
import { GOALS, reachGoal, trafficSource } from "@/lib/analytics";
import { campaignCopy } from "@/lib/campaigns";
import styles from "./quiz-flow.module.css";

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
  sub?: string;
  opts?: OptionDef[];
}

const BUDGET_MIN = 3_000_000;
const BUDGET_MAX = 15_000_000;
const BUDGET_STEP = 250_000;
const TERM_MONTHS = 240;
const ADVANCE_DELAY_MS = 230;

function buildSteps(config: MortgageConfig): StepDef[] {
  return [
    {
      key: "goal",
      type: "opts",
      tag: "Цель",
      q: "Для чего покупаете квартиру?",
      sub: "От этого зависит, какие проекты предложим.",
      opts: [
        { v: "Жить самому", l: "Жить самому", d: "Первая или единственная квартира" },
        { v: "Для семьи", l: "Для семьи", d: "Нужны комнаты и школы рядом" },
        { v: "Инвестиция", l: "Инвестиция", d: "Под сдачу или перепродажу" },
        { v: "Переезд", l: "Переезд", d: "Смена района или города" },
      ],
    },
    {
      key: "rooms",
      type: "opts",
      tag: "Комнатность",
      q: "Сколько комнат нужно?",
      sub: "Можно выбрать примерно — уточним при подборе.",
      opts: [
        { v: "Студия", l: "Студия", d: "Компактно и доступно" },
        { v: "1-комнатная", l: "1 комната", d: "Оптимум для одного/пары" },
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
      sub: "Его можно направить на первоначальный взнос.",
      opts: [
        { v: "Нет", l: "Нет", d: "Рассчитаем без него" },
        {
          v: "На первого ребёнка",
          l: "На первого ребёнка",
          d: `${formatRub(config.matkap_sum_family)} ₽`,
          sum: config.matkap_sum_family,
        },
        {
          v: "На второго ребёнка",
          l: "На второго ребёнка",
          d: `${formatRub(config.matkap_sum_default)} ₽`,
          sum: config.matkap_sum_default,
        },
        { v: "Пока оформляю", l: "Пока оформляю", d: "Поможем учесть в сделке" },
      ],
    },
    {
      key: "down",
      type: "opts",
      tag: "Взнос",
      q: "Первоначальный взнос",
      sub: "Если есть маткапитал — он тоже считается.",
      opts: [
        { v: "Нет своих средств", l: "Своих нет", d: "Только маткапитал / субсидии" },
        { v: "до 15%", l: "До 15%", d: "Небольшой стартовый капитал" },
        { v: "15–30%", l: "15–30%", d: "Комфортные условия по ставке" },
        { v: "больше 30%", l: "Больше 30%", d: "Максимально выгодный платёж" },
      ],
    },
    {
      key: "term",
      type: "opts",
      tag: "Сроки",
      q: "Когда планируете покупку?",
      sub: "Поможем не упустить старт продаж и акции.",
      opts: [
        { v: "Сейчас", l: "Готов сейчас", d: "Хочу выйти на сделку" },
        { v: "1–3 месяца", l: "1–3 месяца", d: "Собираю информацию" },
        { v: "3–6 месяцев", l: "3–6 месяцев", d: "Планирую заранее" },
        { v: "Присматриваюсь", l: "Присматриваюсь", d: "Пока изучаю рынок" },
      ],
    },
    { key: "contact", type: "contact" },
  ];
}

export function QuizFlow({ config }: { config: MortgageConfig }) {
  const rate = useMemo(() => {
    const preferential = config.rates.find((r) => r.label.toLowerCase().includes("льготн"));
    return preferential?.rate ?? config.rates[0]?.rate ?? 0.06;
  }, [config]);
  const steps = useMemo(() => buildSteps(config), [config]);

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
  const contactSeenRef = useRef(false);

  // Откуда пришёл человек. Читаем после монтирования: страница статическая,
  // а параметр не влияет ни на отрисовку сервером, ни на индексацию.
  const [source, setSource] = useState<{ campaign: string | null; medium: string | null }>({
    campaign: null,
    medium: null,
  });
  useEffect(() => setSource(trafficSource()), []);
  const copy = campaignCopy(source.campaign);

  const total = steps.length;
  const current = steps[step];
  const isOptions = !done && current?.type === "opts";
  const isBudget = !done && current?.type === "budget";
  const isContact = !done && current?.type === "contact";
  const shownNum = Math.min(step + 1, total);
  const progressPct = Math.round(((done ? total : step) / total) * 100);

  // Шаг с телефоном — главная точка отвала, поэтому меряем вход в него
  // отдельно от отправки: разница между целями и есть цена формы.
  useEffect(() => {
    if (isContact && !contactSeenRef.current) {
      contactSeenRef.current = true;
      reachGoal(GOALS.quizContact, { place: "page", campaign: source.campaign ?? "none" });
    }
  }, [isContact, source.campaign]);

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
    if (!startedRef.current) {
      startedRef.current = true;
      reachGoal(GOALS.quizStart, { place: "page", campaign: source.campaign ?? "none" });
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
      sourcePath: source.campaign ? `/quiz?utm_campaign=${source.campaign}` : "/quiz",
      sourceTitle: copy.label ? `Квиз подбора квартиры · ролик «${copy.label}»` : "Квиз подбора квартиры",
      elapsedMs: Date.now() - mountedAtRef.current,
      quizAnswers: { ...answers, budget },
    });
    if (result.ok) {
      setSubmitStatus("idle");
      setDone(true);
      reachGoal(GOALS.quizSubmit, {
        place: "page",
        campaign: source.campaign ?? "none",
        medium: source.medium ?? "none",
      });
    } else {
      setSubmitStatus("error");
      setErrorMessage(result.message);
    }
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setBudget(6_000_000);
    setName("");
    setPhone("");
    setConsent(false);
    setDone(false);
    setSubmitStatus("idle");
  }

  const nameReady = name.trim().length > 0 && phone.trim().length >= 4 && consent;
  const summary = [
    { k: "Цель", v: answers.goal || "—" },
    { k: "Комнат", v: answers.rooms || "—" },
    { k: "Бюджет", v: `до ${formatRub(budget)} ₽` },
    { k: "Маткапитал", v: answers.matkap || "—" },
    { k: "Срок", v: answers.term || "—" },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="3" y="22" width="8" height="15" rx="3" fill="#C4C7F7" />
            <rect x="15" y="9" width="8" height="28" rx="3" fill="var(--accent)" />
            <rect x="27" y="16" width="8" height="21" rx="3" fill="#C4C7F7" />
          </svg>
          <span className={styles.logoText}>TOPиелтор</span>
        </Link>
        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarEyebrow}>{copy.eyebrow}</div>
          <h1 className={styles.sidebarTitle}>{copy.title}</h1>
          <div className={styles.sidebarPoints}>
            <div className={styles.sidebarPoint}>
              <span className={styles.sidebarArrow}>→</span> Подбор и покупка — бесплатно для вас
            </div>
            <div className={styles.sidebarPoint}>
              <span className={styles.sidebarArrow}>→</span> Свои менеджеры в 25+ банках
            </div>
            <div className={styles.sidebarPoint}>
              <span className={styles.sidebarArrow}>→</span> Маткапитал как первоначальный взнос
            </div>
          </div>
        </div>
        <div className={styles.progressBlock}>
          <div className={styles.progressRow}>
            <span>
              Шаг {shownNum} из {total}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          {isOptions && current.opts ? (
            <div key={`s${step}`} className={styles.stepIn}>
              <div className={styles.stepTag}>{current.tag}</div>
              <h2 className={styles.stepQ}>{current.q}</h2>
              <p className={styles.stepSub}>{current.sub}</p>
              <div className={styles.optionsGrid}>
                {current.opts.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    data-opt=""
                    data-sel={answers[current.key] === o.v ? "true" : "false"}
                    className={styles.option}
                    onClick={() => pick(current.key, o.v)}
                  >
                    <span className={styles.optionLabel}>{o.l}</span>
                    <span className={styles.optionDesc}>{o.d}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isBudget ? (
            <div className={styles.stepIn}>
              <div className={styles.stepTag}>Бюджет</div>
              <h2 className={styles.stepQ}>Какой бюджет рассматриваете?</h2>
              <p className={styles.stepSub}>Ориентир по цене квартиры — точную ставку рассчитает банк.</p>
              <div className={styles.budgetCard}>
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
              <button type="button" className={styles.primaryBtn} onClick={next}>
                Далее
              </button>
            </div>
          ) : null}

          {isContact ? (
            <div className={styles.stepIn}>
              <div className={styles.stepTag}>Последний шаг</div>
              <h2 className={styles.stepQ}>Куда прислать подборку?</h2>
              <p className={styles.stepSub}>Пришлём варианты и расчёт платежа. Без спама и звонков-роботов.</p>
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
                {/* Honeypot: hidden from real users via CSS, only bots that autofill every field touch it. */}
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
                    политикой конфиденциальности и обработки персональных данных
                  </Link>
                </span>
              </label>
              {submitStatus === "error" ? <div className={styles.errorText}>{errorMessage}</div> : null}
              <button
                type="button"
                data-ready={nameReady ? "true" : "false"}
                className={styles.primaryBtn}
                disabled={!nameReady || submitStatus === "submitting"}
                onClick={submit}
              >
                {submitStatus === "submitting" ? "Отправляем…" : "Получить подборку"}
              </button>
            </div>
          ) : null}

          {done ? (
            <div className={styles.stepIn}>
              <div className={styles.doneIcon}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className={styles.doneTitle}>Готово, {name.trim() || "друзья"}!</h2>
              <p className={styles.doneLead}>
                Подберём новостройки под ваш запрос и пришлём расчёт в течение рабочего дня. Вот что мы учли:
              </p>
              <div className={styles.summaryCard}>
                {summary.map((s) => (
                  <div key={s.k} className={styles.summaryRow}>
                    <span className={styles.summaryKey}>{s.k}</span>
                    <span className={styles.summaryValue}>{s.v}</span>
                  </div>
                ))}
                <div className={styles.summaryPayRow}>
                  <span className={styles.summaryPayKey}>Платёж от</span>
                  <span className={styles.summaryPayValue}>{formatRub(resultPay())} ₽/мес</span>
                </div>
              </div>
              <div className={styles.doneActions}>
                <a href={TELEGRAM_URL} className={styles.primaryLink}>
                  Написать в Telegram
                </a>
                <Link href="/catalog" className={styles.secondaryLink}>
                  Смотреть каталог
                </Link>
              </div>
              <button type="button" className={styles.restartBtn} onClick={restart}>
                Пройти заново
              </button>
            </div>
          ) : null}

          {!done && step > 0 ? (
            <button type="button" className={styles.backBtn} onClick={back}>
              <span className={styles.backArrow}>←</span> Назад
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
