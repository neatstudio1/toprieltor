import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllProjectSlugs,
  getApartmentsByProjectSlug,
  getCheapestApartmentByProjectSlug,
  getMortgageConfig,
  getProjectBySlug,
  getSimilarProjects,
} from "@/lib/cms/client";
import { formatRub, formatRubPrecise } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LightboxProvider } from "@/components/apartment/lightbox-provider";
import { ProjectGallery } from "@/components/project/project-gallery";
import { InfraAccordion } from "@/components/project/infra-accordion";
import { QueuesTable } from "@/components/project/queues-table";
import { ApartmentsList } from "@/components/project/apartments-list";
import { PaymentCalculator, type PaymentScenario } from "@/components/project/payment-calculator";
import { ProjectMap } from "@/components/project/project-map";
import { SimilarProjects, type SimilarProjectCard } from "@/components/project/similar-projects";
import { ViewingCtaButton } from "@/components/lead-modal/viewing-cta-button";
import { ProjectStickyBar } from "@/components/project/project-sticky-bar";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema, projectRealEstateListingSchema } from "@/lib/json-ld";
import styles from "./page.module.css";

export const revalidate = 3600;

interface RouteParams {
  projectSlug: string;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await getAllProjectSlugs();
  return slugs.map((projectSlug) => ({ projectSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { projectSlug } = await params;
  const project = await getProjectBySlug(projectSlug);
  if (!project) return {};
  const title = `ЖК «${project.name}» — ${project.developer?.name ?? ""}`;
  const description = project.concept
    ? project.concept.slice(0, 160)
    : `Квартиры в ЖК «${project.name}» в Екатеринбурге. Подбор и сопровождение сделки бесплатно.`;
  const photo = project.photos?.[0];
  return pageMetadata({ title, description, path: `/zhk/${projectSlug}`, image: photo });
}

function deliveryRangeText(project: NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>): string {
  const years = project.queues
    .map((q) => q.delivery?.match(/(\d{4})/)?.[1])
    .filter((y): y is string => Boolean(y));
  if (!years.length) return project.delivery_date ?? "уточняется";
  const first = project.queues.find((q) => q.delivery?.includes(years[0]))?.delivery ?? years[0];
  const min = Math.min(...years.map(Number));
  const max = Math.max(...years.map(Number));
  if (min === max) return first ?? String(min);
  const minQ = project.queues.find((q) => q.delivery?.endsWith(String(min)))?.delivery ?? String(min);
  const maxQ = project.queues.find((q) => q.delivery?.endsWith(String(max)))?.delivery ?? String(max);
  return `${minQ} — ${maxQ}`;
}

function hasDeliveredQueue(project: NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>): boolean {
  return project.queues.some((q) => {
    const match = q.delivery?.match(/(\d)\s*кв\S*\s*(\d{4})/i);
    if (!match) return false;
    const quarter = Number(match[1]);
    const year = Number(match[2]);
    const end = new Date(year, quarter * 3, 0);
    return end.getTime() <= Date.now();
  });
}

export default async function ProjectPage({ params }: { params: Promise<RouteParams> }) {
  const { projectSlug } = await params;
  const project = await getProjectBySlug(projectSlug);
  if (!project) notFound();

  const [apartments, mortgageConfig, similarRaw] = await Promise.all([
    getApartmentsByProjectSlug(projectSlug),
    getMortgageConfig(),
    getSimilarProjects(projectSlug, 3),
  ]);

  const pricedApartments = apartments.filter((a) => a.price_from > 0);
  const minPriceApt = pricedApartments.reduce<typeof pricedApartments[number] | null>(
    (min, a) => (!min || a.price_from < min.price_from ? a : min),
    null,
  );
  const minAreaApt = pricedApartments.reduce<typeof pricedApartments[number] | null>(
    (min, a) => (!min || a.area_m2 < min.area_m2 ? a : min),
    null,
  );

  const similar: SimilarProjectCard[] = await Promise.all(
    similarRaw.map(async (p) => {
      const cheapest = await getCheapestApartmentByProjectSlug(p.slug);
      const termMatch = p.delivery_date?.match(/(\d{4})/);
      return {
        slug: p.slug,
        name: p.name,
        district: p.district,
        termYear: termMatch ? Number(termMatch[1]) : null,
        priceText: cheapest ? `${formatRub(cheapest.price_from)} ₽` : "—",
        photo: p.photos?.[0] ?? null,
      };
    }),
  );

  const rateByLabel = (needle: string) =>
    mortgageConfig.rates.find((r) => r.label.toLowerCase().includes(needle))?.rate ?? mortgageConfig.rates[0]?.rate ?? 0.06;
  const basePrice = minPriceApt?.price_from ?? 0;
  const scenarios: PaymentScenario[] = [
    {
      label: "МК 1-й реб.",
      down: mortgageConfig.matkap_sum_family,
      downText: `${formatRubPrecise(mortgageConfig.matkap_sum_family)} ₽ (МК на 1-го ребёнка)`,
      rate: rateByLabel("льготн"),
      rateText: `${(rateByLabel("льготн") * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`,
    },
    {
      label: "МК 2-й реб.",
      down: mortgageConfig.matkap_sum_default,
      downText: `${formatRub(mortgageConfig.matkap_sum_default)} ₽ (МК на 2-го ребёнка)`,
      rate: rateByLabel("льготн"),
      rateText: `${(rateByLabel("льготн") * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`,
    },
    {
      label: "Семейная",
      down: Math.round(basePrice * 0.15),
      downText: `${formatRub(Math.round(basePrice * 0.15))} ₽ (15%)`,
      rate: rateByLabel("льготн"),
      rateText: `${(rateByLabel("льготн") * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`,
    },
    {
      label: "Рыночная",
      down: Math.round(basePrice * 0.2),
      downText: `${formatRub(Math.round(basePrice * 0.2))} ₽ (20%)`,
      rate: rateByLabel("рыночн"),
      rateText: `${(rateByLabel("рыночн") * 100).toFixed(2).replace(/0$/, "").replace(".", ",")}%`,
    },
  ];

  const galleryPhotos = project.photos.length ? project.photos : pricedApartments[0]?.photo_urls ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Каталог ЖК", path: "/catalog" },
          { name: project.name, path: `/zhk/${project.slug}` },
        ])}
      />
      <JsonLd data={projectRealEstateListingSchema(project, minPriceApt?.price_from ?? null)} />
      <SiteHeader cta="viewing" />
      <LightboxProvider>
        <div className={styles.container}>
          <div className={styles.breadcrumbs}>
            <Link href="/" style={{ color: "var(--muted)" }}>
              Главная
            </Link>{" "}
            /{" "}
            <Link href="/catalog" style={{ color: "var(--muted)" }}>
              Каталог ЖК
            </Link>{" "}
            / <span style={{ color: "var(--ink)" }}>{project.name}</span>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>ЖК «{project.name}»</h1>
            <div className={styles.subline}>
              {project.developer?.name ?? ""} · {project.district ?? "Екатеринбург"} · сдача {deliveryRangeText(project)}
            </div>
            <div className={styles.facts}>
              <div className={styles.fact}>
                <div className={styles.factLabel}>Цена от</div>
                <div className={styles.factValue}>{minPriceApt ? `${formatRub(minPriceApt.price_from)} ₽` : "—"}</div>
              </div>
              <div className={styles.factBordered}>
                <div className={styles.factLabel}>Площадь от</div>
                <div className={styles.factValue}>
                  {minAreaApt ? `${minAreaApt.area_m2.toFixed(1).replace(".", ",")} м²` : "—"}
                </div>
              </div>
              <div className={styles.factBordered}>
                <div className={styles.factLabel}>Взнос от</div>
                <div className={styles.factValueAccent}>0 ₽*</div>
              </div>
              <div className={styles.flagsCol}>
                {project.matkapital ? <div className={styles.flag}>Маткапитал принимается</div> : null}
                {hasDeliveredQueue(project) ? <div className={styles.flag}>Есть готовые квартиры</div> : null}
              </div>
            </div>
          </div>

          {galleryPhotos.length > 0 ? (
            <ProjectGallery photos={galleryPhotos} alt={`ЖК «${project.name}»`} />
          ) : null}

          <div className={styles.aboutSection}>
            <div>
              <div className={styles.eyebrow}>О проекте</div>
              <p className={styles.concept}>{project.concept}</p>
            </div>
            {project.advantages.length ? (
              <div>
                <div className={styles.eyebrowFaint}>Преимущества</div>
                {project.advantages.map((a) => (
                  <div className={styles.advantage} key={a}>
                    {a}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {project.infrastructure.length ? (
            <div className={styles.infraSection}>
              <div className={styles.eyebrow}>Инфраструктура рядом</div>
              <InfraAccordion infrastructure={project.infrastructure} />
            </div>
          ) : null}

          {project.queues.length ? (
            <div className={styles.queuesSection}>
              <div className={styles.eyebrow}>Очереди и сроки</div>
              <QueuesTable queues={project.queues} />
            </div>
          ) : null}

          {apartments.length ? (
            <ApartmentsList
              apartments={apartments}
              projectSlug={project.slug}
              matkapSum={mortgageConfig.matkap_sum_default}
              rate={rateByLabel("льготн")}
            />
          ) : null}

          {basePrice > 0 ? (
            <div className={styles.queuesSection}>
              <div className={styles.paymentLayout}>
                <div>
                  <div className={styles.eyebrow}>Расчёт платежа</div>
                  <h2
                    style={{
                      fontWeight: 600,
                      letterSpacing: "-.03em",
                      lineHeight: 1.05,
                      fontSize: "clamp(26px,2.8vw,42px)",
                      margin: "0 0 18px",
                    }}
                  >
                    Ежемесячный платёж по трём сценариям
                  </h2>
                  <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
                    Расчёт для квартиры от {formatRub(basePrice)} ₽ на срок 20 лет. Точные условия подтверждает банк
                    — у нас свои менеджеры в 25+ банках.
                  </p>
                </div>
                <PaymentCalculator price={basePrice} scenarios={scenarios} />
              </div>
            </div>
          ) : null}

          <ProjectMap
            district={project.district}
            geoLat={project.geo_lat}
            geoLon={project.geo_lon}
            address={`${project.district ?? ""} ${project.name}`}
          />

          <SimilarProjects projects={similar} />
        </div>

        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Съездим в «{project.name}» вместе</h2>
            <p className={styles.ctaLead}>
              Покажем реальные квартиры и планировки, подскажем очередь под ваш бюджет. Подбор и сопровождение —
              бесплатно.
            </p>
            <ViewingCtaButton className={`tpl-btn-prim ${styles.ctaBtn}`} />
          </div>
        </section>

        <SiteFooter />
      </LightboxProvider>
      {minPriceApt ? (
        <ProjectStickyBar priceText={`${formatRub(minPriceApt.price_from)} ₽`} />
      ) : null}
    </div>
  );
}
