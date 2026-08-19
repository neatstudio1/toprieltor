import type { MortgageScenario } from "@/lib/cms/client";
import { MortgageWidget } from "./mortgage-widget";
import styles from "./mortgage-section.module.css";

const PERKS = [
  "Маткапитал — как первоначальный взнос",
  "Семейная, военная и IT — от 5,75%",
  "Одобрение без потери кредитной истории",
];

export function MortgageSection({
  title,
  scenarios,
}: {
  title: string;
  scenarios: MortgageScenario[];
}) {
  return (
    <section id="calc" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.layout}>
          <div className={styles.left}>
            <div className={styles.eyebrow}>Ипотека</div>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.perks}>
              {PERKS.map((perk, i) => (
                <div className={styles.perkRow} key={perk}>
                  <span className={styles.perkNum}>{String(i + 1).padStart(2, "0")}</span>
                  <div className={styles.perkText}>{perk}</div>
                </div>
              ))}
            </div>
            <a href="https://t.me/Yana_Chekulova" className={`tpl-btn-prim ${styles.cta}`}>
              Получить консультацию
            </a>
          </div>
          <div className={styles.right}>
            <MortgageWidget scenarios={scenarios} />
            <p className={styles.disclaimer}>Расчёт предварительный. Точные условия подтверждает банк.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
