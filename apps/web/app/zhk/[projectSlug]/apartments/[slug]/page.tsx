import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllApartmentRouteParams,
  getApartmentBySlug,
  getMortgageConfig,
  getProjectApartmentsBrief,
  getSimilarApartments,
  pickRepresentativeSlugs,
} from "@/lib/cms/client";
import { formatRub } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LightboxProvider } from "@/components/apartment/lightbox-provider";
import { GalleryCarousel, type GalleryPhoto } from "@/components/apartment/gallery-carousel";
import { StickyInfoCard } from "@/components/apartment/sticky-info-card";
import { PlanSection } from "@/components/apartment/plan-section";
import { ProjectInfraSection } from "@/components/apartment/project-infra-section";
import { MortgageCalculator } from "@/components/apartment/mortgage-calculator";
import { SimilarApartments } from "@/components/apartment/similar-apartments";
import { FinalCta } from "@/components/apartment/final-cta";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { apartmentRealEstateListingSchema, breadcrumbListSchema } from "@/lib/json-ld";
import styles from "./page.module.css";

export const revalidate = 3600;

interface RouteParams {
  projectSlug: string;
  slug: string;
}

function typeShort(type: string): string {
  if (type === "студия") return "Студия";
  const match = type.match(/^(\d)к$/);
  return match ? `${match[1]}-комн.` : type;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  return getAllApartmentRouteParams();
}

async function loadApartment(params: RouteParams) {
  const apartment = await getApartmentBySlug(params.projectSlug, params.slug);
  if (!apartment || !apartment.project) return null;
  return apartment;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = await params;
  const apartment = await loadApartment(resolved);
  if (!apartment) return {};

  const areaLabel = apartment.area_m2.toFixed(2).replace(".", ",");
  const priceLabel = apartment.price_from
    ? ` — ${(apartment.price_from / 1_000_000).toFixed(2).replace(".", ",")} млн ₽`
    : "";
  const title = `${typeShort(apartment.type)} ${areaLabel} м² в ЖК ${apartment.project!.name}${priceLabel}`;
  const description = `${typeShort(apartment.type)}, ${areaLabel} м² в ЖК «${apartment.project!.name}» (${apartment.project!.district}). Цена от ${formatRub(apartment.price_from)} ₽. Подбор и сопровождение сделки бесплатно.`;
  const photo = apartment.photo_urls?.[0];

  // Only one apartment per room type stays indexable — the rest are near-identical
  // and were being dropped by Google as thin duplicates anyway (see
  // pickRepresentativeSlugs). `follow` keeps link equity flowing to the ЖК page.
  const siblings = await getProjectApartmentsBrief(resolved.projectSlug);
  const isIndexable = pickRepresentativeSlugs(siblings).has(resolved.slug);

  return {
    ...pageMetadata({
      title,
      description,
      path: `/zhk/${resolved.projectSlug}/apartments/${resolved.slug}`,
      image: photo,
    }),
    ...(isIndexable ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ApartmentPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const resolved = await params;
  const apartment = await loadApartment(resolved);
  if (!apartment) notFound();

  const project = apartment.project!;

  const [similar, mortgageConfig] = await Promise.all([
    getSimilarApartments(project.slug, apartment.slug, 3),
    getMortgageConfig(),
  ]);

  const galleryPhotos: GalleryPhoto[] = [
    ...apartment.photo_urls.map((src) => ({ src, kind: "Квартира" })),
    ...project.photos.map((src) => ({ src, kind: `ЖК «${project.name}»` })),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Каталог ЖК", path: "/catalog" },
          { name: project.name, path: `/zhk/${project.slug}` },
          {
            name: `${typeShort(apartment.type)} ${apartment.area_m2.toFixed(2).replace(".", ",")} м²`,
            path: `/zhk/${project.slug}/apartments/${apartment.slug}`,
          },
        ])}
      />
      <JsonLd data={apartmentRealEstateListingSchema(apartment, project)} />
      <SiteHeader cta="viewing" />
      <LightboxProvider>
        <div className={styles.container}>
          <Breadcrumbs
            projectName={project.name}
            projectSlug={project.slug}
            apartmentTitle={`${typeShort(apartment.type)} ${apartment.area_m2.toFixed(2).replace(".", ",")} м²`}
          />

          <div className={styles.topGrid}>
            {galleryPhotos.length > 0 ? (
              <GalleryCarousel photos={galleryPhotos} />
            ) : (
              <div />
            )}
            <StickyInfoCard apartment={apartment} />
          </div>

          <PlanSection apartment={apartment} />
          <ProjectInfraSection project={project} />
          <MortgageCalculator price={apartment.price_from} config={mortgageConfig} />
          <SimilarApartments apartments={similar} projectSlug={project.slug} />
        </div>

        <FinalCta />
      </LightboxProvider>
    </div>
  );
}
