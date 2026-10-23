"use client";

import { useState } from "react";
import { TELEGRAM_URL } from "@/lib/site";
import { TrackedLink } from "../tracked-link";
import { RequestForm } from "./request-form";
import s from "../lp.module.css";

export function PodboryModal({
  step,
  note,
  hiddenNote,
  onClose,
}: {
  step: "form" | "thanks";
  note: string;
  hiddenNote: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(step);

  return (
    <div
      className={s.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={s.modalPanel} role="dialog" aria-modal="true" aria-label="Заявка">
        <div className={s.modalBody}>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {current === "form" ? (
            <>
              <div className={s.modalEyebrow}>Заявка</div>
              <h3 className={s.modalTitle}>Подберём квартиру под ваш бюджет</h3>
              <p className={s.modalLead}>Наш менеджер свяжется с вами в течение рабочего дня.</p>
              <RequestForm tone="light" place="modal" initialNote={note} hiddenNote={hiddenNote} onSent={() => setCurrent("thanks")} />
            </>
          ) : (
            <Thanks />
          )}
        </div>
      </div>
    </div>
  );
}

export function Thanks() {
  return (
    <div className={s.thanks}>
      <div className={s.thanksIcon}>
        <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden="true">
          <path d="M2 11l8 8L26 3" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className={s.thanksTitle}>Заявка принята</h3>
      <p className={s.thanksText}>Наш менеджер свяжется с вами в течение рабочего дня.</p>
      <TrackedLink href={TELEGRAM_URL} kind="tg" block="thanks" className={`${s.modalSubmit} ${s.modalLink}`}>
        Написать Яне сейчас
      </TrackedLink>
    </div>
  );
}
