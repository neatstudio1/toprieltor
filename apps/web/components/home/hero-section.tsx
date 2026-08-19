import Link from "next/link";
import type { HeroStat } from "@/lib/cms/client";
import { CountUp } from "@/components/count-up";
import { HeroVideo } from "./hero-video";
import styles from "./hero-section.module.css";

export function HeroSection({
  eyebrow,
  title,
  subtitle,
  stats,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: HeroStat[];
}) {
  const highlightIdx = title.indexOf("бюджет");
  const titleBefore = highlightIdx >= 0 ? title.slice(0, highlightIdx) : title;
  const titleHighlight = highlightIdx >= 0 ? title.slice(highlightIdx) : "";

  return (
    <section id="top" className={styles.hero}>
      <HeroVideo className={styles.bgImage} />
      <div className={styles.overlayDim} />
      <div className={styles.overlaySide} />
      <div className={styles.overlayBottom} />
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <h1 className={styles.title}>
            {titleBefore}
            <span className={styles.titleHighlight}>{titleHighlight}</span>
          </h1>
          <p className={styles.subtitle}>{subtitle}</p>
          <div className={styles.ctaRow}>
            <Link href="/quiz" className={`tpl-btn-prim ${styles.ctaPrimary}`}>
              Начать подбор за 2 минуты
            </Link>
            <a href="#how" className={styles.ctaSecondary}>
              Как это работает
            </a>
          </div>
          <div className={styles.stats}>
            {stats.map((s, i) => (
              <div className={styles.stat} key={i}>
                <div className={styles.statValue}>
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
