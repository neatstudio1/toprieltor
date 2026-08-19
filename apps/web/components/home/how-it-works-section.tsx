import type { HowItWorksStep } from "@/lib/cms/client";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import styles from "./how-it-works-section.module.css";

export function HowItWorksSection({ title, steps }: { title: string; steps: HowItWorksStep[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>Путь клиента</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.scroller} data-hscroll="">
        {steps.map((st) => (
          <div className={styles.card} key={st.n}>
            <div className={styles.photo}>
              <PhotoPlaceholder label={`Фото: ${st.tag}`} />
            </div>
            <div className={styles.body}>
              <div className={styles.meta}>
                <span className={styles.badge}>{st.n}</span>
                <span className={styles.tag}>{st.tag}</span>
              </div>
              <div className={styles.cardTitle}>{st.title}</div>
              <div className={styles.cardDesc}>{st.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
