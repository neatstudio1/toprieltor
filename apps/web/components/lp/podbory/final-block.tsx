"use client";

import { useLp } from "../lp-shell";
import { RequestForm } from "./request-form";
import s from "../lp.module.css";

/** Форма финального блока: после отправки открывает то же окно «Заявка принята». */
export function FinalRequest() {
  const { showThanks } = useLp();
  return (
    <div className={s.finalCard}>
      <RequestForm tone="dark" place="final" onSent={showThanks} />
    </div>
  );
}
