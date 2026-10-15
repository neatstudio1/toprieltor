import styles from "./final-cta-section.module.css";
import { TELEGRAM_URL, TELEGRAM_HANDLE } from "@/lib/site";
import { LeadCtaButton } from "@/components/lead-modal/lead-cta-button";


export function FinalCtaSection() {
  return (
    <section id="quiz" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Первый шаг</div>
        <h2 className={styles.title}>Не знаете, с чего начать?</h2>
        <div className={styles.stack}>
          <div className={styles.beamWrap}>
            <span className={`beam-ring ${styles.beamRing}`} />
            <LeadCtaButton className={`tpl-btn-prim ${styles.cta}`}>
              Оставить заявку на подбор
            </LeadCtaButton>
          </div>
          <a href={TELEGRAM_URL} className={styles.telegram}>
            или напишите в Telegram {TELEGRAM_HANDLE}
          </a>
        </div>
      </div>
    </section>
  );
}
