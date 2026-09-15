import Link from "next/link";
import styles from "./entity-tabs.module.css";

export interface EntityTab {
  key: string;
  label: string;
  href: string;
}

export function EntityTabs({
  label,
  tabs,
  active,
}: {
  label: string;
  tabs: EntityTab[];
  active: string;
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.label}>{label}</span>
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`${styles.tab} ${t.key === active ? styles.tabOn : ""}`}
            aria-current={t.key === active ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
