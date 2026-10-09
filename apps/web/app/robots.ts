import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// YandexAdditionalBot собирает ответы для Алисы и Нейро, OAI-SearchBot и
// ChatGPT-User — поиск ChatGPT; без явного правила часть из них ведёт себя
// осторожнее, чем с общим «*».
const AI_BOTS = [
  "YandexAdditionalBot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      {
        userAgent: "YandexBot",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/api"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
