import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticles,
  getCatalogCards,
  getDistrictBySlug,
  getDistricts,
  getMortgageConfig,
} from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DistrictPageBody } from "@/components/district-page/district-page-body";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, faqPageSchema } from "@/lib/json-ld";
import { articlesAbout } from "@/lib/article-service";

export const revalidate = 3600;

interface RouteParams {
  slug: string;
}

// Districts collection is small hand-authored editorial content; project.district in
// Strapi is a free-text scraped field, so matching is done by loose substring rather
// than an exact relation. Keep in sync with scripts/seed-pages-content.js DISTRICTS.
const KEYWORD_BY_SLUG: Record<string, string> = {
  akademicheskiy: "академ",
  botanicheskiy: "ботан",
  sortirovka: "сортировк",
  uralmash: "уралмаш",
  viz: "виз",
};

export async function generateStaticParams(): Promise<RouteParams[]> {
  const districts = await getDistricts();
  return districts.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDistrictBySlug(slug);
  if (!d) return {};
  return pageMetadata({
    title: `${d.name} в Екатеринбурге: новостройки и цены`,
    description: d.lead ?? `Гид по району «${d.name}» в Екатеринбурге: новостройки, инфраструктура, транспорт, экология.`,
    path: `/rayon/${slug}`,
  });
}

export default async function DistrictDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const [d, districts, catalogCards, mortgageConfig, articles] = await Promise.all([
    getDistrictBySlug(slug),
    getDistricts(),
    getCatalogCards(),
    getMortgageConfig(),
    getArticles(),
  ]);

  if (!d) notFound();

  const minRate = mortgageConfig.rates.reduce(
    (min, r) => (r.rate < min ? r.rate : min),
    mortgageConfig.rates[0]?.rate ?? 0,
  );
  const rateText = `${(minRate * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`;

  const tabs = districts.map((x) => ({ key: x.slug, label: x.tab_label ?? x.name, href: `/rayon/${x.slug}` }));
  const related = articlesAbout(articles, d.name);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Районы", path: "/rayon" },
          { name: d.name, path: `/rayon/${slug}` },
        ])}
      />
      {d.faq?.length ? <JsonLd data={faqPageSchema(d.faq)} /> : null}
      <SiteHeader active="districts" />
      <DistrictPageBody
        d={d}
        tabs={tabs}
        catalogCards={catalogCards}
        rateText={rateText}
        posts={related}
        keyword={KEYWORD_BY_SLUG[d.slug] ?? d.name}
      />
      <SiteFooter />
    </div>
  );
}
