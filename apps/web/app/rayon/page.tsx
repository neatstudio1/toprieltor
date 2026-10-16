import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDistricts } from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EntityHub, type HubItem } from "@/components/entity-hub/entity-hub";
import { pageMetadata } from "@/lib/site";
import { seoCopy } from "@/lib/seo-copy";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema } from "@/lib/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  ...seoCopy("/rayon")!,
  path: "/rayon",
});

export default async function DistrictsPage() {
  const districts = await getDistricts();
  if (!districts.length) notFound();

  const items: HubItem[] = districts.map((d) => ({
    slug: d.slug,
    href: `/rayon/${d.slug}`,
    title: d.name,
    lead: d.lead,
    meta: "Район · Екатеринбург",
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={breadcrumbListSchema([{ name: "Главная", path: "/" }, { name: "Районы", path: "/rayon" }])} />
      <SiteHeader active="districts" />
      <EntityHub
        eyebrow="Районы · гид по Екатеринбургу"
        title="Районы Екатеринбурга"
        lead="Выберите район — покажем новостройки, инфраструктуру и транспорт. Каждый район отличается инфраструктурой, транспортом и типом застройки. Разбираем по отдельности, чтобы вы выбирали не вслепую."
        items={items}
        ctaTitle="Не знаете, какой район выбрать?"
        ctaLead="Оставьте заявку — подберём район и ЖК под ваш образ жизни и бюджет."
      />
      <SiteFooter />
    </div>
  );
}
