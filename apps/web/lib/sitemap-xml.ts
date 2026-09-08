export interface SitemapUrl {
  path: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function urlsetXml(siteUrl: string, urls: SitemapUrl[]): string {
  const entries = urls
    .map(({ path, changeFrequency, priority }) => {
      const lines = [`    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>`];
      if (changeFrequency) lines.push(`    <changefreq>${changeFrequency}</changefreq>`);
      if (priority !== undefined) lines.push(`    <priority>${priority.toFixed(1)}</priority>`);
      return `  <url>\n${lines.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function sitemapIndexXml(siteUrl: string, paths: string[]): string {
  const entries = paths
    .map((path) => `  <sitemap>\n    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>\n  </sitemap>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
}

export const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
} as const;
