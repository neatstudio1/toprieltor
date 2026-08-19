import Link from "next/link";
import styles from "./final-cta-section.module.css";

const TELEGRAM_URL = "https://t.me/Yana_Chekulova";

export function FinalCtaSection() {
  return (
    <section id="quiz" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Первый шаг</div>
        <h2 className={styles.title}>Не знаете, с чего начать?</h2>
        <div className={styles.stack}>
          <div className={styles.beamWrap}>
            <span className={`beam-ring ${styles.beamRing}`} />
            <Link href="/quiz" className={`tpl-btn-prim ${styles.cta}`}>
              Пройдите квиз за 2 минуты
            </Link>
          </div>
          <a href={TELEGRAM_URL} className={styles.telegram}>
            или напишите в Telegram @Yana_Chekulova
          </a>
        </div>
      </div>
    </section>
  );
}
