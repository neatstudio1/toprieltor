import { ViewingCtaButton } from "@/components/lead-modal/viewing-cta-button";
import styles from "./project-sticky-bar.module.css";

export function ProjectStickyBar({ priceText }: { priceText: string }) {
  return (
    <div className={styles.bar}>
      <div>
        <div className={styles.priceLabel}>Цена от</div>
        <div className={styles.priceValue}>{priceText}</div>
      </div>
      <ViewingCtaButton label="Записаться" className={`tpl-btn-prim ${styles.cta}`} />
    </div>
  );
}
