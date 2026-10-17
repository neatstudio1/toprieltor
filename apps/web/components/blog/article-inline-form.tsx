"use client";

import { LeadForm } from "@/components/lead-modal/lead-modal";
import { YanaAvatar } from "./yana-avatar";
import styles from "./article-lead-block.module.css";

/** Форма заявки прямо в тексте статьи — там, где автор поставил метку [[форма]]. */
export function ArticleInlineForm({ photo }: { photo?: string }) {
  return (
    <aside className={styles.inlineForm} data-lead-block="inline-form">
      {photo ? (
        <div className={styles.inlineFormHead}>
          <YanaAvatar photo={photo} />
          <div>
            <strong>Яна Чекулова</strong>
            риелтор · ответит на вашу заявку
          </div>
        </div>
      ) : null}
      <LeadForm variant="podbor" autoFocus={false} />
    </aside>
  );
}
