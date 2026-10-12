"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TELEGRAM_URL } from "@/lib/site";
import { POPUP_STEPS } from "@/lib/landings";
import { fmtPhone, phoneComplete } from "./phone";
import { GOALS, lpGoal } from "@/lib/analytics";
import { useLp } from "./lp-shell";
import { useLeadSubmit } from "./use-lead-submit";
import s from "./lp.module.css";

const TOTAL_STEPS = POPUP_STEPS.length + 1;
const SHOW_DELAY_MS = 1200;
const NUDGE_EVERY_MS = 14000;
const ADVANCE_DELAY_MS = 220;

export function QuizBubble({ hidden, raised, roomHints }: { hidden: boolean; raised: boolean; roomHints: string[] }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const { landing } = useLp();
  const submitLead = useLeadSubmit();
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!visible || open || done) return;
    const interval = setInterval(() => {
      setNudge(true);
      setTimeout(() => setNudge(false), 900);
    }, NUDGE_EVERY_MS);
    return () => clearInterval(interval);
  }, [visible, open, done]);

  useEffect(
    () => () => {
      if (advance.current) clearTimeout(advance.current);
    },
    [],
  );

  const current = POPUP_STEPS[step];
  const isOptions = !done && Boolean(current);
  const isContact = !done && step === POPUP_STEPS.length;
  const ready = name.trim().length > 0 && phoneComplete(phone);

  function pick(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (advance.current) clearTimeout(advance.current);
    advance.current = setTimeout(() => setStep((v) => v + 1), ADVANCE_DELAY_MS);
  }

  function back() {
    if (advance.current) clearTimeout(advance.current);
    setStep((v) => Math.max(0, v - 1));
  }

  const progress = Math.round(((done ? TOTAL_STEPS : step) / TOTAL_STEPS) * 100);

  return (
    <div className={`${s.bubbleRoot} ${raised ? s.bubbleRaised : ""}`} style={{ display: hidden ? "none" : undefined }}>
      {visible && !open ? (
        <button
          type="button"
          className={s.bubbleButton}
          data-nudge={nudge ? "true" : "false"}
          onClick={() => {
            lpGoal(GOALS.lpCtaClick, landing.key, { block: "bubble" });
            setOpen(true);
            setNudge(false);
          }}
        >
          <span className={s.bubbleIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l2.4 5.6L20 9l-4 4 1 6-5-2.8L7 19l1-6-4-4 5.6-.4L12 3z" />
            </svg>
            <span className={s.bubbleDot} />
          </span>
          Подобрать за 1 мин
        </button>
      ) : null}

      {open ? (
        <div className={s.bubbleCard}>
          <div className={s.bubbleHead}>
            <div className={s.bubbleHeadRow}>
              <div className={s.bubbleBrand}>
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect x="3" y="22" width="8" height="15" rx="3" fill="#C4C7F7" />
                  <rect x="15" y="9" width="8" height="28" rx="3" fill="#4f46e5" />
                  <rect x="27" y="16" width="8" height="21" rx="3" fill="#C4C7F7" />
                </svg>
                <span>Подбор за 1 минуту</span>
              </div>
              <button type="button" className={s.bubbleMin} onClick={() => setOpen(false)} aria-label="Свернуть">
                ×
              </button>
            </div>
            <div className={s.bubbleTrack}>
              <div className={s.bubbleFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={s.bubbleBody}>
            {isOptions && !isContact && current ? (
              <div key={`s${step}`} className={s.bubbleStep}>
                <div className={s.bubbleStepMeta}>
                  <span>{current.tag}</span>
                  <span>{step + 1} / {TOTAL_STEPS}</span>
                </div>
                <h3 className={s.bubbleQ}>{current.q}</h3>
                <div className={s.bubbleOpts}>
                  {current.opts.map(([label, staticHint], optIndex) => (
                    <button
                      key={label}
                      type="button"
                      className={`${s.bubbleOpt} ${answers[current.key] === label ? s.bubbleOptOn : ""}`}
                      onClick={() => pick(current.key, label)}
                    >
                      <span>{label}</span>
                      <span className={s.bubbleOptHint}>{current.key === "rooms" ? (roomHints[optIndex] ?? staticHint) : staticHint}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isContact ? (
              <div className={s.bubbleStep}>
                <div className={s.bubbleStepMeta}>
                  <span>Последний шаг</span>
                  <span>{TOTAL_STEPS} / {TOTAL_STEPS}</span>
                </div>
                <h3 className={s.bubbleQ}>Куда прислать подборку?</h3>
                <p className={s.bubbleHintText}>Пришлю сама в течение 15 минут.</p>
                <div className={s.bubbleFields}>
                  <input
                    id="lp-bubble-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={s.bubbleInput}
                  />
                  <input
                    id="lp-bubble-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={phone}
                    onChange={(e) => setPhone(fmtPhone(e.target.value))}
                    className={s.bubbleInput}
                  />
                </div>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={s.honeypot}
                />
                {sendError ? <div className={s.bubbleError}>{sendError}</div> : null}
                <div className={s.bubblePolicy}>
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <Link href="/privacy" target="_blank">
                    политикой конфиденциальности
                  </Link>
                </div>
              </div>
            ) : null}

            {done ? (
              <div className={`${s.bubbleStep} ${s.bubbleDone}`}>
                <div className={s.bubbleDoneIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className={s.bubbleDoneTitle}>Готовлю подборку, {name.trim()}</h3>
                <p className={s.bubbleDoneText}>Напишу в течение 15 минут, с 9:00 до 21:00.</p>
                <a href={TELEGRAM_URL} className={s.bubbleDoneLink}>
                  Написать Яне сейчас
                </a>
              </div>
            ) : null}
          </div>

          {!done && step > 0 ? (
            <div className={s.bubbleActions}>
              <button type="button" className={s.bubbleBack} onClick={back} aria-label="Назад">
                ←
              </button>
              {isContact ? (
                <button
                  type="button"
                  className={`${s.bubbleSubmit} ${ready ? "" : s.bubbleSubmitOff}`}
                  disabled={sending}
                  onClick={async () => {
                    if (!ready || sending) return;
                    setSending(true);
                    setSendError("");
                    const result = await submitLead({ name, phone, website, quizAnswers: answers, place: "bubble" });
                    setSending(false);
                    if (result.ok) setDone(true);
                    else setSendError(result.message);
                  }}
                >
                  {sending ? "Отправляю…" : "Получить подборку"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
