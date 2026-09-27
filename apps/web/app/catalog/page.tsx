import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogCards, getIndexableDistrictListings, getMortgageConfig } from "@/lib/cms/client";
import { DISTRICTS, ROOM_TYPES } from "@/lib/districts";
import { pluralizeRu } from "@/lib/format";
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
  const [cards, mortgageConfig, districtListings] = await Promise.all([
    getCatalogCards(),
    getMortgageConfig(),
    getIndexableDistrictListings(),
  ]);

  // Подборки по району и комнатности: отдельные адреса под запросы вида
  // «купить двухкомнатную в Ботаническом» — фильтры каталога живут в состоянии
  // компонента и своего URL не имеют, садиться таким запросам было некуда.
  const byDistrict = DISTRICTS.map((district) => ({
    district,
    items: districtListings
      .filter((l) => l.districtSlug === district.slug)
      .map((l) => ({ listing: l, type: ROOM_TYPES.find((t) => t.slug === l.roomTypeSlug)! }))
      .filter((x) => x.type)
      .sort((a, b) => ROOM_TYPES.indexOf(a.type) - ROOM_TYPES.indexOf(b.type)),
  })).filter((g) => g.items.length > 0);

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

      {byDistrict.length > 0 ? (
        <section className={styles.picksSection}>
          <h2 className={styles.picksTitle}>Подборки по районам</h2>
          <p className={styles.picksLead}>
            Готовые срезы каталога — только те, где действительно есть выбор.
          </p>
          <div className={styles.picksGrid}>
            {byDistrict.map(({ district, items }) => (
              <div key={district.slug} className={styles.picksGroup}>
                <div className={styles.picksDistrict}>{district.name}</div>
                <div className={styles.picksLinks}>
                  {items.map(({ listing, type }) => (
                    <Link
                      key={`${listing.districtSlug}/${listing.roomTypeSlug}`}
                      href={`/catalog/${listing.districtSlug}/${listing.roomTypeSlug}`}
                      className={styles.picksLink}
                    >
                      {type.plural.toLowerCase()}
                      <span className={styles.picksCount}>
                        {listing.count} {pluralizeRu(listing.count, "вариант", "варианта", "вариантов")}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
