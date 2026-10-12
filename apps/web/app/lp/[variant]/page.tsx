import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMinPriceByType, getMortgageConfig } from "@/lib/cms/client";
import {
  LANDING_SLUGS,
  buildPriceCards,
  heroAccent,
  landingVariant,
} from "@/lib/landings";
import { LandingPage } from "@/components/lp/landing-page";

interface PageProps {
  params: Promise<{ variant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return LANDING_SLUGS.map((variant) => ({ variant }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { variant: slug } = await params;
  const { type } = await searchParams;
  const variant = landingVariant(slug, type);
  if (!variant) return {};
  return {
    title: { absolute: variant.meta.title },
    description: variant.meta.description,
    robots: { index: false, follow: true },
  };
}

export default async function LandingRoute({ params, searchParams }: PageProps) {
  const { variant: slug } = await params;
  const { type } = await searchParams;
  const variant = landingVariant(slug, type);
  if (!variant) notFound();

  const [minByType, mortgage] = await Promise.all([getMinPriceByType(), getMortgageConfig()]);
  const rate =
    mortgage.rates.find((r) => r.label.toLowerCase().includes("льготн"))?.rate ?? mortgage.rates[0]?.rate ?? 0.06;

  return (
    <LandingPage
      variant={variant}
      heroAccent={heroAccent(variant, minByType)}
      prices={buildPriceCards(minByType, rate)}
    />
  );
}
