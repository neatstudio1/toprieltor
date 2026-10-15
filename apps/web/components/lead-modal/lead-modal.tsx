"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { submitLead } from "@/lib/cms/leads";
import { GOALS, reachGoal, trafficSource } from "@/lib/analytics";
import styles from "./lead-modal.module.css";

/**
 * Одна форма заявки на весь сайт (2026-10-15). Квиз убран: по метрике люди
 * отваливались на третьем шаге из семи, а заявка в одно действие — то, что
 * советовали и директолог, и SEO-специалист. Вариант задаёт только тексты:
 * «подбор» — общий призыв, «просмотр» — кнопки на страницах ЖК и квартир.
 */
export type LeadVariant = "podbor" | "viewing";

const COPY: Record<LeadVariant, { title: string; lead: string; comment: string; success: string }> = {
  podbor: {
    title: "Подберём квартиру под ваш бюджет",
    lead: "Оставьте контакты — пришлём 3–5 вариантов с расчётом платежа. Бесплатно: платит застройщик.",
    comment: "Бюджет, район, комнатность — необязательно",
    success: "Свяжемся с вами в ближайшее время и пришлём подходящие варианты.",
  },
  viewing: {
    title: "Записаться на просмотр",
    lead: "Оставьте контакты — подберём удобное время и покажем квартиру.",
    comment: "Удобное время, вопросы по объекту — необязательно",
    success: "Свяжемся с вами в ближайшее время, чтобы договориться о просмотре.",
  },
};

function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^8/, "7").slice(0, 11);
  if (!digits) return "";
  const rest = digits.startsWith("7") ? digits.slice(1) : digits;
  let out = "+7";
  if (rest.length > 0) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += ")";
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

/** Сама форма — и в модальном окне, и встроенной в страницу (/quiz). */
export function LeadForm({
  variant = "podbor",
  onClose,
  autoFocus = true,
  sourcePath,
  sourceTitle,
}: {
  variant?: LeadVariant;
  onClose?: () => void;
  autoFocus?: boolean;
  /** По умолчанию — адрес и заголовок текущей страницы. */
  sourcePath?: string;
  sourceTitle?: string;
}) {
  const pathname = usePathname();
  // Время показа формы — для антиспама (Strapi отбрасывает отправку быстрее 1,2 с).
  const mountedAtRef = useRef(0);
  const nameRef = useRef<HTMLInputElement>(null);
  const copy = COPY[variant];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting" || !consent) return;
    setStatus("submitting");
    setErrorMessage("");

    const result = await submitLead({
      name,
      phone,
      comment,
      website,
      sourcePath: sourcePath ?? pathname,
      sourceTitle: sourceTitle ?? document.title,
      elapsedMs: Date.now() - mountedAtRef.current,
    });

    if (result.ok) {
      setStatus("success");
      const src = trafficSource();
      reachGoal(GOALS.leadSubmit, { campaign: src.campaign ?? "none", medium: src.medium ?? "none", variant });
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  }

  if (status === "success") {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.title} id="lead-modal-title">
          Заявка отправлена
        </h2>
        <p className={styles.lead}>{copy.success}</p>
        {onClose ? (
          <button type="button" className={`tpl-btn-prim ${styles.submitButton}`} onClick={onClose}>
            Закрыть
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className={styles.title} id="lead-modal-title">
        {copy.title}
      </h2>
      <p className={styles.lead}>{copy.lead}</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="lead-name">
          Имя
        </label>
        <input
          ref={nameRef}
          id="lead-name"
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="lead-phone">
          Телефон
        </label>
        <input
          id="lead-phone"
          className={styles.input}
          type="tel"
          inputMode="tel"
          placeholder="+7 (___) ___-__-__"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          required
          autoComplete="tel"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="lead-comment">
          Комментарий
        </label>
        <textarea
          id="lead-comment"
          className={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={copy.comment}
        />
      </div>

      {/* Honeypot: hidden from real users via CSS, so only bots that autofill every field touch it. */}
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

      <label className={styles.consentRow}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className={styles.consentCheckbox}
        />
        <span>
          Согласен(на) с{" "}
          <Link href="/privacy" target="_blank" className={styles.consentLink}>
            политикой конфиденциальности и обработки персональных данных
          </Link>
        </span>
      </label>

      {status === "error" ? <div className={styles.errorText}>{errorMessage}</div> : null}

      <button
        type="submit"
        className={`tpl-btn-prim ${styles.submitButton}`}
        disabled={status === "submitting" || !consent}
      >
        {status === "submitting" ? "Отправляем…" : "Отправить заявку"}
      </button>
    </form>
  );
}

export function LeadModal({ onClose, variant = "viewing" }: { onClose: () => void; variant?: LeadVariant }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
        <LeadForm variant={variant} onClose={onClose} />
      </div>
    </div>
  );
}
