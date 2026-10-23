import type { Metadata } from "next";
import { getMortgageConfig, getPickFeed } from "@/lib/cms/client";
import { resolvePodbory } from "@/lib/podbory";
import { buildPickTabs } from "@/lib/podbory-picks";
import { PodboryPage } from "@/components/lp/podbory/podbory-page";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const content = resolvePodbory(await searchParams);
  return {
    title: { absolute: content.title },
    description: content.description,
    robots: { index: false, follow: true },
  };
}

export default async function PodboryRoute({ searchParams }: PageProps) {
  const content = resolvePodbory(await searchParams);
  const [feed, mortgage] = await Promise.all([getPickFeed(), getMortgageConfig()]);

  return <PodboryPage content={content} tabs={buildPickTabs(feed)} mortgage={mortgage} />;
}
