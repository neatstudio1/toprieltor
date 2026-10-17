import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");
export const SITE_NAME = "TOPиелтор";
export const TELEGRAM_URL = "https://t.me/haianajaj";
export const TELEGRAM_HANDLE = "@haianajaj";

/** Контакты агентства. Единственное место, где они заданы — правки только здесь. */
export const PHONE_DISPLAY = "+7 919 394-21-81";
export const PHONE_TEL = "+79193942181";
/** MAX принимает тот же номер, отдельного идентификатора у мессенджера нет. */
export const MAX_DISPLAY = PHONE_DISPLAY;
export const MANAGER_NAME = "Сергей";
export const AGENT_NAME = "Яна Чекулова";
export const AGENT_ROLE = "сооснователь агентства";
export const AGENT_PHOTO = "/yana-chekulova.webp";
/** 400px-вариант — для аватарки в списке, чтобы не тянуть портрет целиком. */
export const AGENT_PHOTO_SM = "/yana-chekulova-sm.webp";

/** До этой длины Яндекс показывает title целиком — бренд дописываем, только если влезает. */
/**
 * Fills in canonical + OG/Twitter for a page from its title/description/path.
 * Title идёт как есть, без « | TOPиелтор»: во второй версии согласованной
 * таблицы (2026-10-15) бренд из заголовков убран — место отдано под суть
 * страницы и коммерческий запрос. `absoluteTitle` оставлен для совместимости.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const ogImage = image ?? "/hero-poster.webp";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
