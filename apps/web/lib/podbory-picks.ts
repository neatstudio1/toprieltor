/**
 * Подборка для /lp/podbory: по вкладке «тип квартиры» берём самую дешёвую
 * квартиру в каждом из трёх разных ЖК. Цены и планировки — только из базы.
 */

import type { PickFeedApartment } from "@/lib/cms/client";
import { deliveryYear, isDeliveredOrDue } from "@/lib/delivery";

/** Ниже этой цены в базе стоит мусор (парсер не нашёл цену и записал обрезок). */
const MIN_SANE_PRICE = 1_500_000;
const CARDS_PER_TAB = 3;

const TABS = [
  { id: "studio", title: "Студии", types: ["студия"] },
  { id: "1k", title: "1-комнатные", types: ["1к"] },
  { id: "2k", title: "2-комнатные", types: ["2к"] },
  { id: "3k", title: "3 и больше", types: ["3к", "4к", "5к"] },
] as const;

export interface PickCard {
  id: string;
  price: number;
  typeLabel: string;
  area: number;
  projectName: string;
  district: string | null;
  planUrl: string | null;
  delivery: string;
  finish: string;
}

export interface PickTab {
  id: string;
  title: string;
  /** Самая низкая цена на вкладке: стартовое значение калькулятора, пока карточку не выбрали. */
  minPrice: number;
  cards: PickCard[];
}

const TYPE_LABEL: Record<string, string> = {
  студия: "Студия",
  "1к": "1-комнатная",
  "2к": "2-комнатная",
  "3к": "3-комнатная",
  "4к": "4-комнатная",
  "5к": "5-комнатная",
};

function finishLabel(finish: string | null): string {
  if (!finish) return "";
  if (/предчистов/i.test(finish)) return "предчистовая отделка";
  if (/чистов/i.test(finish)) return "чистовая отделка";
  return "";
}

function deliveryLabel(project: NonNullable<PickFeedApartment["project"]>): string {
  const texts = project.queues?.length ? project.queues.map((q) => q.delivery) : [project.delivery_date];
  if (texts.length && texts.every((t) => isDeliveredOrDue(t))) return "дом сдан";
  const years = texts
    .filter((t) => !isDeliveredOrDue(t))
    .map((t) => deliveryYear(t))
    .filter((y): y is number => y !== null);
  return years.length ? `сдача ${Math.min(...years)}` : "";
}

export function buildPickTabs(feed: PickFeedApartment[]): PickTab[] {
  const tabs: PickTab[] = [];
  for (const tab of TABS) {
    const rows = feed
      .filter((a) => (tab.types as readonly string[]).includes(a.type))
      .filter((a) => a.project && a.price_from >= MIN_SANE_PRICE && a.area_m2 > 0)
      .sort((a, b) => a.price_from - b.price_from);

    const seen = new Set<string>();
    const cards: PickCard[] = [];
    for (const apt of rows) {
      const project = apt.project!;
      if (seen.has(project.slug)) continue;
      seen.add(project.slug);
      cards.push({
        id: `${project.slug}/${apt.slug}`,
        price: apt.price_from,
        typeLabel: TYPE_LABEL[apt.type] ?? apt.type,
        area: Math.round(apt.area_m2 * 10) / 10,
        projectName: project.name,
        district: project.district,
        planUrl: apt.floor_plan_url,
        delivery: deliveryLabel(project),
        finish: finishLabel(apt.finish),
      });
      if (cards.length === CARDS_PER_TAB) break;
    }
    if (cards.length) tabs.push({ id: tab.id, title: tab.title, minPrice: cards[0].price, cards });
  }
  return tabs;
}
