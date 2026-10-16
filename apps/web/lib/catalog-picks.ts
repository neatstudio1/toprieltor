import { cache } from "react";
import {
  getAllApartmentsWithProject,
  getCatalogCards,
  type ApartmentWithProject,
  type CatalogCard,
} from "@/lib/cms/client";
import {
  DISTRICTS,
  MIN_APARTMENTS_FOR_LANDING,
  MIN_PROJECTS_FOR_LANDING,
  ROOM_TYPES,
  districtBySlug,
  normalizeDistrict,
  roomTypeBySlug,
  type District,
  type RoomType,
} from "@/lib/districts";

/**
 * Подборки каталога — отдельные адреса под фильтры:
 *   /catalog/akademicheskiy      район
 *   /catalog/1k                  комнатность по всему городу
 *   /catalog/akademicheskiy/1k   район × комнатность
 *   /catalog/s-otdelkoy          с чистовой или предчистовой отделкой
 *   /catalog/sdannye             в домах, сданных или с прошедшим сроком сдачи
 *
 * Фильтры каталога живут в состоянии клиентского компонента, своего URL у них
 * нет, и запросам вида «1-комнатная в Академическом» садиться было некуда.
 * Страница создаётся только при MIN_APARTMENTS_FOR_LANDING квартир и
 * MIN_PROJECTS_FOR_LANDING ЖК — с живыми данными подборка сама появляется
 * и исчезает (ниже порога — редирект на уровень выше).
 */

export type PickFlag = "s-otdelkoy" | "sdannye";

export const PICK_FLAGS: { slug: PickFlag; label: string }[] = [
  { slug: "s-otdelkoy", label: "С отделкой" },
  { slug: "sdannye", label: "Дом сдан" },
];

export type PickKind = "district" | "room" | "districtRoom" | "flag";

export interface CatalogPick {
  kind: PickKind;
  path: string;
  district: District | null;
  roomType: RoomType | null;
  flag: PickFlag | null;
  count: number;
  priceMin: number;
  priceMax: number;
  areaMin: number;
  areaMax: number;
  /** Медианная цена квадратного метра по срезу. */
  pricePerM2: number;
  /** Квартир с чистовой отделкой (остальные с отделкой — предчистовая). */
  cleanFinishCount: number;
  /** Слаги ЖК в подборке, от дешёвого к дорогому. */
  projectSlugs: string[];
  indexable: boolean;
}

/** Ниже этой цены в базе стоит мусор (парсер не нашёл цену и записал обрезок). */
const MIN_SANE_PRICE = 1_500_000;

/** В базе только «Чистовая» / «Предчистовая» (с «отделка» или без) либо пусто. */
export function hasFinish(finish: string | null | undefined): boolean {
  return Boolean(finish && !/без|черн/i.test(finish));
}

function isCleanFinish(finish: string | null | undefined): boolean {
  return Boolean(finish && /^\s*чистов/i.test(finish));
}

export function pickPath(parts: {
  district?: District | null;
  roomType?: RoomType | null;
  flag?: PickFlag | null;
}): string {
  const segments = [parts.district?.slug, parts.roomType?.slug, parts.flag].filter(Boolean);
  return `/catalog/${segments.join("/")}`;
}

interface Row {
  apt: ApartmentWithProject;
  projectSlug: string;
  district: District | null;
  roomType: RoomType | null;
  card: CatalogCard;
}

function summarize(
  kind: PickKind,
  rows: Row[],
  parts: { district?: District; roomType?: RoomType; flag?: PickFlag },
): CatalogPick | null {
  if (!rows.length) return null;
  const prices = rows.map((r) => r.apt.price_from);
  const areas = rows.map((r) => r.apt.area_m2).filter((a) => a > 0);
  // Медиана, а не min/max: делить самую дешёвую цену на самую большую площадь
  // дало бы метр, которого нет ни в одной реальной квартире.
  const perM2 = rows
    .filter((r) => r.apt.area_m2 > 0)
    .map((r) => r.apt.price_from / r.apt.area_m2)
    .sort((x, y) => x - y);
  const cheapestByProject = new Map<string, number>();
  for (const r of rows) {
    const current = cheapestByProject.get(r.projectSlug);
    if (current === undefined || r.apt.price_from < current) cheapestByProject.set(r.projectSlug, r.apt.price_from);
  }
  const projectSlugs = Array.from(cheapestByProject.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([slug]) => slug);
  return {
    kind,
    path: pickPath(parts),
    district: parts.district ?? null,
    roomType: parts.roomType ?? null,
    flag: parts.flag ?? null,
    count: rows.length,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    areaMin: areas.length ? Math.min(...areas) : 0,
    areaMax: areas.length ? Math.max(...areas) : 0,
    pricePerM2: perM2.length ? perM2[Math.floor(perM2.length / 2)] : 0,
    cleanFinishCount: rows.filter((r) => isCleanFinish(r.apt.finish)).length,
    projectSlugs,
    indexable: rows.length >= MIN_APARTMENTS_FOR_LANDING && projectSlugs.length >= MIN_PROJECTS_FOR_LANDING,
  };
}

/** Все подборки, включая те, что не дотягивают до порога. Один проход по базе на запрос. */
export const getCatalogPicks = cache(async (): Promise<CatalogPick[]> => {
  const [apartments, cards] = await Promise.all([getAllApartmentsWithProject(), getCatalogCards()]);
  const cardBySlug = new Map(cards.map((c) => [c.slug, c]));

  const rows: Row[] = [];
  for (const apt of apartments) {
    const projectSlug = apt.project?.slug;
    const card = projectSlug ? cardBySlug.get(projectSlug) : undefined;
    if (!projectSlug || !card || !apt.price_from || apt.price_from < MIN_SANE_PRICE) continue;
    rows.push({
      apt,
      projectSlug,
      card,
      district: normalizeDistrict(card.district),
      roomType: ROOM_TYPES.find((t) => t.value === apt.type) ?? null,
    });
  }

  const picks: (CatalogPick | null)[] = [];
  for (const district of DISTRICTS) {
    const inDistrict = rows.filter((r) => r.district === district);
    picks.push(summarize("district", inDistrict, { district }));
    for (const roomType of ROOM_TYPES) {
      picks.push(summarize("districtRoom", inDistrict.filter((r) => r.roomType === roomType), { district, roomType }));
    }
  }
  for (const roomType of ROOM_TYPES) {
    picks.push(summarize("room", rows.filter((r) => r.roomType === roomType), { roomType }));
  }
  picks.push(summarize("flag", rows.filter((r) => hasFinish(r.apt.finish)), { flag: "s-otdelkoy" }));
  picks.push(summarize("flag", rows.filter((r) => r.card.allDelivered), { flag: "sdannye" }));

  return picks.filter((p): p is CatalogPick => p !== null);
});

export async function getIndexablePicks(): Promise<CatalogPick[]> {
  return (await getCatalogPicks()).filter((p) => p.indexable);
}

export type PickResolution =
  | { type: "page"; pick: CatalogPick }
  | { type: "redirect"; to: string }
  | { type: "notFound" };

/** Адрес → подборка; ниже порога — куда уводить, мусорный адрес — 404. */
export async function resolvePick(segments: string[]): Promise<PickResolution> {
  const parsed = parseSegments(segments);
  if (!parsed) return { type: "notFound" };
  const picks = await getCatalogPicks();
  const path = pickPath(parsed);
  const pick = picks.find((p) => p.path === path);
  if (pick?.indexable) return { type: "page", pick };

  // Уровнем выше для «район × комнатность» — страница района, если она есть.
  if (parsed.district && parsed.roomType) {
    const parent = picks.find((p) => p.path === pickPath({ district: parsed.district }));
    if (parent?.indexable) return { type: "redirect", to: parent.path };
  }
  // Район без подборки — гид по району, раньше адрес вёл туда.
  if (parsed.district && !parsed.roomType && parsed.district.hasGuide) {
    return { type: "redirect", to: `/rayon/${parsed.district.slug}` };
  }
  return { type: "redirect", to: "/catalog" };
}

function parseSegments(
  segments: string[],
): { district?: District; roomType?: RoomType; flag?: PickFlag } | null {
  if (segments.length === 1) {
    const [s] = segments;
    const district = districtBySlug(s);
    if (district) return { district };
    const roomType = roomTypeBySlug(s);
    if (roomType) return { roomType };
    const flag = PICK_FLAGS.find((f) => f.slug === s);
    if (flag) return { flag: flag.slug };
    return null;
  }
  if (segments.length === 2) {
    const district = districtBySlug(segments[0]);
    const roomType = roomTypeBySlug(segments[1]);
    if (district && roomType) return { district, roomType };
  }
  return null;
}
