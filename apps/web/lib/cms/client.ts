const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const REVALIDATE_SECONDS = 3600;

export interface Queue {
  number: number;
  building: string | null;
  delivery: string | null;
}

export interface Rate {
  label: string;
  rate: number;
  text: string;
}

export interface Developer {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  site_url: string | null;
}

export interface Project {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  url: string | null;
  district: string | null;
  geo_lat: number | null;
  geo_lon: number | null;
  concept: string | null;
  advantages: string[];
  infrastructure: string[];
  finish_types: string[];
  delivery_date: string | null;
  queues: Queue[];
  photos: string[];
  matkapital: boolean;
  developer?: Developer;
}

export interface Apartment {
  id: number;
  documentId: string;
  slug: string;
  type: string;
  area_m2: number;
  price_from: number;
  price_min: number;
  price_max: number;
  lots_count: number;
  floors: number[];
  finish: string | null;
  tags: string[];
  floor_plan_url: string | null;
  photo_urls: string[];
  type_corrected: boolean;
  project?: Project;
}

export interface MortgageConfig {
  rates: Rate[];
  matkap_sum_default: number;
  matkap_sum_family: number;
  loan_term_years: number;
  down_min: number;
  down_max: number;
  down_step: number;
}

export interface StrapiMedia {
  url: string;
  width: number;
  height: number;
  alternativeText: string | null;
}

/** Strapi media `url` is relative (e.g. `/uploads/x.jpg`) — resolve against the CMS origin. */
export function strapiMediaUrl(media: StrapiMedia): string {
  return media.url.startsWith("http") ? media.url : `${STRAPI_URL}${media.url}`;
}

export interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover: StrapiMedia | null;
  category: string | null;
  tags: string[];
  hashtags: string[];
  author_name: string | null;
  author_role: string | null;
  read_minutes: number | null;
  views: number | null;
  published_date: string;
  seo_title: string | null;
  seo_description: string | null;
}

export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface EcosystemStage {
  n: string;
  title: string;
  desc: string;
  fact: string;
}

export interface WhyFreeStep {
  n: string;
  title: string;
  desc: string;
}

export interface HowItWorksStep {
  n: string;
  tag: string;
  title: string;
  desc: string;
}

export interface TeamMember {
  role: string;
  name: string;
  exp: string;
  fact: string;
}

export interface MortgageScenario {
  label: string;
  payment: number;
  down: string;
  rate: string;
}

export interface HomeCase {
  tag: string;
  situation: string;
  r1label: string;
  r1: string;
  r2label: string;
  r2: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface HomePage {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_stats: HeroStat[];
  partners_developers: string[];
  partners_materials: string[];
  ecosystem_eyebrow: string;
  ecosystem_title: string;
  ecosystem_lead: string;
  stages: EcosystemStage[];
  why_free_title: string;
  why_free_steps: WhyFreeStep[];
  how_it_works_title: string;
  steps: HowItWorksStep[];
  team_title: string;
  team: TeamMember[];
  featured_project_slugs: string[];
  mortgage_title: string;
  mortgage_scenarios: MortgageScenario[];
  banks: string[];
  cases_title: string;
  cases: HomeCase[];
  faq_title: string;
  faq: FaqItem[];
}

interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: { page: number; pageCount: number; total: number } };
}

interface StrapiOneResponse<T> {
  data: T | null;
}

async function strapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Strapi GET ${path} -> HTTP ${res.status}`);
  }
  return res.json();
}

const APARTMENT_WITH_PROJECT_POPULATE =
  "populate[project][populate][0]=developer&populate[project][populate][1]=queues";

export async function getApartmentBySlug(
  projectSlug: string,
  slug: string,
): Promise<Apartment | null> {
  const qs = new URLSearchParams();
  qs.set("filters[project][slug][$eq]", projectSlug);
  qs.set("filters[slug][$eq]", slug);
  const body = await strapiGet<StrapiListResponse<Apartment>>(
    `/apartments?${qs.toString()}&${APARTMENT_WITH_PROJECT_POPULATE}`,
  );
  return body.data[0] ?? null;
}

export async function getSimilarApartments(
  projectSlug: string,
  excludeSlug: string,
  limit = 3,
): Promise<Apartment[]> {
  const qs = new URLSearchParams();
  qs.set("filters[project][slug][$eq]", projectSlug);
  qs.set("filters[slug][$ne]", excludeSlug);
  qs.set("pagination[limit]", String(limit));
  const body = await strapiGet<StrapiListResponse<Apartment>>(
    `/apartments?${qs.toString()}`,
  );
  return body.data;
}

export async function getMortgageConfig(): Promise<MortgageConfig> {
  const body = await strapiGet<StrapiOneResponse<MortgageConfig>>(
    "/mortgage-config?populate=rates",
  );
  if (!body.data) throw new Error("mortgage-config не найден в Strapi");
  return body.data;
}

export interface ApartmentRouteParams {
  projectSlug: string;
  slug: string;
}

export async function getAllApartmentRouteParams(): Promise<
  ApartmentRouteParams[]
> {
  const pageSize = 100;
  let page = 1;
  const params: ApartmentRouteParams[] = [];

  while (true) {
    const qs = new URLSearchParams();
    qs.set("fields[0]", "slug");
    qs.set("populate[project][fields][0]", "slug");
    qs.set("pagination[page]", String(page));
    qs.set("pagination[pageSize]", String(pageSize));
    const body = await strapiGet<StrapiListResponse<Apartment>>(
      `/apartments?${qs.toString()}`,
    );
    for (const apt of body.data) {
      if (apt.project?.slug) {
        params.push({ projectSlug: apt.project.slug, slug: apt.slug });
      }
    }
    if (page >= body.meta.pagination.pageCount) break;
    page += 1;
  }

  return params;
}

async function fetchAllPages<T>(
  path: string,
  buildQuery: (page: number) => URLSearchParams,
): Promise<T[]> {
  const pageSize = 100;
  let page = 1;
  const items: T[] = [];
  while (true) {
    const qs = buildQuery(page);
    qs.set("pagination[page]", String(page));
    qs.set("pagination[pageSize]", String(pageSize));
    const body = await strapiGet<StrapiListResponse<T>>(`${path}?${qs.toString()}`);
    items.push(...body.data);
    if (page >= body.meta.pagination.pageCount) break;
    page += 1;
  }
  return items;
}

// ───────────────────────── catalog ─────────────────────────

export interface CatalogCard {
  slug: string;
  name: string;
  developerName: string;
  district: string | null;
  termYear: number | null;
  priceFrom: number | null;
  areaFromM2: number | null;
  roomTypes: string[];
  photo: string | null;
  matkapital: boolean;
}

function extractYear(deliveryDate: string | null): number | null {
  const match = deliveryDate?.match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}

export async function getCatalogCards(): Promise<CatalogCard[]> {
  const projects = await fetchAllPages<Project>("/projects", () => {
    const qs = new URLSearchParams();
    qs.set("fields[0]", "slug");
    qs.set("fields[1]", "name");
    qs.set("fields[2]", "district");
    qs.set("fields[3]", "delivery_date");
    qs.set("fields[4]", "photos");
    qs.set("fields[5]", "matkapital");
    qs.set("populate[developer][fields][0]", "name");
    return qs;
  });

  const apartments = await fetchAllPages<Apartment>("/apartments", () => {
    const qs = new URLSearchParams();
    qs.set("fields[0]", "type");
    qs.set("fields[1]", "area_m2");
    qs.set("fields[2]", "price_from");
    qs.set("populate[project][fields][0]", "slug");
    return qs;
  });

  const byProject = new Map<
    string,
    { minPrice: number; minArea: number; roomTypes: Set<string> }
  >();
  for (const apt of apartments) {
    const slug = apt.project?.slug;
    if (!slug) continue;
    const agg = byProject.get(slug) ?? {
      minPrice: Infinity,
      minArea: Infinity,
      roomTypes: new Set<string>(),
    };
    // price_from/area_m2 are 0 (not null) on ~20% of parsed listings where the
    // source site didn't publish a value — treat 0 as "unknown", not as the minimum.
    if (apt.price_from) agg.minPrice = Math.min(agg.minPrice, apt.price_from);
    if (apt.area_m2) agg.minArea = Math.min(agg.minArea, apt.area_m2);
    agg.roomTypes.add(apt.type);
    byProject.set(slug, agg);
  }

  return projects.map((p) => {
    const agg = byProject.get(p.slug);
    return {
      slug: p.slug,
      name: p.name,
      developerName: p.developer?.name ?? "",
      district: p.district,
      termYear: extractYear(p.delivery_date),
      priceFrom: agg && Number.isFinite(agg.minPrice) ? agg.minPrice : null,
      areaFromM2: agg && Number.isFinite(agg.minArea) ? agg.minArea : null,
      roomTypes: agg ? Array.from(agg.roomTypes) : [],
      photo: p.photos?.[0] ?? null,
      matkapital: p.matkapital,
    };
  });
}

const PROJECT_FULL_POPULATE = "populate[developer]=true&populate[queues]=true";

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const qs = new URLSearchParams();
  qs.set("filters[slug][$eq]", slug);
  const body = await strapiGet<StrapiListResponse<Project>>(
    `/projects?${qs.toString()}&${PROJECT_FULL_POPULATE}`,
  );
  return body.data[0] ?? null;
}

export async function getApartmentsByProjectSlug(
  projectSlug: string,
): Promise<Apartment[]> {
  return fetchAllPages<Apartment>("/apartments", () => {
    const qs = new URLSearchParams();
    qs.set("filters[project][slug][$eq]", projectSlug);
    return qs;
  });
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const projects = await fetchAllPages<Project>("/projects", () => {
    const qs = new URLSearchParams();
    qs.set("fields[0]", "slug");
    return qs;
  });
  return projects.map((p) => p.slug);
}

export async function getSimilarProjects(
  excludeSlug: string,
  limit = 3,
): Promise<Project[]> {
  const qs = new URLSearchParams();
  qs.set("filters[slug][$ne]", excludeSlug);
  qs.set("pagination[limit]", String(limit));
  qs.set("fields[0]", "slug");
  qs.set("fields[1]", "name");
  qs.set("fields[2]", "district");
  qs.set("fields[3]", "delivery_date");
  qs.set("fields[4]", "photos");
  const body = await strapiGet<StrapiListResponse<Project>>(
    `/projects?${qs.toString()}`,
  );
  return body.data;
}

// ───────────────────────── home page ─────────────────────────

export async function getHomePage(): Promise<HomePage> {
  const body = await strapiGet<StrapiOneResponse<HomePage>>("/home-page");
  if (!body.data) throw new Error("home-page не найден в Strapi");
  return body.data;
}

export async function getProjectsBySlugsMap(
  slugs: string[],
): Promise<Map<string, Project>> {
  if (!slugs.length) return new Map();
  const qs = new URLSearchParams();
  slugs.forEach((slug, i) => qs.set(`filters[slug][$in][${i}]`, slug));
  qs.set("populate[developer][fields][0]", "name");
  const body = await strapiGet<StrapiListResponse<Project>>(
    `/projects?${qs.toString()}`,
  );
  return new Map(body.data.map((p) => [p.slug, p]));
}

export async function getCheapestApartmentByProjectSlug(
  projectSlug: string,
): Promise<Apartment | null> {
  const qs = new URLSearchParams();
  qs.set("filters[project][slug][$eq]", projectSlug);
  // Exclude listings where the source site didn't publish a price (stored as 0, not null).
  qs.set("filters[price_from][$gt]", "0");
  qs.set("sort", "price_from:asc");
  qs.set("pagination[limit]", "1");
  const body = await strapiGet<StrapiListResponse<Apartment>>(
    `/apartments?${qs.toString()}`,
  );
  return body.data[0] ?? null;
}

// ───────────────────────── blog ─────────────────────────

export async function getArticles(): Promise<Article[]> {
  const qs = new URLSearchParams();
  qs.set("sort", "published_date:desc");
  qs.set("pagination[limit]", "100");
  qs.set("populate", "cover");
  const body = await strapiGet<StrapiListResponse<Article>>(
    `/articles?${qs.toString()}`,
  );
  return body.data;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const qs = new URLSearchParams();
  qs.set("filters[slug][$eq]", slug);
  qs.set("populate", "cover");
  const body = await strapiGet<StrapiListResponse<Article>>(
    `/articles?${qs.toString()}`,
  );
  return body.data[0] ?? null;
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const qs = new URLSearchParams();
  qs.set("fields[0]", "slug");
  qs.set("pagination[limit]", "100");
  const body = await strapiGet<StrapiListResponse<Article>>(
    `/articles?${qs.toString()}`,
  );
  return body.data.map((a) => a.slug);
}
