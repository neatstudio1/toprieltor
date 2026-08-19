import type { EcosystemStage } from "@/lib/cms/client";
import { Reveal } from "@/components/reveal";
import styles from "./ecosystem-section.module.css";

export function EcosystemSection({
  eyebrow,
  title,
  lead,
  stages,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  stages: EcosystemStage[];
}) {
  return (
    <section id="how" className={styles.section}>
      <div className={styles.layout}>
        <div className={styles.sticky}>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.lead}>{lead}</p>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Юридическая поддержка на всех этапах
          </div>
        </div>
        <div className={styles.list}>
          {stages.map((s, i) => (
            <Reveal key={s.n} delayMs={i * 70} data-stage="" className={styles.row}>
              <div className={styles.rowNum}>{s.n}</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>{s.title}</div>
                <div className={styles.rowDesc}>{s.desc}</div>
              </div>
              <div className={styles.rowFact}>{s.fact}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
