import Link from "next/link";
import type { Project } from "@/lib/cms/client";
import { categorizeInfrastructure } from "@/lib/infra-categorize";
import styles from "./project-infra-section.module.css";

const VISIBLE_ITEMS = 4;

export function ProjectInfraSection({ project }: { project: Project }) {
  const groups = categorizeInfrastructure(project.infrastructure);

  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>О проекте · ЖК «{project.name}»</div>
      <div className={styles.top}>
        <p className={styles.concept}>{project.concept}</p>
        <Link href={`/zhk/${project.slug}`} className={styles.projectLink}>
          <div>
            <div className={styles.projectLinkTitle}>
              Все квартиры и очереди проекта
            </div>
            <div className={styles.projectLinkSubtitle}>
              планировки, сроки, инфраструктура
            </div>
          </div>
          <span className={styles.projectLinkArrow}>→</span>
        </Link>
      </div>
      {groups.length > 0 ? (
        <>
          <div className={styles.infraEyebrow}>Инфраструктура рядом</div>
          <div className={styles.infraGrid}>
            {groups.map((g) => (
              <div key={g.title} className={styles.infraCard}>
                <div className={styles.infraCardHead}>
                  <div className={styles.infraCardTitle}>{g.title}</div>
                  <div className={styles.infraCardCount}>{g.count}</div>
                </div>
                <div className={styles.infraItems}>
                  {g.items.slice(0, VISIBLE_ITEMS).map((item) => (
                    <div key={item} className={styles.infraItem}>
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
                          <div key={item} className={styles.infraItem}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
