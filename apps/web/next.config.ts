import type { NextConfig } from "next";

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
