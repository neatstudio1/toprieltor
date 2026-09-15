import Image from "next/image";
import Link from "next/link";
import type { CatalogCard } from "@/lib/cms/client";
import { formatRub, roomTypesText } from "@/lib/format";
import styles from "./jk-showcase-grid.module.css";

export function JkShowcaseGrid({ cards, rateText }: { cards: CatalogCard[]; rateText: string }) {
  if (!cards.length) {
    return <p className={styles.empty}>Пока нет подходящих ЖК в каталоге — загляните позже.</p>;
  }

  return (
    <div className={styles.grid}>
      {cards.map((c) => {
        const now = new Date();
        const isReady = c.termYear !== null && c.termYear <= now.getFullYear();
        const badge = isReady ? "Есть готовые" : c.termYear ? `Сдача ${c.termYear}` : "Уточняется";
        return (
          <Link key={`/zhk/${c.slug}`} data-jk="" href={`/zhk/${c.slug}`} className={styles.card}>
            <div className={styles.photo}>
              {c.photo ? (
                <div className={styles.photoImg}>
                  <Image src={c.photo} alt={c.name} fill sizes="(min-width: 1280px) 400px, 90vw" style={{ objectFit: "cover" }} />
                </div>
              ) : null}
              <div className={styles.badge}>{badge}</div>
            </div>
            <div className={styles.body}>
              <div className={styles.name}>{c.name}</div>
              <div className={styles.dev}>{c.developerName}</div>
              <div className={styles.meta}>
                {c.district ?? "Екатеринбург"} · {roomTypesText(c.roomTypes)}
                {c.termYear ? ` · сдача ${c.termYear}` : ""}
              </div>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Цена от</div>
                  <div className={styles.statValue}>{c.priceFrom ? `${formatRub(c.priceFrom)} ₽` : "—"}</div>
                </div>
                <div className={styles.statBordered}>
                  <div className={styles.statLabel}>Площадь</div>
                  <div className={styles.statValue}>{c.areaFromM2 ? `${c.areaFromM2.toFixed(1).replace(".", ",")} м²` : "—"}</div>
                </div>
                <div className={styles.statBordered}>
                  <div className={styles.statLabel}>Ставка от</div>
                  <div className={styles.statValueAccent}>{rateText}</div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
