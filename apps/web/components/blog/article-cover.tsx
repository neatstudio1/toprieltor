import Image from "next/image";
import { strapiMediaUrl, type StrapiMedia } from "@/lib/cms/client";
import { PhotoPlaceholder } from "@/components/photo-placeholder";

export function ArticleCover({
  cover,
  alt,
  fallbackLabel,
  sizes,
}: {
  cover: StrapiMedia | null;
  alt: string;
  fallbackLabel: string;
  sizes: string;
}) {
  if (!cover) return <PhotoPlaceholder label={fallbackLabel} />;
  return (
    <Image src={strapiMediaUrl(cover)} alt={alt} fill sizes={sizes} style={{ objectFit: "cover" }} />
  );
}
