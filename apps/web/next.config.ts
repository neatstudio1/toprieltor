import type { NextConfig } from "next";
import { MERGED_ARTICLES } from "./lib/article-redirects";

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const strapiUrl = new URL(STRAPI_URL);
const isLocalStrapi = ["localhost", "127.0.0.1", "::1"].includes(strapiUrl.hostname);

const DEVELOPER_IMAGE_HOSTS = [
  "backend.astondom.ru",
  "akademicheskiy.org",
  "astra-development.ru",
  "s3.timeweb.cloud",
  "atlas.allio.agency",
  "api.atomstroy.net",
  "cdn.brusnika.ru",
  "www.scm-d.ru",
  "images.unsplash.com",
];

const nextConfig: NextConfig = {
  // Strapi на проде однопоточный, а генерация статики запускает воркер на ядро.
  // На восьми ядрах он отвечает таймаутами и сборка падает в середине — поэтому
  // ограничиваем параллелизм. Сборка идёт дольше, но доходит до конца.
  experimental: {
    cpus: 2,
  },
  async redirects() {
    return Object.entries(MERGED_ARTICLES).map(([from, to]) => ({
      source: `/blog/${from}`,
      destination: `/blog/${to}`,
      // permanent: true даёт 308, а Яндекс склейку надёжно делает по 301.
      statusCode: 301 as const,
    }));
  },
  images: {
    // Strapi runs on localhost in dev — the private-IP SSRF guard only needs
    // bypassing there; a real deployment points STRAPI_URL at a public host.
    ...(isLocalStrapi ? { dangerouslyAllowLocalIP: true } : {}),
    remotePatterns: [
      ...DEVELOPER_IMAGE_HOSTS.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      {
        protocol: strapiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: strapiUrl.hostname,
        port: strapiUrl.port || undefined,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
