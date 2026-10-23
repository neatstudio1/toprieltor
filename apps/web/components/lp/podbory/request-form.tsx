"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtPhone, phoneComplete } from "../phone";
import { CONSENT_ERROR } from "../thanks";
import { useLeadSubmit } from "../use-lead-submit";
import s from "../lp.module.css";
import p from "./podbory.module.css";

type FieldError = "name" | "phone" | "consent" | "server" | null;

/**
 * Единая форма заявки /lp/podbory: имя, телефон, примечание, согласие.
 * Одна и та же в окне и в финальном блоке, отличаются только цвета.
 */
export function RequestForm({
  tone,
  place,
  initialNote = "",
  hiddenNote = "",
  onSent,
}: {
  tone: "light" | "dark";
  place: "modal" | "final";
  initialNote?: string;
  /** Строка для менеджера: уходит в заявку, но в форме не видна (например, ЖК из карточки). */
  hiddenNote?: string;
  onSent: () => void;
}) {
  const submitLead = useLeadSubmit();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState(initialNote);
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<FieldError>(null);
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);

  const light = tone === "light";
  const input = light ? s.modalInput : s.finalInput;
  const inputError = light ? s.modalInputError : s.finalInputError;
  const errorClass = light ? s.modalError : s.finalError;
  const submitClass = light ? s.modalSubmit : s.finalSubmit;
  const agreeClass = light ? s.modalAgree : s.finalAgree;
  const policyClass = light ? s.modalPolicy : s.finalPolicy;
  const id = `podbory-${place}`;

  async function submit() {
    if (sending) return;
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 60) return setError("name");
    if (!phoneComplete(phone)) return setError("phone");
    if (!agree) return setError("consent");
    setSending(true);
    const result = await submitLead({ name: cleanName, phone, comment: [note.trim(), hiddenNote].filter(Boolean).join("\n"), website, place });
    setSending(false);
    if (result.ok) {
      onSent();
    } else {
      setServerError(result.message);
      setError("server");
    }
  }

  return (
    <>
      <div className={p.fields}>
        <input
          id={`${id}-name`}
          type="text"
          autoComplete="name"
          maxLength={60}
          placeholder="Имя"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          className={`${input} ${error === "name" ? inputError : ""}`}
        />
        <input
          id={`${id}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          value={phone}
          onChange={(e) => {
            setPhone(fmtPhone(e.target.value));
            setError(null);
          }}
          className={`${input} ${error === "phone" ? inputError : ""}`}
        />
        <textarea
          id={`${id}-note`}
          maxLength={500}
          placeholder="Например: бюджет, район, сколько комнат"
          aria-label="Примечание (необязательно)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={light ? p.noteLight : p.noteDark}
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
        <div className={errorClass}>
          {error === "name"
            ? "Как к вам обращаться? Имя от 2 знаков"
            : error === "phone"
              ? "Введите номер полностью — 10 цифр после +7"
              : error === "consent"
                ? CONSENT_ERROR
                : serverError}
        </div>
      ) : null}
      <button type="button" className={submitClass} onClick={submit} disabled={sending}>
        {sending ? "Отправляю…" : "Оставить заявку"}
      </button>
      <label className={agreeClass}>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => {
            setAgree(e.target.checked);
            if (error === "consent") setError(null);
          }}
          className={s.srOnly}
        />
        <span className={`${s.checkBox} ${agree ? s.checkBoxOn : ""} ${light ? s.checkBoxLight : ""}`} aria-hidden="true">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>
          Согласен на обработку персональных данных и с{" "}
          <Link href="/privacy" target="_blank" className={policyClass}>
            политикой конфиденциальности
          </Link>
        </span>
      </label>
    </>
  );
}
