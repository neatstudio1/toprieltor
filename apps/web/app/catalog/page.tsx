import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogCards, getMortgageConfig } from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, catalogItemListSchema } from "@/lib/json-ld";
import styles from "./page.module.css";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Каталог новостроек Екатеринбурга",
  description:
    "Новостройки Екатеринбурга под ваш бюджет и капитал. Подбор и покупка через нашу команду — бесплатно, цена та же, что у застройщика.",
  path: "/catalog",
});

export default async function CatalogPage() {
  const [cards, mortgageConfig] = await Promise.all([getCatalogCards(), getMortgageConfig()]);

  const districts = Array.from(new Set(cards.map((c) => c.district).filter((d): d is string => Boolean(d)))).sort(
    (a, b) => a.localeCompare(b, "ru"),
  );
  const developers = Array.from(new Set(cards.map((c) => c.developerName).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  const terms = Array.from(new Set(cards.map((c) => c.termYear).filter((y): y is number => y !== null))).sort(
    (a, b) => a - b,
  );
  const minRate = mortgageConfig.rates.reduce(
    (min, r) => (r.rate < min ? r.rate : min),
    mortgageConfig.rates[0]?.rate ?? 0,
  );
  const rateText = `${(minRate * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={breadcrumbListSchema([{ name: "Главная", path: "/" }, { name: "Каталог ЖК", path: "/catalog" }])} />
      <JsonLd data={catalogItemListSchema(cards)} />
      <SiteHeader active="catalog" />

      <div className={styles.head}>
        <div className={styles.eyebrow}>Каталог новостроек · Екатеринбург</div>
        <h1 className={styles.title}>Новостройки под ваш бюджет и капитал</h1>
        <p className={styles.lead}>
          Подбор и покупка через нашу команду — бесплатно. Цена та же, что в отделе продаж застройщика.
        </p>
      </div>

      <CatalogFilters cards={cards} districts={districts} developers={developers} terms={terms} rateText={rateText} />

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div>
            <h2 className={styles.ctaTitle}>Не нашли подходящий вариант?</h2>
            <p className={styles.ctaLead}>
              Пройдите квиз за 2 минуты — подберём новостройку под цель, бюджет и маткапитал, в том числе вне
              каталога.
            </p>
          </div>
          <Link href="/quiz" className={`tpl-btn-prim ${styles.ctaBtn}`}>
            Пройти квиз
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
