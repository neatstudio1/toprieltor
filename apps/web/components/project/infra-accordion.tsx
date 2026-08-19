import { categorizeInfrastructureDetailed } from "@/lib/infra-categorize";
import styles from "./infra-accordion.module.css";

const VISIBLE_ITEMS = 4;

export function InfraAccordion({ infrastructure }: { infrastructure: string[] }) {
  const groups = categorizeInfrastructureDetailed(infrastructure);
  if (!groups.length) return null;

  return (
    <div className={styles.wrap}>
      {groups.map((g, i) => (
        <details data-acc="" key={g.title} open={i === 0}>
          <summary className={styles.summary}>
            <span className={styles.summaryTitle}>{g.title}</span>
            <span className={styles.summaryRight}>
              <span className={styles.count}>{g.count}</span>
              <span className={`acc-plus ${styles.plus}`}>
                <span className={styles.plusH} />
                <span className={styles.plusV} />
              </span>
            </span>
          </summary>
          <div className={styles.items}>
            {g.items.slice(0, VISIBLE_ITEMS).map((item) => (
              <div className={styles.item} key={item}>
                {item}
              </div>
            ))}
            {g.items.length > VISIBLE_ITEMS ? (
              <details className={styles.showMore}>
                <summary className={styles.showMoreSummary}>
                  Показать ещё {g.items.length - VISIBLE_ITEMS}
                </summary>
                <div className={styles.showMoreItems}>
                  {g.items.slice(VISIBLE_ITEMS).map((item) => (
                    <div className={styles.item} key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
