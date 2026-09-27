import { redirect } from "next/navigation";
import { districtBySlug } from "@/lib/districts";

export const revalidate = 3600;

/**
 * Промежуточный сегмент существует только в адресах вида
 * /catalog/botanicheskiy/2k — отдельной страницы под него мы намеренно не
 * заводим: гид по району уже живёт на /rayon/[slug], а дублирующий список
 * ссылок — ровно тот тип «малоценной страницы», который Яндекс сейчас
 * выбрасывает из индекса. Поэтому просто уводим на осмысленный адрес.
 */
export default async function DistrictRedirect({
  params,
}: {
  params: Promise<{ districtSlug: string }>;
}) {
  const { districtSlug } = await params;
  const district = districtBySlug(districtSlug);
  redirect(district?.hasGuide ? `/rayon/${district.slug}` : "/catalog");
}
