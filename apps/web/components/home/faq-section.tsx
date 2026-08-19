import type { FaqItem } from "@/lib/cms/client";
import styles from "./faq-section.module.css";

export function FaqSection({ title, faq }: { title: string; faq: FaqItem[] }) {
  return (
    <section id="blog" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Частые вопросы</div>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.list}>
          {faq.map((f) => (
            <details data-faq="" key={f.q}>
              <summary className={styles.summary}>
                {f.q}
                <span className={`tpl-plus ${styles.plus}`}>
                  <span className={styles.plusH} />
                  <span className={styles.plusV} />
                </span>
              </summary>
              <div className={styles.answer}>{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
