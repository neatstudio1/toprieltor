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
const BRANDED_TITLE_MAX = 70;
const BRAND_SUFFIX = ` | ${SITE_NAME}`;

/** «Заголовок | TOPиелтор», если вместе укладываются в 70 символов, иначе заголовок как есть. */
export function withBrand(title: string): string {
  if (title.includes(SITE_NAME)) return title;
  const branded = `${title}${BRAND_SUFFIX}`;
  return branded.length <= BRANDED_TITLE_MAX ? branded : title;
}

/**
 * Fills in canonical + OG/Twitter for a page from its title/description/path.
 * Pass plain page titles without the brand suffix: it is added by withBrand()
 * when it fits. `absoluteTitle: true` skips the suffix entirely.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  absoluteTitle,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const ogImage = image ?? "/hero-poster.webp";
  return {
    title: { absolute: absoluteTitle ? title : withBrand(title) },
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
