import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEnrichedDevelopers } from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EntityHub, type HubItem } from "@/components/entity-hub/entity-hub";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema } from "@/lib/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Застройщики Екатеринбурга",
  description: "Досье застройщиков Екатеринбурга: репутация, сроки, условия сотрудничества и их проекты в каталоге.",
  path: "/zastroyshchik",
});

export default async function DevelopersPage() {
  const developers = await getEnrichedDevelopers();
  if (!developers.length) notFound();

  const items: HubItem[] = developers.map((d) => ({
    slug: d.slug,
    href: `/zastroyshchik/${d.slug}`,
    title: d.name,
    lead: d.lead,
    meta: d.is_partner !== false ? "Партнёр" : "Застройщик",
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={breadcrumbListSchema([{ name: "Главная", path: "/" }, { name: "Застройщики", path: "/zastroyshchik" }])} />
      <SiteHeader active="developers" />
      <EntityHub
        eyebrow="Застройщики · досье"
        title="Кто строит в Екатеринбурге и на что смотреть перед покупкой"
        lead="Репутация, сроки сдачи и условия сотрудничества по каждому застройщику — без рекламных обещаний."
        items={items}
        ctaTitle="Сомневаетесь в застройщике?"
        ctaLead="Пройдите квиз за 2 минуты — сравним варианты и проверим договор перед сделкой."
      />
      <SiteFooter />
    </div>
  );
}
