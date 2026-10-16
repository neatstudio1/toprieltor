import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServices } from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EntityHub, type HubItem } from "@/components/entity-hub/entity-hub";
import { pageMetadata } from "@/lib/site";
import { seoCopy } from "@/lib/seo-copy";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema } from "@/lib/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  ...seoCopy("/uslugi")!,
  path: "/uslugi",
});

export default async function ServicesPage() {
  const services = await getServices();
  if (!services.length) notFound();

  const items: HubItem[] = services.map((s) => ({
    slug: s.slug,
    href: `/uslugi/${s.slug}`,
    title: s.name,
    lead: s.pitch,
    meta: s.kicker,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={breadcrumbListSchema([{ name: "Главная", path: "/" }, { name: "Услуги", path: "/uslugi" }])} />
      <SiteHeader active="services" />
      <EntityHub
        eyebrow="Услуги · экосистема покупки под ключ"
        title="Услуги"
        lead="От подбора до заселения — одна команда на весь путь. Ипотека, юридическая проверка, приёмка квартиры, ремонт и дизайн, аренда и инвестиции — выберите услугу, чтобы узнать подробности."
        items={items}
        ctaTitle="Разберём вашу ситуацию лично"
        ctaLead="Оставьте заявку — подскажем, какие услуги нужны именно вам."
      />
      <SiteFooter />
    </div>
  );
}
