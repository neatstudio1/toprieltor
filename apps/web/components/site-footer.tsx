import Link from "next/link";
import styles from "./site-footer.module.css";

const TELEGRAM_URL = "https://t.me/Yana_Chekulova";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.brandRow}>
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="3" y="22" width="8" height="15" rx="3" fill="#C4C7F7" />
              <rect x="15" y="9" width="8" height="28" rx="3" fill="var(--accent)" />
              <rect x="27" y="16" width="8" height="21" rx="3" fill="#C4C7F7" />
            </svg>
            <span className={styles.brandName}>TOPиелтор</span>
          </div>
          <div className={styles.tagline}>На вершине рынка</div>
          <p className={styles.disclaimer}>
            Расчёты предварительные, точные условия подтверждает банк. Екатеринбург, 2026.
          </p>
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <div className={styles.columnLabel}>Сервис</div>
            <Link href="/catalog" className={styles.columnLink}>
              Каталог ЖК
            </Link>
            <Link href="/#calc" className={styles.columnLink}>
              Калькулятор
            </Link>
            <Link href="/blog" className={styles.columnLink}>
              Блог
            </Link>
          </div>
          <div className={styles.column}>
            <div className={styles.columnLabel}>Контакты</div>
            <a href={TELEGRAM_URL} className={styles.columnLink}>
              Telegram @Yana_Chekulova
            </a>
            <Link href="/quiz" className={styles.columnLink}>
              Пройти квиз
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <span>© TOPиелтор 2026</span>
          <Link href="/privacy" className={styles.columnLink}>
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  );
}
