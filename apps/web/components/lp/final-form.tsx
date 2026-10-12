"use client";

import { useState } from "react";
import Link from "next/link";
import { CHANNELS, type ChannelId } from "@/lib/landings";
import { fmtPhone, phoneComplete } from "./phone";
import { useLp } from "./lp-shell";
import { CONSENT_ERROR } from "./thanks";
import { useLeadSubmit, type LpMessenger } from "./use-lead-submit";
import s from "./lp.module.css";

export function FinalForm() {
  const { showThanks } = useLp();
  const [channel, setChannel] = useState<ChannelId>("tg");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<"phone" | "consent" | "server" | null>(null);
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const submitLead = useLeadSubmit();

  async function submit() {
    if (sending) return;
    if (!phoneComplete(phone)) return setError("phone");
    if (!agree) return setError("consent");
    const messenger: LpMessenger = channel === "tg" ? "telegram" : channel;
    setSending(true);
    const result = await submitLead({ phone, messenger, website, place: "final" });
    setSending(false);
    if (result.ok) {
      showThanks(messenger);
    } else {
      setServerError(result.message);
      setError("server");
    }
  }

  return (
    <div className={s.finalCard}>
      <div className={s.channels} role="group" aria-label="Где удобнее переписываться">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${s.channel} ${channel === c.id ? s.channelOn : ""}`}
            aria-pressed={channel === c.id}
            onClick={() => setChannel(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <input
        id="lp-final-phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+7 (___) ___-__-__"
        value={phone}
        onChange={(e) => {
          setPhone(fmtPhone(e.target.value));
          setError(null);
        }}
        className={`${s.finalInput} ${error === "phone" ? s.finalInputError : ""}`}
      />
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
        <div className={s.finalError}>
          {error === "phone" ? "Введите номер полностью — 10 цифр после +7" : error === "consent" ? CONSENT_ERROR : serverError}
        </div>
      ) : null}
      <button type="button" className={s.finalSubmit} onClick={submit} disabled={sending}>
        {sending ? "Отправляю…" : "Получить подборку"}
      </button>
      <label className={s.finalAgree}>
        <input type="checkbox" checked={agree} onChange={(e) => {
            setAgree(e.target.checked);
            if (error === "consent") setError(null);
          }} className={s.srOnly} />
        <span className={`${s.checkBox} ${agree ? s.checkBoxOn : ""}`} aria-hidden="true">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>
          Согласен на обработку персональных данных и с{" "}
          <Link href="/privacy" target="_blank" className={s.finalPolicy}>
            политикой конфиденциальности
          </Link>
        </span>
      </label>
    </div>
  );
}
