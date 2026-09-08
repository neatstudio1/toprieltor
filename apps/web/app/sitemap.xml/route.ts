import { SITE_URL } from "@/lib/site";
import { SITEMAP_HEADERS, sitemapIndexXml } from "@/lib/sitemap-xml";

export const revalidate = 3600;

/**
 * Sitemap index. Key pages live in their own file so they are processed
 * independently of the apartment listings, instead of competing with them for
 * crawl budget inside one 2790-URL sitemap.
 */
export function GET() {
  const body = sitemapIndexXml(SITE_URL, ["/sitemap-pages.xml", "/sitemap-apartments.xml"]);
  return new Response(body, { headers: SITEMAP_HEADERS });
}
