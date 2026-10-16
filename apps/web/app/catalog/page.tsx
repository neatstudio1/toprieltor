import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogCards, getMortgageConfig } from "@/lib/cms/client";
import { getCatalogPicks } from "@/lib/catalog-picks";
import { millionsRub, pickLabel } from "@/lib/seo-templates";
import { PickLinks } from "@/components/catalog/pick-links";
import { DISTRICTS, ROOM_TYPES } from "@/lib/districts";
import { pluralizeRu } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, catalogItemListSchema } from "@/lib/json-ld";
import styles from "./page.module.css";
import { LeadCtaButton } from "@/components/lead-modal/lead-cta-button";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const picks = await getCatalogPicks();
  // Срезы по комнатности не пересекаются — вместе это весь каталог с ценами.
  const rooms = picks.filter((p) => p.kind === "room");
  const flats = rooms.reduce((sum, p) => sum + p.count, 0);
  const projects = new Set(rooms.flatMap((p) => p.projectSlugs)).size;
  const priceMin = Math.min(...rooms.map((p) => p.priceMin));
  return pageMetadata({
    title: rooms.length
      ? `Новостройки Екатеринбурга: купить квартиру по цене застройщика от ${millionsRub(priceMin)}`
      : "Новостройки Екатеринбурга: купить квартиру по цене застройщика",
    description: `${projects} ЖК и ${flats} ${pluralizeRu(flats, "квартира", "квартиры", "квартир")} с ценами, планировками и сроками сдачи. Бесплатный подбор, ипотека и сопровождение сделки.`,
    path: "/catalog",
  });
}

export default async function CatalogPage() {
  const [cards, mortgageConfig, allPicks] = await Promise.all([
    getCatalogCards(),
    getMortgageConfig(),
    getCatalogPicks(),
  ]);

  // Подборки по району и комнатности: отдельные адреса под запросы вида
  // «купить двухкомнатную в Ботаническом» — фильтры каталога живут в состоянии
  // компонента и своего URL не имеют, садиться таким запросам было некуда.
  const picks = allPicks.filter((p) => p.indexable);
  const byDistrict = DISTRICTS.map((district) => ({
    district,
    page: picks.find((p) => p.kind === "district" && p.district === district),
    items: picks
      .filter((p) => p.kind === "districtRoom" && p.district === district)
      .sort((a, b) => ROOM_TYPES.indexOf(a.roomType!) - ROOM_TYPES.indexOf(b.roomType!)),
  })).filter((g) => g.page || g.items.length > 0);
  const cityPicks = picks.filter((p) => p.kind === "room" || p.kind === "flag");

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
        <h1 className={styles.title}>Новостройки Екатеринбурга</h1>
        <p className={styles.lead}>
          Подбор и покупка через нашу команду — бесплатно. Цена та же, что в отделе продаж застройщика.
        </p>
        <div className={styles.pickLinks}>
          <PickLinks picks={allPicks} />
        </div>
      </div>

      <CatalogFilters cards={cards} districts={districts} developers={developers} terms={terms} rateText={rateText} />

      {byDistrict.length > 0 ? (
        <section className={styles.picksSection}>
          <h2 className={styles.picksTitle}>Подборки новостроек</h2>
          <p className={styles.picksLead}>
            Готовые срезы каталога — только те, где действительно есть выбор.
          </p>
          <div className={styles.picksGrid}>
            {cityPicks.length > 0 ? (
              <div className={styles.picksGroup}>
                <div className={styles.picksDistrict}>Весь город</div>
                <div className={styles.picksLinks}>
                  {cityPicks.map((p) => (
                    <Link key={p.path} href={p.path} className={styles.picksLink}>
                      {pickLabel(p).toLowerCase()}
                      <span className={styles.picksCount}>
                        {p.count} {pluralizeRu(p.count, "вариант", "варианта", "вариантов")}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {byDistrict.map(({ district, page, items }) => (
              <div key={district.slug} className={styles.picksGroup}>
                <div className={styles.picksDistrict}>
                  {page ? <Link href={page.path}>{district.name}</Link> : district.name}
                </div>
                <div className={styles.picksLinks}>
                  {items.map((p) => (
                    <Link key={p.path} href={p.path} className={styles.picksLink}>
                      {p.roomType!.plural.toLowerCase()}
                      <span className={styles.picksCount}>
                        {p.count} {pluralizeRu(p.count, "вариант", "варианта", "вариантов")}
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
              Оставьте заявку — подберём новостройку под цель, бюджет и маткапитал, в том числе вне
              каталога.
            </p>
          </div>
          <LeadCtaButton className={`tpl-btn-prim ${styles.ctaBtn}`}>
            Подобрать квартиру
          </LeadCtaButton>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
