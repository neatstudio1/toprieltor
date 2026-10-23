"use client";

import { TELEGRAM_URL } from "@/lib/site";
import { TrackedLink } from "./tracked-link";
import s from "./lp.module.css";

export function StickyBar({
  visible,
  onOpen,
  label = "Подобрать",
}: {
  visible: boolean;
  onOpen: () => void;
  label?: string;
}) {
  return (
    <div className={`${s.stickyBar} ${visible ? s.stickyBarOn : ""}`} aria-hidden={!visible}>
      <TrackedLink href={TELEGRAM_URL} kind="tg" block="sticky" className={s.stickyTg}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 4L3 11l6 2.5M21 4l-3 16-9-6.5M21 4L9 13.5V19l3-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
        Telegram
      </TrackedLink>
      <button type="button" className={s.stickyCta} onClick={onOpen} tabIndex={visible ? 0 : -1}>
        {label}
      </button>
    </div>
  );
}
