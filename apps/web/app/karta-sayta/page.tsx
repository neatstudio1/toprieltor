import type { Metadata } from "next";
import Link from "next/link";
import { getArticles, getCatalogCards, getDistricts, getEnrichedDevelopers, getServices } from "@/lib/cms/client";
import { getIndexablePicks } from "@/lib/catalog-picks";
import { ROOM_TYPES } from "@/lib/districts";
import { pickLabel, quotedName } from "@/lib/seo-templates";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/site";
import styles from "./page.module.css";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Карта сайта",
  description:
    "Все разделы сайта TOPиелтор: каталог новостроек Екатеринбурга, подборки по районам и комнатности, ЖК, застройщики, услуги и статьи блога.",
  path: "/karta-sayta",
});

interface Section {
  title: string;
  href?: string;
  links: { href: string; label: string }[];
}

/**
 * HTML-карта сайта: каждая индексируемая страница в одном клике от любой
 * страницы (ссылка в подвале). XML-карта говорит роботу, что страницы есть,
 * а эта ещё и передаёт им вес — особенно новым подборкам и глубоким ЖК.
 */
export default async function SiteMapPage() {
  const [cards, picks, developers, districts, services, articles] = await Promise.all([
    getCatalogCards(),
    getIndexablePicks(),
    getEnrichedDevelopers(),
    getDistricts(),
    getServices(),
    getArticles(),
  ]);

  const order = (p: (typeof picks)[number]) => (p.roomType ? ROOM_TYPES.indexOf(p.roomType) : -1);
  const sections: Section[] = [
    {
      title: "Основные разделы",
      links: [
        { href: "/", label: "Главная" },
        { href: "/catalog", label: "Каталог новостроек" },
        { href: "/uslugi", label: "Услуги" },
        { href: "/rayon", label: "Районы Екатеринбурга" },
        { href: "/zastroyshchik", label: "Застройщики" },
        { href: "/blog", label: "Блог" },
        { href: "/o-nas", label: "О нас" },
        { href: "/contacts", label: "Контакты" },
      ],
    },
    {
      title: "Подборки по городу",
      href: "/catalog",
      links: picks
        .filter((p) => p.kind === "room" || p.kind === "flag")
        .sort((a, b) => order(a) - order(b))
        .map((p) => ({ href: p.path, label: pickLabel(p) })),
    },
    {
      title: "Подборки по районам",
      href: "/catalog",
      links: picks
        // getCatalogPicks уже отдаёт их по районам: страница района, затем её комнатности.
        .filter((p) => p.kind === "district" || p.kind === "districtRoom")
        .map((p) => ({ href: p.path, label: pickLabel(p) })),
    },
    {
      title: "Жилые комплексы",
      href: "/catalog",
      links: [...cards]
        .sort((a, b) => a.name.localeCompare(b.name, "ru"))
        .map((c) => ({ href: `/zhk/${c.slug}`, label: `ЖК ${quotedName(c.name)}` })),
    },
    {
      title: "Застройщики",
      href: "/zastroyshchik",
      // Страница застройщика существует только при заполненном досье (lead).
      links: developers.filter((d) => d.lead).map((d) => ({ href: `/zastroyshchik/${d.slug}`, label: d.name })),
    },
    {
      title: "Районы — гид",
      href: "/rayon",
      links: districts.map((d) => ({ href: `/rayon/${d.slug}`, label: d.name })),
    },
    {
      title: "Услуги",
      href: "/uslugi",
      links: services.map((s) => ({ href: `/uslugi/${s.slug}`, label: s.name })),
    },
    {
      title: "Статьи",
      href: "/blog",
      links: articles.map((a) => ({ href: `/blog/${a.slug}`, label: a.title })),
    },
  ].filter((s) => s.links.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={breadcrumbListSchema([{ name: "Главная", path: "/" }, { name: "Карта сайта", path: "/karta-sayta" }])} />
      <SiteHeader />
      <div className={styles.wrap}>
        <h1 className={styles.title}>Карта сайта</h1>
        <p className={styles.lead}>Все разделы, подборки, жилые комплексы и статьи — на одной странице.</p>
        <div className={styles.grid}>
          {sections.map((s) => (
            <section key={s.title} className={styles.section}>
              <h2 className={styles.sectionTitle}>{s.href ? <Link href={s.href}>{s.title}</Link> : s.title}</h2>
              <ul className={styles.list}>
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
