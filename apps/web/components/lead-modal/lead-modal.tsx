"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { submitLead } from "@/lib/cms/leads";
import { GOALS, reachGoal, trafficSource } from "@/lib/analytics";
import styles from "./lead-modal.module.css";

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

export function LeadModal({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const mountedAtRef = useRef(Date.now());
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    nameRef.current?.focus();
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
      sourcePath: pathname,
      sourceTitle: document.title,
      elapsedMs: Date.now() - mountedAtRef.current,
    });

    if (result.ok) {
      setStatus("success");
      const src = trafficSource();
      reachGoal(GOALS.leadSubmit, { campaign: src.campaign ?? "none", medium: src.medium ?? "none" });
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  }

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

        {status === "success" ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.title} id="lead-modal-title">
              Заявка отправлена
            </h2>
            <p className={styles.lead}>Свяжемся с вами в ближайшее время, чтобы договориться о просмотре.</p>
            <button type="button" className={`tpl-btn-prim ${styles.submitButton}`} onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className={styles.title} id="lead-modal-title">
              Записаться на просмотр
            </h2>
            <p className={styles.lead}>Оставьте контакты — подберём удобное время и покажем квартиру.</p>

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
                placeholder="Удобное время, вопросы по объекту — необязательно"
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
        )}
      </div>
    </div>
  );
}
