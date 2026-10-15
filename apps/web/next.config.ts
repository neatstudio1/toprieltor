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
    // CSS у нас мелкий (15–25 КБ на страницу), а отдельными файлами это 2–4
    // запроса, блокирующих отрисовку: Lighthouse насчитывал 0,7–1,4 с задержки
    // на мобильном. Встроенный в HTML он приходит вместе с первым ответом.
    inlineCss: true,
  },
  async headers() {
    // Файлы из public/ Next отдаёт с max-age=0 — браузер перепроверяет их на
    // каждом заходе, в том числе 1,4 МБ ролика. Имена у них без хеша, поэтому
    // не immutable, а неделя: замена файла доедет до всех максимум за 7 дней.
    return [
      {
        source: "/:file(hero\\.mp4|hero-poster\\.webp|yana-chekulova\\.webp|yana-chekulova-sm\\.webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      // Только папки с картинками: /lp/[variant] — это страницы лендингов, им кеш на неделю нельзя.
      {
        source: "/lp/:dir(clients|docs)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
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
    // Фото ЖК лежат на сайтах застройщиков, и те не отдают кеш-заголовков —
    // тогда Next пережимает картинку заново раз в 4 часа (значение по
    // умолчанию). Каждое такое пережатие — поход на чужой сервер плюс sharp:
    // в замерах карточки каталога и квартир грузились по 6–9 с. Фото ЖК
    // меняются редко, а новое фото придёт с новым адресом.
    minimumCacheTTL: 60 * 60 * 24 * 30,
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
