"use client";

import { LeadForm } from "@/components/lead-modal/lead-modal";
import styles from "./article-lead-block.module.css";

/** Форма заявки прямо в тексте статьи — там, где автор поставил метку [[форма]]. */
export function ArticleInlineForm() {
  return (
    <aside className={styles.inlineForm} data-lead-block="inline-form">
      <LeadForm variant="podbor" autoFocus={false} />
    </aside>
  );
}
