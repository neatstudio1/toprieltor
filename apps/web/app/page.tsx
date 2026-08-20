import type { Metadata } from "next";
import {
  getCheapestApartmentByProjectSlug,
  getHomePage,
  getProjectsBySlugsMap,
} from "@/lib/cms/client";
import { formatRub } from "@/lib/format";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { faqPageSchema, realEstateAgentSchema } from "@/lib/json-ld";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/home/hero-section";
import { PartnersSection } from "@/components/home/partners-section";
import { EcosystemSection } from "@/components/home/ecosystem-section";
import { WhyFreeFlow } from "@/components/home/why-free-flow";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { PopularZhkSection, type PopularZhkCard } from "@/components/home/popular-zhk-section";
import { MortgageSection } from "@/components/home/mortgage-section";
import { BanksSection } from "@/components/home/banks-section";
import { CasesSection } from "@/components/home/cases-section";
import { FaqSection } from "@/components/home/faq-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "TOPиелтор — подбор новостроек Екатеринбурга под ключ",
  description:
    "Подбираем новостройку в Екатеринбурге под ваш бюджет и капитал. Ипотека, юридическая проверка, приёмка, дизайн и ремонт — бесплатно для клиента.",
  path: "/",
  absoluteTitle: true,
});

async function buildPopularZhkCards(
  slugs: string[],
  minRateText: string,
): Promise<PopularZhkCard[]> {
  const projectsMap = await getProjectsBySlugsMap(slugs);
  const cards: PopularZhkCard[] = [];

  for (const slug of slugs) {
    const project = projectsMap.get(slug);
    if (!project) continue;
    const cheapest = await getCheapestApartmentByProjectSlug(slug);
    const termMatch = project.delivery_date?.match(/(\d{4})/);
    cards.push({
      slug,
      name: project.name,
      developerName: project.developer?.name ?? "",
      district: project.district,
      termYear: termMatch ? Number(termMatch[1]) : null,
      priceText: cheapest ? `${formatRub(cheapest.price_from)} ₽` : "—",
      areaText: cheapest ? `${cheapest.area_m2.toFixed(1).replace(".", ",")} м²` : "—",
      rateText: minRateText,
      photo: project.photos?.[0] ?? null,
    });
  }

  return cards;
}

export default async function HomePage() {
  const home = await getHomePage();
  const minRate = home.mortgage_scenarios.reduce(
    (min, s) => (s.rate < min ? s.rate : min),
    home.mortgage_scenarios[0]?.rate ?? "",
  );
  const popularCards = await buildPopularZhkCards(home.featured_project_slugs, minRate);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={realEstateAgentSchema()} />
      <JsonLd data={faqPageSchema(home.faq)} />
      <SiteHeader />
      <HeroSection
        eyebrow={home.hero_eyebrow}
        title={home.hero_title}
        subtitle={home.hero_subtitle}
        stats={home.hero_stats}
      />
      <PartnersSection developers={home.partners_developers} materials={home.partners_materials} />
      <EcosystemSection
        eyebrow={home.ecosystem_eyebrow}
        title={home.ecosystem_title}
        lead={home.ecosystem_lead}
        stages={home.stages}
      />
      <WhyFreeFlow eyebrow="Прозрачная модель" title={home.why_free_title} steps={home.why_free_steps} />
      <HowItWorksSection title={home.how_it_works_title} steps={home.steps} />
      <PopularZhkSection
        title="Новостройки, которые чаще всего выбирают через наш квиз"
        cards={popularCards}
      />
      <MortgageSection title={home.mortgage_title} scenarios={home.mortgage_scenarios} />
      <BanksSection banks={home.banks} />
      <CasesSection title={home.cases_title} cases={home.cases} />
      <FaqSection title={home.faq_title} faq={home.faq} />
      <FinalCtaSection />
      <SiteFooter />
    </div>
  );
}
