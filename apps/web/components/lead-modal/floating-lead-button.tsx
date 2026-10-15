"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLeadModal } from "./lead-modal-provider";
import styles from "./floating-lead-button.module.css";

const SHOW_DELAY_MS = 1200;

/**
 * Плавающая кнопка заявки вместо прежнего мини-квиза (2026-10-15).
 *
 * Квиз сам раскрывался через 7 секунд и на телефоне закрывал больше половины
 * экрана — это было и раздражающе, и давало сдвиг вёрстки 0,26 в Lighthouse.
 * Кнопка ничего не открывает сама: только по нажатию, обычной формой заявки.
 */
export function FloatingLeadButton() {
  const pathname = usePathname();
  const { open } = useLeadModal();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // На лендингах своя форма и нижняя панель, /quiz — сама страница заявки.
  if (!visible || !pathname || pathname.startsWith("/lp/") || pathname.startsWith("/quiz")) return null;

  const raised = pathname.startsWith("/zhk/");

  return (
    <div className={`${styles.wrap} ${raised ? styles.raised : ""}`}>
      <button type="button" className={styles.bubble} onClick={() => open("podbor")}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l2.4 5.6L20 9l-4 4 1 6-5-2.8L7 19l1-6-4-4 5.6-.4L12 3z" />
          </svg>
        </span>
        Подобрать квартиру
      </button>
    </div>
  );
}
