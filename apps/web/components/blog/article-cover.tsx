import Image from "next/image";
import { strapiMediaUrl, type StrapiMedia } from "@/lib/cms/client";

/** Сгенерированная обложка (app/blog/[slug]/cover) — для статей без своей картинки. */
export function generatedCoverPath(slug: string): string {
  return `/blog/${slug}/cover`;
}

export function ArticleCover({
  slug,
  cover,
  alt,
  sizes,
}: {
  slug: string;
  cover: StrapiMedia | null;
  alt: string;
  /** Не используется с появлением сгенерированных обложек; оставлен для совместимости вызовов. */
  fallbackLabel?: string;
  sizes: string;
}) {
  if (!cover) {
    // PNG уже нужного размера и отдаётся с кешем — пережимать через оптимизатор незачем.
    return <Image src={generatedCoverPath(slug)} alt={alt} fill sizes={sizes} unoptimized style={{ objectFit: "cover" }} />;
  }
  return (
    <Image src={strapiMediaUrl(cover)} alt={alt} fill sizes={sizes} style={{ objectFit: "cover" }} />
  );
}
