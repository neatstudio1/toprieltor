"use client";

import { useSyncExternalStore } from "react";
import { LeadForm } from "@/components/lead-modal/lead-modal";
import { campaignCopy } from "@/lib/campaigns";
import { trafficSource } from "@/lib/analytics";
import styles from "./page.module.css";

const noop = () => () => {};

/**
 * Страница заявки по ссылкам из роликов (/quiz?utm_campaign=…).
 *
 * Раньше здесь был квиз из 7 шагов; теперь сразу форма. Адрес оставлен,
 * потому что он стоит в описаниях опубликованных роликов, а заголовок
 * по-прежнему договаривает обещание конкретного ролика (lib/campaigns.ts).
 */
export function QuizLeadPage() {
  // Метка ролика есть только в браузере: на сервере — общий текст, после гидрации — текст ролика.
  const campaign = useSyncExternalStore(noop, () => trafficSource().campaign, () => null);
  const copy = campaignCopy(campaign);

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div className={styles.eyebrow}>{copy.eyebrow}</div>
        <h1 className={styles.title}>{copy.title}</h1>
        <ul className={styles.points}>
          <li>3–5 вариантов под ваш бюджет с расчётом платежа</li>
          <li>Цена как у застройщика — подбор и сделка для вас бесплатно</li>
          <li>Ипотека, юридическая проверка и приёмка — тоже на нас</li>
        </ul>
      </section>
      <section className={styles.card}>
        <LeadForm
          variant="podbor"
          autoFocus={false}
          sourcePath={campaign ? `/quiz?utm_campaign=${campaign}` : "/quiz"}
          sourceTitle={copy.label ? `Заявка на подбор · ролик «${copy.label}»` : "Заявка на подбор"}
        />
      </section>
    </main>
  );
}
