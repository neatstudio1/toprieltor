import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getCatalogCards, getMortgageConfig, type CatalogCard } from "@/lib/cms/client";
import { getCatalogPicks, getIndexablePicks, resolvePick, pickPath, type CatalogPick } from "@/lib/catalog-picks";
import { ROOM_TYPES } from "@/lib/districts";
import { pickLabel, pickSeo, millionsRub } from "@/lib/seo-templates";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JkShowcaseGrid } from "@/components/catalog/jk-showcase-grid";
import { PickLinks } from "@/components/catalog/pick-links";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, catalogItemListSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/site";
import { formatRub, pluralizeRu } from "@/lib/format";
import styles from "./page.module.css";
import { LeadCtaButton } from "@/components/lead-modal/lead-cta-button";

export const revalidate = 3600;

interface RouteParams {
  filters: string[];
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const picks = await getIndexablePicks();
  return picks.map((p) => ({ filters: p.path.replace(/^\/catalog\//, "").split("/") }));
}

async function load(params: RouteParams) {
  const resolution = await resolvePick(params.filters.map(decodeURIComponent));
  // Ниже порога подборка своей страницы не получает: пара квартир в разделе —
  // ровно та «малоценная страница», за которую Яндекс уже выкидывал наши хабы.
  if (resolution.type === "redirect") permanentRedirect(resolution.to);
  if (resolution.type === "notFound") notFound();
  const [cards, picks] = await Promise.all([getCatalogCards(), getCatalogPicks()]);
  const pick = resolution.pick;
  const projects = pick.projectSlugs
    .map((slug) => cards.find((c) => c.slug === slug))
    .filter((c): c is CatalogCard => Boolean(c));
  return { pick, picks, projects };
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { pick, projects } = await load(await params);
  const seo = pickSeo(pick, projects);
  return pageMetadata({ title: seo.title, description: seo.description, path: pick.path });
}

const variantsText = (n: number) => `${n} ${pluralizeRu(n, "вариант", "варианта", "вариантов")}`;

/**
 * Свой текст на каждой странице собирается из реальных цифр среза, а не из
 * шаблона с подстановкой названия: страницы-списки без содержания Яндекс
 * исключает как малоценные — это уже произошло с /catalog и /rayon.
 */
function NoteText({ pick, picks, projects }: { pick: CatalogPick; picks: CatalogPick[]; projects: CatalogCard[] }) {
  const priceText = `${formatRub(pick.priceMin)} ₽`;
  const perM2 =
    pick.pricePerM2 > 0 ? ` Типичный квадратный метр в этой подборке — ${formatRub(Math.round(pick.pricePerM2))} ₽.` : "";

  if (pick.kind === "districtRoom" && pick.district && pick.roomType) {
    // Порог входа того же типа по всем районам — база для сравнения.
    const sameType = picks.filter((p) => p.kind === "districtRoom" && p.roomType === pick.roomType);
    const cityAvgMin = sameType.reduce((sum, p) => sum + p.priceMin, 0) / Math.max(sameType.length, 1);
    const diff = Math.round(Math.abs(1 - pick.priceMin / cityAvgMin) * 100);
    return (
      <p>
        Самая доступная {pick.roomType.short.toLowerCase()} {pick.district.inPhrase} стоит {priceText} — это{" "}
        {pick.priceMin < cityAvgMin ? `на ${diff}% дешевле` : `на ${diff}% дороже`} среднего порога входа по городу
        для этого типа квартир.{perM2}
      </p>
    );
  }
  if (pick.kind === "room" && pick.roomType) {
    const byDistrict = picks
      .filter((p) => p.kind === "districtRoom" && p.roomType === pick.roomType)
      .sort((a, b) => a.priceMin - b.priceMin);
    const cheapest = byDistrict[0];
    const priciest = byDistrict[byDistrict.length - 1];
    return (
      <p>
        {pick.roomType.plural} продаются в {pick.projectSlugs.length}{" "}
        {pluralizeRu(pick.projectSlugs.length, "комплексе", "комплексах", "комплексах")} Екатеринбурга, самая доступная
        стоит {priceText}.
        {cheapest && priciest && cheapest !== priciest && cheapest.district && priciest.district
          ? ` Дешевле всего — ${cheapest.district.inPhrase} (от ${millionsRub(cheapest.priceMin)}), дороже всего — ${priciest.district.inPhrase} (от ${millionsRub(priciest.priceMin)}).`
          : ""}
        {perM2}
      </p>
    );
  }
  if (pick.kind === "district" && pick.district) {
    const rooms = picks
      .filter((p) => p.kind === "districtRoom" && p.district === pick.district && p.roomType)
      .sort((a, b) => ROOM_TYPES.indexOf(a.roomType!) - ROOM_TYPES.indexOf(b.roomType!));
    return (
      <p>
        {pick.district.inPhrase[0].toUpperCase() + pick.district.inPhrase.slice(1)} в продаже {pick.count}{" "}
        {pluralizeRu(pick.count, "квартира", "квартиры", "квартир")}
        {rooms.length
          ? `: ${rooms.map((r) => `${r.roomType!.short.toLowerCase()} — от ${millionsRub(r.priceMin)}`).join(", ")}.`
          : "."}
        {perM2}
      </p>
    );
  }
  if (pick.flag === "sdannye") {
    return (
      <p>
        Плановый срок сдачи всех очередей уже наступил: {projects.map((p) => `«${p.name}»`).join(", ")}. Ждать
        стройку не нужно — заселение в ближайшие месяцы после сделки. Точный статус дома и дату ключей уточним
        у застройщика до брони.{perM2}
      </p>
    );
  }
  const total = picks.filter((p) => p.kind === "room").reduce((sum, p) => sum + p.count, 0);
  const share = total ? Math.round((pick.count / total) * 100) : 0;
  return (
    <p>
      С отделкой продаётся {share}% квартир каталога: {pick.cleanFinishCount} — с чистовой, остальные{" "}
      {pick.count - pick.cleanFinishCount} — с предчистовой (white box), где остаются покраска стен, двери и
      сантехника. Посчитаем «квартира + ремонт» до брони — Яна дизайнер интерьеров и подскажет, где отделку не
      придётся переделывать.{perM2}
    </p>
  );
}

/** Соседние подборки — перелинковка между срезами одного района или одной комнатности. */
function relatedPicks(pick: CatalogPick, picks: CatalogPick[]): CatalogPick[] {
  const indexable = picks.filter((p) => p.indexable && p.path !== pick.path);
  const order = (p: CatalogPick) => (p.roomType ? ROOM_TYPES.indexOf(p.roomType) : -1);
  if (pick.kind === "districtRoom") {
    return [
      ...indexable.filter((p) => p.kind === "districtRoom" && p.district === pick.district).sort((a, b) => order(a) - order(b)),
      ...indexable.filter((p) => (p.kind === "district" && p.district === pick.district) || (p.kind === "room" && p.roomType === pick.roomType)),
    ];
  }
  if (pick.kind === "district") {
    return indexable.filter((p) => p.kind === "districtRoom" && p.district === pick.district).sort((a, b) => order(a) - order(b));
  }
  if (pick.kind === "room") {
    return indexable
      .filter((p) => p.kind === "districtRoom" && p.roomType === pick.roomType)
      .sort((a, b) => a.priceMin - b.priceMin);
  }
  return [...indexable.filter((p) => p.kind === "flag"), ...indexable.filter((p) => p.kind === "room")];
}

export default async function CatalogPickPage({ params }: { params: Promise<RouteParams> }) {
  const [{ pick, picks, projects }, mortgageConfig] = await Promise.all([load(await params), getMortgageConfig()]);
  const seo = pickSeo(pick, projects);
  const label = pickLabel(pick);

  const minRate = mortgageConfig.rates.reduce(
    (min, r) => (r.rate < min ? r.rate : min),
    mortgageConfig.rates[0]?.rate ?? 0,
  );
  const rateText = `${(minRate * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`;

  const developers = Array.from(new Set(projects.map((p) => p.developerName))).filter(Boolean);
  const ready = projects.filter((p) => p.hasDelivered).length;
  const related = relatedPicks(pick, picks);

  // «Район × комнатность» вложена в страницу района, если та есть.
  const parent =
    pick.kind === "districtRoom" && pick.district
      ? picks.find((p) => p.indexable && p.path === pickPath({ district: pick.district }))
      : undefined;
  const crumbs = [
    { name: "Главная", path: "/" },
    { name: "Каталог ЖК", path: "/catalog" },
    ...(parent ? [{ name: pickLabel(parent), path: parent.path }] : []),
    { name: label, path: pick.path },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={breadcrumbListSchema(crumbs)} />
      <JsonLd data={catalogItemListSchema(projects)} />
      <SiteHeader active="catalog" />

      <div className={styles.wrap}>
        <div className={styles.crumbs}>
          {crumbs.slice(0, -1).map((c) => (
            <span key={c.path}>
              <Link href={c.path}>{c.name}</Link> /{" "}
            </span>
          ))}
          {label}
        </div>

        <h1 className={styles.title}>{seo.h1}</h1>

        <p className={styles.lead}>
          {variantsText(pick.count)} в {projects.length} ЖК от {developers.slice(0, 3).join(", ")}
          {developers.length > 3 ? ` и ещё ${developers.length - 3}` : ""}. Цены от {millionsRub(pick.priceMin)} до{" "}
          {millionsRub(pick.priceMax)}.
        </p>

        <div className={styles.picks}>
          <PickLinks picks={picks} current={pick} />
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{pick.count}</div>
            <div className={styles.statLabel}>квартир в продаже</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{millionsRub(pick.priceMin)}</div>
            <div className={styles.statLabel}>минимальная цена</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {pick.areaMin.toFixed(0)}–{pick.areaMax.toFixed(0)} м²
            </div>
            <div className={styles.statLabel}>диапазон площадей</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{rateText}</div>
            <div className={styles.statLabel}>ставка по ипотеке от</div>
          </div>
        </div>

        <div className={styles.note}>
          <NoteText pick={pick} picks={picks} projects={projects} />
          <p>
            {pick.flag === "sdannye"
              ? null
              : ready > 0
                ? `${ready} из ${projects.length} ${pluralizeRu(projects.length, "комплекса", "комплексов", "комплексов")} уже сданы полностью или частично — в готовых очередях можно заезжать сразу после сделки. `
                : "Все комплексы в этой подборке ещё строятся, поэтому покупка идёт по ДДУ через счёт эскроу — деньги лежат в банке до ввода дома. "}
            {pick.district?.hasGuide ? (
              <>
                Что за район, как с транспортом, школами и экологией — в{" "}
                <Link href={`/rayon/${pick.district.slug}`}>гиде по району</Link>.
              </>
            ) : (
              <>
                Подобрать вариант под бюджет и льготную программу поможем бесплатно —{" "}
                <LeadCtaButton
                  style={{ background: "none", padding: 0, color: "inherit", font: "inherit", textDecoration: "underline" }}
                >
                  оставьте заявку
                </LeadCtaButton>
                .
              </>
            )}
          </p>
        </div>

        <h2 className={styles.sectionTitle}>Жилые комплексы</h2>
        <JkShowcaseGrid cards={projects} rateText={rateText} />

        {related.length > 0 ? (
          <>
            <h2 className={styles.sectionTitle}>Другие подборки</h2>
            <div className={styles.siblings}>
              {related.map((p) => (
                <Link key={p.path} href={p.path} className={styles.sibling}>
                  <span className={styles.siblingName}>{pickLabel(p)}</span>
                  <span className={styles.siblingMeta}>
                    {variantsText(p.count)} · от {millionsRub(p.priceMin)}
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}

        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Не нашли подходящий вариант?</h2>
          <p className={styles.ctaLead}>
            В базе есть квартиры, которых нет в открытой продаже. Расскажите про бюджет и цель — подберём за пару дней,
            бесплатно.
          </p>
          <div className={styles.ctaRow}>
            <LeadCtaButton className="btn-prim">Подобрать квартиру</LeadCtaButton>
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
