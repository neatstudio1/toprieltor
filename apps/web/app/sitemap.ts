import type { MetadataRoute } from "next";
import { getAllApartmentRouteParams, getAllArticleSlugs, getAllProjectSlugs } from "@/lib/cms/client";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projectSlugs, apartmentParams, articleSlugs] = await Promise.all([
    getAllProjectSlugs(),
    getAllApartmentRouteParams(),
    getAllArticleSlugs(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/quiz`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const projectEntries: MetadataRoute.Sitemap = projectSlugs.map((slug) => ({
    url: `${SITE_URL}/zhk/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const apartmentEntries: MetadataRoute.Sitemap = apartmentParams.map((p) => ({
    url: `${SITE_URL}/zhk/${p.projectSlug}/apartments/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articleEntries: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...projectEntries, ...apartmentEntries, ...articleEntries];
}
