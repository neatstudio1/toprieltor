import {
  getAllArticleSlugs,
  getAllProjectSlugs,
  getDistricts,
  getEnrichedDevelopers,
  getServices,
} from "@/lib/cms/client";
import { SITE_URL } from "@/lib/site";
import { SITEMAP_HEADERS, urlsetXml, type SitemapUrl } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  const [projectSlugs, articleSlugs, services, districts, developers] = await Promise.all([
    getAllProjectSlugs(),
    getAllArticleSlugs(),
    getServices(),
    getDistricts(),
    getEnrichedDevelopers(),
  ]);

  const urls: SitemapUrl[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/catalog", changeFrequency: "daily", priority: 0.9 },
    { path: "/quiz", changeFrequency: "monthly", priority: 0.8 },
    { path: "/blog", changeFrequency: "daily", priority: 0.7 },
    { path: "/uslugi", changeFrequency: "monthly", priority: 0.8 },
    { path: "/rayon", changeFrequency: "monthly", priority: 0.7 },
    { path: "/zastroyshchik", changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.1 },
    ...services.map((s) => ({
      path: `/uslugi/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...districts.map((d) => ({
      path: `/rayon/${d.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...developers.map((d) => ({
      path: `/zastroyshchik/${d.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...projectSlugs.map((slug) => ({
      path: `/zhk/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...articleSlugs.map((slug) => ({
      path: `/blog/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return new Response(urlsetXml(SITE_URL, urls), { headers: SITEMAP_HEADERS });
}
