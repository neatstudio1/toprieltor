import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");
export const SITE_NAME = "TOPиелтор";
export const TELEGRAM_URL = "https://t.me/Yana_Chekulova";
export const TELEGRAM_HANDLE = "@Yana_Chekulova";

/**
 * Fills in canonical + OG/Twitter for a page from its title/description/path.
 * `title` is run through the root layout's "%s | TOPиелтор" template — pass
 * plain page titles without the brand suffix. Set `absoluteTitle: true` only
 * when the title should bypass the template (e.g. it already reads naturally
 * with the brand name baked in, like the home page's own title).
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
    title: absoluteTitle ? { absolute: title } : title,
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
