import type { HomeCase } from "@/lib/cms/client";
import { Reveal } from "@/components/reveal";
import styles from "./cases-section.module.css";

export function CasesSection({ title, cases }: { title: string; cases: HomeCase[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>Кейсы</div>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {cases.map((k, i) => (
          <Reveal key={k.tag} delayMs={i * 60} data-case="" className={styles.card}>
            <div className={styles.tag}>{k.tag}</div>
            <div className={styles.situation}>{k.situation}</div>
            <div className={styles.results}>
              <div>
                <div className={styles.resultLabel}>{k.r1label}</div>
                <div className={styles.resultValue}>{k.r1}</div>
              </div>
              <div className={styles.resultBordered}>
                <div className={styles.resultLabel}>{k.r2label}</div>
                <div className={styles.resultValuePlain}>{k.r2}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
