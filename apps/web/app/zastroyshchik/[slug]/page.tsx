import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticles,
  getCatalogCards,
  getDeveloperBySlug,
  getEnrichedDevelopers,
  getMortgageConfig,
  pickRelatedArticles,
} from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DeveloperPageBody } from "@/components/developer-page/developer-page-body";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, faqPageSchema } from "@/lib/json-ld";

export const revalidate = 3600;

interface RouteParams {
  slug: string;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const developers = await getEnrichedDevelopers();
  return developers.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dev = await getDeveloperBySlug(slug);
  if (!dev) return {};
  return pageMetadata({
    title: `${dev.name} — застройщик в Екатеринбурге`,
    description: dev.lead ?? `Досье застройщика «${dev.name}»: репутация, сроки, условия сотрудничества и его проекты в каталоге.`,
    path: `/zastroyshchik/${slug}`,
  });
}

export default async function DeveloperDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const [dev, developers, catalogCards, mortgageConfig, articles] = await Promise.all([
    getDeveloperBySlug(slug),
    getEnrichedDevelopers(),
    getCatalogCards(),
    getMortgageConfig(),
    getArticles(),
  ]);

  if (!dev || !dev.lead) notFound();

  const minRate = mortgageConfig.rates.reduce(
    (min, r) => (r.rate < min ? r.rate : min),
    mortgageConfig.rates[0]?.rate ?? 0,
  );
  const rateText = `${(minRate * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`;

  const tabs = developers.map((d) => ({ key: d.slug, label: d.name, href: `/zastroyshchik/${d.slug}` }));
  const related = pickRelatedArticles(articles, [dev.name], 3);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Застройщики", path: "/zastroyshchik" },
          { name: dev.name, path: `/zastroyshchik/${slug}` },
        ])}
      />
      {dev.faq?.length ? <JsonLd data={faqPageSchema(dev.faq)} /> : null}
      <SiteHeader active="developers" />
      <DeveloperPageBody dev={dev} tabs={tabs} catalogCards={catalogCards} rateText={rateText} posts={related} />
      <SiteFooter />
    </div>
  );
}
