import Image from "next/image";
import Link from "next/link";
import styles from "./popular-zhk-section.module.css";

export interface PopularZhkCard {
  slug: string;
  name: string;
  developerName: string;
  district: string | null;
  termYear: number | null;
  priceText: string;
  areaText: string;
  rateText: string;
  photo: string | null;
}

export function PopularZhkSection({
  title,
  cards,
}: {
  title: string;
  cards: PopularZhkCard[];
}) {
  if (!cards.length) return null;

  return (
    <section id="catalog" className={styles.section}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Каталог</div>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <Link href="/catalog" className={styles.allLink}>
          Все ЖК →
        </Link>
      </div>
      <div className={styles.grid}>
        {cards.map((c) => (
          <Link key={`/zhk/${c.slug}`} data-jk="" href={`/zhk/${c.slug}`} className={styles.card}>
            <div className={styles.photo}>
              {c.photo ? (
                <Image
                  data-jkimg=""
                  src={c.photo}
                  alt={c.name}
                  fill
                  sizes="(min-width: 1280px) 610px, 90vw"
                  style={{ objectFit: "cover" }}
                />
              ) : null}
              {c.termYear ? <div className={styles.badge}>Сдача {c.termYear}</div> : null}
            </div>
            <div className={styles.body}>
              <div className={styles.head2}>
                <div className={styles.name}>{c.name}</div>
                <div className={styles.dev}>{c.developerName}</div>
              </div>
              <div className={styles.meta}>
                {c.district ?? "Екатеринбург"}
                {c.termYear ? ` · сдача ${c.termYear}` : ""}
              </div>
              <div className={styles.factsRow}>
                <div className={styles.fact}>
                  <div className={styles.factLabel}>Цена от</div>
                  <div className={styles.factValue}>{c.priceText}</div>
                </div>
                <div className={styles.factBordered}>
                  <div className={styles.factLabel}>Площадь от</div>
                  <div className={styles.factValue}>{c.areaText}</div>
                </div>
                <div className={styles.factBordered}>
                  <div className={styles.factLabel}>Ставка от</div>
                  <div className={styles.factValueAccent}>{c.rateText}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
