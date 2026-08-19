import { strapiMediaUrl, type Apartment, type Article, type FaqItem, type Project } from "@/lib/cms/client";
import { SITE_NAME, SITE_URL, TELEGRAM_URL } from "@/lib/site";

export function realEstateAgentSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: `${SITE_NAME} — Яна Чекулова`,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/hero-poster.webp`,
    areaServed: { "@type": "City", name: "Екатеринбург" },
    sameAs: [TELEGRAM_URL],
  };
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export function breadcrumbListSchema(entries: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: `${SITE_URL}${entry.path}`,
    })),
  };
}

export function catalogItemListSchema(
  items: { slug: string; name: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}/zhk/${item.slug}`,
    })),
  };
}

export function projectRealEstateListingSchema(
  project: Project,
  priceFrom: number | null,
) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `ЖК «${project.name}»`,
    url: `${SITE_URL}/zhk/${project.slug}`,
    description: project.concept ?? undefined,
    image: project.photos?.[0],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Екатеринбург",
      addressRegion: "Свердловская область",
      addressCountry: "RU",
      ...(project.district ? { streetAddress: project.district } : {}),
    },
    ...(project.geo_lat != null && project.geo_lon != null
      ? { geo: { "@type": "GeoCoordinates", latitude: project.geo_lat, longitude: project.geo_lon } }
      : {}),
    ...(priceFrom
      ? { offers: { "@type": "Offer", price: priceFrom, priceCurrency: "RUB", availability: "https://schema.org/InStock" } }
      : {}),
  };
}

export function apartmentRealEstateListingSchema(
  apartment: Apartment,
  project: Project,
) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${apartment.type} · ${apartment.area_m2} м² в ЖК «${project.name}»`,
    url: `${SITE_URL}/zhk/${project.slug}/apartments/${apartment.slug}`,
    description: `${apartment.type}, ${apartment.area_m2} м² в ЖК «${project.name}»`,
    image: apartment.photo_urls?.[0],
    floorSize: { "@type": "QuantitativeValue", value: apartment.area_m2, unitCode: "MTK" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Екатеринбург",
      addressRegion: "Свердловская область",
      addressCountry: "RU",
      ...(project.district ? { streetAddress: project.district } : {}),
    },
    ...(project.geo_lat != null && project.geo_lon != null
      ? { geo: { "@type": "GeoCoordinates", latitude: project.geo_lat, longitude: project.geo_lon } }
      : {}),
    ...(apartment.price_from
      ? {
          offers: {
            "@type": "Offer",
            price: apartment.price_from,
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function articleSchema(article: Article, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.cover ? strapiMediaUrl(article.cover) : undefined,
    datePublished: article.published_date,
    author: { "@type": "Person", name: article.author_name ?? SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}${path}`,
  };
}

export function faqPageSchema(faq: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
