import Image from "next/image";
import type { HowItWorksStep } from "@/lib/cms/client";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import styles from "./how-it-works-section.module.css";

const STEP_PHOTOS: Record<string, string> = {
  "1": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
  "2": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  "3": "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
  "4": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  "5": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
};

export function HowItWorksSection({ title, steps }: { title: string; steps: HowItWorksStep[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>Путь клиента</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.scroller} data-hscroll="">
        {steps.map((st) => {
          const photo = STEP_PHOTOS[st.n];
          return (
            <div className={styles.card} key={st.n}>
              <div className={styles.photo}>
                {photo ? (
                  <Image src={photo} alt={st.title} fill sizes="380px" style={{ objectFit: "cover" }} />
                ) : (
                  <PhotoPlaceholder label={`Фото: ${st.tag}`} />
                )}
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
          );
        })}
      </div>
    </section>
  );
}
