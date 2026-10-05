import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCatalogCards,
  getDistrictTypeListings,
  getIndexableDistrictListings,
  getMortgageConfig,
  type CatalogCard,
  type DistrictTypeListing,
} from "@/lib/cms/client";
import {
  districtBySlug,
  roomTypeBySlug,
  MIN_APARTMENTS_FOR_LANDING,
  MIN_PROJECTS_FOR_LANDING,
  ROOM_TYPES,
  type RoomType,
} from "@/lib/districts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JkShowcaseGrid } from "@/components/catalog/jk-showcase-grid";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, catalogItemListSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/site";
import { formatRub, pluralizeRu } from "@/lib/format";
import styles from "./page.module.css";

export const revalidate = 3600;

interface RouteParams {
  districtSlug: string;
  roomTypeSlug: string;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const listings = await getIndexableDistrictListings();
  return listings.map((l) => ({ districtSlug: l.districtSlug, roomTypeSlug: l.roomTypeSlug }));
}

async function load(params: RouteParams) {
  const district = districtBySlug(params.districtSlug);
  const roomType = roomTypeBySlug(params.roomTypeSlug);
  if (!district || !roomType) return null;

  const listings = await getDistrictTypeListings();
  const listing = listings.find(
    (l) => l.districtSlug === district.slug && l.roomTypeSlug === roomType.slug,
  );
  // Срез ниже порога своей страницы не получает: пара квартир в разделе — это
  // ровно та «малоценная страница», за которую Яндекс уже выкинул наши хабы.
  if (
    !listing ||
    listing.count < MIN_APARTMENTS_FOR_LANDING ||
    listing.projectSlugs.length < MIN_PROJECTS_FOR_LANDING
  ) {
    return null;
  }

  return { district, roomType, listing, listings };
}

function millions(value: number): string {
  return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = await params;
  const data = await load(resolved);
  if (!data) return {};
  const { district, roomType, listing } = data;

  return pageMetadata({
    title:
      `${roomType.plural} ${district.inCityPhrase}: ${listing.count} ` +
      `${pluralizeRu(listing.count, "вариант", "варианта", "вариантов")} от ${millions(listing.priceMin)} ₽`,
    description:
      `${roomType.plural} в новостройках ${district.inCityPhrase} — ${listing.count} ` +
      `${pluralizeRu(listing.count, "квартира", "квартиры", "квартир")} в ${listing.projectSlugs.length} ЖК, ` +
      `цены от ${formatRub(listing.priceMin)} ₽. Подбор и сопровождение сделки бесплатно.`,
    path: `/catalog/${district.slug}/${roomType.slug}`,
  });
}

/**
 * Свой текст на каждой странице собирается из реальных цифр среза, а не из
 * шаблона с подстановкой названия: страницы-списки без содержания Яндекс
 * исключает как малоценные — это уже произошло с /catalog и /rayon.
 */
function buildFacts(listing: DistrictTypeListing, cards: CatalogCard[], allListings: DistrictTypeListing[]) {
  const projects = listing.projectSlugs
    .map((slug) => cards.find((c) => c.slug === slug))
    .filter((c): c is CatalogCard => Boolean(c));

  const developers = Array.from(new Set(projects.map((p) => p.developerName))).filter(Boolean);

  // Средняя цена того же типа по всем районам — база для сравнения.
  const sameType = allListings.filter((l) => l.roomTypeSlug === listing.roomTypeSlug);
  const cityMin = sameType.length ? Math.min(...sameType.map((l) => l.priceMin)) : listing.priceMin;
  const cityAvgMin =
    sameType.reduce((sum, l) => sum + l.priceMin, 0) / Math.max(sameType.length, 1);

  const thisYear = new Date().getFullYear();
  const ready = projects.filter((p) => p.termYear !== null && p.termYear <= thisYear).length;

  return { projects, developers, cityMin, cityAvgMin, ready };
}

export default async function DistrictTypePage({ params }: { params: Promise<RouteParams> }) {
  const resolved = await params;
  const [data, cards, mortgageConfig] = await Promise.all([
    load(resolved),
    getCatalogCards(),
    getMortgageConfig(),
  ]);
  if (!data) notFound();

  const { district, roomType, listing, listings } = data;
  const { projects, developers, cityAvgMin, ready } = buildFacts(listing, cards, listings);

  const minRate = mortgageConfig.rates.reduce(
    (min, r) => (r.rate < min ? r.rate : min),
    mortgageConfig.rates[0]?.rate ?? 0,
  );
  const rateText = `${(minRate * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`;

  // Другие комнатности в этом же районе — перелинковка между соседними посадками.
  const siblings = listings
    .filter(
      (l) =>
        l.districtSlug === district.slug &&
        l.roomTypeSlug !== roomType.slug &&
        l.count >= MIN_APARTMENTS_FOR_LANDING &&
        l.projectSlugs.length >= MIN_PROJECTS_FOR_LANDING,
    )
    .map((l) => ({ listing: l, type: ROOM_TYPES.find((t) => t.slug === l.roomTypeSlug) }))
    .filter((s): s is { listing: DistrictTypeListing; type: RoomType } => Boolean(s.type))
    .sort((a, b) => ROOM_TYPES.indexOf(a.type) - ROOM_TYPES.indexOf(b.type));

  const cheaperThanCity = listing.priceMin < cityAvgMin;
  const diffPercent = Math.round(Math.abs(1 - listing.priceMin / cityAvgMin) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Каталог ЖК", path: "/catalog" },
          {
            name: `${roomType.plural} ${district.inCityPhrase}`,
            path: `/catalog/${district.slug}/${roomType.slug}`,
          },
        ])}
      />
      <JsonLd data={catalogItemListSchema(projects)} />
      <SiteHeader active="catalog" />

      <div className={styles.wrap}>
        <div className={styles.crumbs}>
          <Link href="/">Главная</Link> / <Link href="/catalog">Каталог ЖК</Link> /{" "}
          {roomType.plural} {district.inPhrase}
        </div>

        <h1 className={styles.title}>
          {roomType.plural} {district.inCityPhrase}
        </h1>

        <p className={styles.lead}>
          {listing.count} {pluralizeRu(listing.count, "вариант", "варианта", "вариантов")} в{" "}
          {listing.projectSlugs.length} {pluralizeRu(listing.projectSlugs.length, "ЖК", "ЖК", "ЖК")} от{" "}
          {developers.slice(0, 3).join(", ")}
          {developers.length > 3 ? ` и ещё ${developers.length - 3}` : ""}. Цены от{" "}
          {millions(listing.priceMin)} ₽ до {millions(listing.priceMax)} ₽.
        </p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{listing.count}</div>
            <div className={styles.statLabel}>квартир в продаже</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{millions(listing.priceMin)} ₽</div>
            <div className={styles.statLabel}>минимальная цена</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {listing.areaMin.toFixed(0)}–{listing.areaMax.toFixed(0)} м²
            </div>
            <div className={styles.statLabel}>диапазон площадей</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{rateText}</div>
            <div className={styles.statLabel}>ставка по ипотеке от</div>
          </div>
        </div>

        <div className={styles.note}>
          <p>
            Самая доступная {roomType.short.toLowerCase()} {district.inPhrase} стоит{" "}
            {formatRub(listing.priceMin)} ₽ — это{" "}
            {cheaperThanCity ? `на ${diffPercent}% дешевле` : `на ${diffPercent}% дороже`} среднего порога
            входа по городу для этого типа квартир.
            {listing.pricePerM2 > 0
              ? ` Типичный квадратный метр в этой подборке — ${formatRub(Math.round(listing.pricePerM2))} ₽.`
              : ""}
          </p>
          <p>
            {ready > 0
              ? `${ready} из ${projects.length} ${pluralizeRu(projects.length, "комплекса", "комплексов", "комплексов")} уже сданы — в них можно заезжать сразу после сделки, без ожидания ключей.`
              : "Все комплексы в этой подборке ещё строятся, поэтому покупка идёт по ДДУ через счёт эскроу — деньги лежат в банке до ввода дома."}{" "}
            {district.hasGuide ? (
              <>
                Что за район, как с транспортом, школами и экологией — в{" "}
                <Link href={`/rayon/${district.slug}`}>гиде по району</Link>.
              </>
            ) : (
              <>
                Подобрать вариант под бюджет и льготную программу поможем бесплатно —{" "}
                <Link href="/quiz">пройдите короткий квиз</Link>.
              </>
            )}
          </p>
        </div>

        <h2 className={styles.sectionTitle}>Жилые комплексы</h2>
        <JkShowcaseGrid cards={projects} rateText={rateText} />

        {siblings.length > 0 ? (
          <>
            <h2 className={styles.sectionTitle}>Другие планировки {district.inPhrase}</h2>
            <div className={styles.siblings}>
              {siblings.map(({ listing: l, type }) => (
                <Link
                  key={`${l.districtSlug}/${l.roomTypeSlug}`}
                  href={`/catalog/${l.districtSlug}/${l.roomTypeSlug}`}
                  className={styles.sibling}
                >
                  <span className={styles.siblingName}>{type.plural}</span>
                  <span className={styles.siblingMeta}>
                    {l.count} {pluralizeRu(l.count, "вариант", "варианта", "вариантов")} · от{" "}
                    {millions(l.priceMin)} ₽
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}

        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Не нашли подходящий вариант?</h2>
          <p className={styles.ctaLead}>
            В базе есть квартиры, которых нет в открытой продаже. Расскажите про бюджет и цель —
            подберём за пару дней, бесплатно.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/quiz" className="btn-prim">
              Пройти квиз за 2 минуты
            </Link>
            <Link href="/catalog" className="btn-sec">
              Весь каталог новостроек
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
