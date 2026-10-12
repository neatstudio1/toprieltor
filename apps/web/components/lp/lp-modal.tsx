"use client";

import { useState } from "react";
import Link from "next/link";
import { TELEGRAM_URL } from "@/lib/site";
import { fmtPhone, phoneComplete } from "./phone";
import { CONSENT_ERROR, thanksLine } from "./thanks";
import { TrackedLink } from "./tracked-link";
import { useLeadSubmit, type LpMessenger } from "./use-lead-submit";
import s from "./lp.module.css";

type FieldError = "name" | "phone" | "consent" | "server" | null;

export function LpModal({
  step,
  messenger,
  onClose,
}: {
  step: "form" | "thanks";
  messenger?: LpMessenger;
  onClose: () => void;
}) {
  const submitLead = useLeadSubmit();
  const [current, setCurrent] = useState(step);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<FieldError>(null);
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");

  async function submit() {
    if (sending) return;
    if (!name.trim()) return setError("name");
    if (!phoneComplete(phone)) return setError("phone");
    if (!agree) return setError("consent");
    setSending(true);
    const result = await submitLead({ name, phone, website, place: "modal" });
    setSending(false);
    if (result.ok) {
      setCurrent("thanks");
    } else {
      setServerError(result.message);
      setError("server");
    }
  }

  return (
    <div
      className={s.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={s.modalPanel} role="dialog" aria-modal="true" aria-label="Заявка на подбор">
        <div className={s.modalBody}>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {current === "form" ? (
            <>
              <div className={s.modalEyebrow}>Заявка на подбор</div>
              <h3 className={s.modalTitle}>Подберём квартиры под ваш бюджет</h3>
              <p className={s.modalLead}>Пришлю 3–5 вариантов сегодня.</p>
              <div className={s.modalFields}>
                <input
                  id="lp-modal-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Имя"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  className={`${s.modalInput} ${error === "name" ? s.modalInputError : ""}`}
                />
                <input
                  id="lp-modal-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => {
                    setPhone(fmtPhone(e.target.value));
                    setError(null);
                  }}
                  className={`${s.modalInput} ${error === "phone" ? s.modalInputError : ""}`}
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
              {error ? (
                <div className={s.modalError}>
                  {error === "name"
                    ? "Как к вам обращаться?"
                    : error === "phone"
                      ? "Введите номер полностью — 10 цифр после +7"
                      : error === "consent"
                        ? CONSENT_ERROR
                        : serverError}
                </div>
              ) : null}
              <button type="button" className={s.modalSubmit} onClick={submit} disabled={sending}>
                {sending ? "Отправляю…" : "Получить подборку"}
              </button>
              <label className={s.modalAgree}>
                <input type="checkbox" checked={agree} onChange={(e) => {
                    setAgree(e.target.checked);
                    if (error === "consent") setError(null);
                  }} className={s.srOnly} />
                <span className={`${s.checkBox} ${agree ? s.checkBoxOn : ""} ${s.checkBoxLight}`} aria-hidden="true">
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  Согласен на обработку персональных данных и с{" "}
                  <Link href="/privacy" target="_blank" className={s.modalPolicy}>
                    политикой конфиденциальности
                  </Link>
                </span>
              </label>
            </>
          ) : (
            <div className={s.thanks}>
              <div className={s.thanksIcon}>
                <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden="true">
                  <path d="M2 11l8 8L26 3" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className={s.thanksTitle}>Готовлю подборку</h3>
              <p className={s.thanksText}>{thanksLine(messenger)}</p>
              <div className={s.thanksBonus}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={s.thanksBonusIcon}>
                  <rect x="4" y="3" width="16" height="18" rx="3" stroke="#4f46e5" strokeWidth="1.6" />
                  <path d="M8 9l1.5 1.5L12 8M8 15l1.5 1.5L12 14M14.5 9.5H17M14.5 15.5H17" stroke="#4f46e5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className={s.thanksBonusTag}>Пока ждёте</div>
                  <div className={s.thanksBonusTitle}>Чек-лист «Как проверить застройщика за 10 минут»</div>
                </div>
              </div>
              <TrackedLink href={TELEGRAM_URL} kind="tg" block="thanks" className={`${s.modalSubmit} ${s.modalLink}`}>
                Написать Яне сейчас
              </TrackedLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
