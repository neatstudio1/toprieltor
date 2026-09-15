import Link from "next/link";
import styles from "./entity-hub.module.css";

export interface HubItem {
  slug: string;
  href: string;
  title: string;
  lead?: string | null;
  meta?: string | null;
}

export function EntityHub({
  eyebrow,
  title,
  lead,
  items,
  ctaTitle,
  ctaLead,
  ctaHref = "/quiz",
  ctaText = "Пройти квиз",
}: {
  eyebrow: string;
  title: string;
  lead: string;
  items: HubItem[];
  ctaTitle: string;
  ctaLead: string;
  ctaHref?: string;
  ctaText?: string;
}) {
  return (
    <>
      <div className={styles.head}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
      </div>

      <div className={styles.gridWrap}>
        <div className={styles.grid}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={styles.card}>
              {item.meta ? <div className={styles.cardMeta}>{item.meta}</div> : null}
              <h2 className={styles.cardTitle}>{item.title}</h2>
              {item.lead ? <p className={styles.cardLead}>{item.lead}</p> : null}
              <div className={styles.cardArrow}>Подробнее →</div>
            </Link>
          ))}
        </div>
      </div>

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div>
            <h2 className={styles.ctaTitle}>{ctaTitle}</h2>
            <p className={styles.ctaLead}>{ctaLead}</p>
          </div>
          <Link href={ctaHref} className={`tpl-btn-prim ${styles.ctaBtn}`}>
            {ctaText}
          </Link>
        </div>
      </section>
    </>
  );
}
