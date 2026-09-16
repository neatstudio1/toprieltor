import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticles,
  getCatalogCards,
  getMortgageConfig,
  getServiceBySlug,
  getServices,
} from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ServicePageBody } from "@/components/service-page/service-page-body";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, faqPageSchema } from "@/lib/json-ld";
import { articlesForService } from "@/lib/article-service";

export const revalidate = 3600;

interface RouteParams {
  slug: string;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const svc = await getServiceBySlug(slug);
  if (!svc) return {};
  return pageMetadata({
    // h1 написан под страницу и в выдаче обрезается — для поиска отдельное поле
    title: svc.seo_title ?? svc.h1,
    description: svc.seo_description ?? svc.pitch ?? svc.h1,
    path: `/uslugi/${slug}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const [svc, services, catalogCards, mortgageConfig, articles] = await Promise.all([
    getServiceBySlug(slug),
    getServices(),
    getCatalogCards(),
    getMortgageConfig(),
    getArticles(),
  ]);

  if (!svc) notFound();

  const minRate = mortgageConfig.rates.reduce(
    (min, r) => (r.rate < min ? r.rate : min),
    mortgageConfig.rates[0]?.rate ?? 0,
  );
  const rateText = `${(minRate * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`;

  const tabs = services.map((s) => ({ key: s.slug, label: s.tab_label, href: `/uslugi/${s.slug}` }));
  const related = articlesForService(articles, svc.slug);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Услуги", path: "/uslugi" },
          { name: svc.name, path: `/uslugi/${slug}` },
        ])}
      />
      {svc.faq?.length ? <JsonLd data={faqPageSchema(svc.faq)} /> : null}
      <SiteHeader active="services" />
      <ServicePageBody svc={svc} tabs={tabs} catalogCards={catalogCards} rateText={rateText} posts={related} />
      <SiteFooter />
    </div>
  );
}
