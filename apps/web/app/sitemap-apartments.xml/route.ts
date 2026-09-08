import { getIndexableApartmentRouteParams } from "@/lib/cms/client";
import { SITE_URL } from "@/lib/site";
import { SITEMAP_HEADERS, urlsetXml } from "@/lib/sitemap-xml";

export const revalidate = 3600;

/**
 * Only one apartment per room type per project — see pickRepresentativeSlugs.
 * The rest are reachable on the site but marked noindex, so they no longer eat
 * the crawl budget that should go to the pages that bring leads.
 */
export async function GET() {
  const params = await getIndexableApartmentRouteParams();

  const urls = params.map((p) => ({
    path: `/zhk/${p.projectSlug}/apartments/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return new Response(urlsetXml(SITE_URL, urls), { headers: SITEMAP_HEADERS });
}
