import { cache } from "react";
import {
  getAllApartmentsWithProject,
  getCatalogCards,
  type ApartmentWithProject,
  type CatalogCard,
} from "@/lib/cms/client";
import {
  DISTRICTS,
  MIN_APARTMENTS_FOR_INDEX,
  ROOM_TYPES,
  districtBySlug,
  normalizeDistrict,
  roomTypeBySlug,
  type District,
  type RoomType,
} from "@/lib/districts";

/**
 * Подборки каталога — отдельный адрес под любое сочетание фильтров.
 * Сегменты всегда идут в одном порядке: район → комнатность → особенность.
 *   /catalog/akademicheskiy                  район
 *   /catalog/1k                              комнатность по всему городу
 *   /catalog/s-otdelkoy                      с чистовой или предчистовой отделкой
 *   /catalog/akademicheskiy/1k               район × комнатность
 *   /catalog/akademicheskiy/s-otdelkoy       район × особенность
 *   /catalog/1k/sdannye                      комнатность × особенность
 *   /catalog/akademicheskiy/1k/s-otdelkoy    все три
 *
 * Страница есть при любом количестве квартир (решение 2026-10-16): для
 * посетителей, Директа и перелинковки. В индекс — от MIN_APARTMENTS_FOR_INDEX
 * квартир и не больше двух фильтров сразу: три фильтра почти никто не ищет,
 * а таких страниц сотни.
 */

export type PickFlag = "s-otdelkoy" | "sdannye";

export const PICK_FLAGS: { slug: PickFlag; label: string }[] = [
  { slug: "s-otdelkoy", label: "С отделкой" },
  { slug: "sdannye", label: "Дом сдан" },
];

export type PickKind =
  | "district"
  | "room"
  | "flag"
  | "districtRoom"
  | "districtFlag"
  | "roomFlag"
  | "districtRoomFlag";

export interface PickParts {
  district?: District;
  roomType?: RoomType;
  flag?: PickFlag;
}

export function pickKind(parts: PickParts): PickKind {
  const key = [parts.district ? "district" : "", parts.roomType ? "room" : "", parts.flag ? "flag" : ""]
    .filter(Boolean)
    .join("-");
  const map: Record<string, PickKind> = {
    district: "district",
    room: "room",
    flag: "flag",
    "district-room": "districtRoom",
    "district-flag": "districtFlag",
    "room-flag": "roomFlag",
    "district-room-flag": "districtRoomFlag",
  };
  return map[key];
}

export function pickDepth(parts: PickParts): number {
  return [parts.district, parts.roomType, parts.flag].filter(Boolean).length;
}

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
  return segments.length ? `/catalog/${segments.join("/")}` : "/catalog";
}

interface Row {
  apt: ApartmentWithProject;
  projectSlug: string;
  district: District | null;
  roomType: RoomType | null;
  card: CatalogCard;
}

function summarize(rows: Row[], parts: PickParts): CatalogPick | null {
  if (!rows.length) return null;
  const kind = pickKind(parts);
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
    indexable: rows.length >= MIN_APARTMENTS_FOR_INDEX && pickDepth(parts) <= 2,
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

  const flagTest: Record<PickFlag, (r: Row) => boolean> = {
    "s-otdelkoy": (r) => hasFinish(r.apt.finish),
    sdannye: (r) => r.card.allDelivered,
  };
  const picks: (CatalogPick | null)[] = [];
  for (const district of [undefined, ...DISTRICTS]) {
    const inDistrict = district ? rows.filter((r) => r.district === district) : rows;
    for (const roomType of [undefined, ...ROOM_TYPES]) {
      const inRoom = roomType ? inDistrict.filter((r) => r.roomType === roomType) : inDistrict;
      for (const flag of [undefined, ...PICK_FLAGS.map((f) => f.slug)]) {
        if (!district && !roomType && !flag) continue;
        const subset = flag ? inRoom.filter(flagTest[flag]) : inRoom;
        picks.push(summarize(subset, { district, roomType, flag }));
      }
    }
  }

  return picks.filter((p): p is CatalogPick => p !== null);
});

export async function getIndexablePicks(): Promise<CatalogPick[]> {
  return (await getCatalogPicks()).filter((p) => p.indexable);
}

export type PickResolution =
  | { type: "page"; pick: CatalogPick }
  /** Сочетание осмысленное, но квартир сейчас нет — страница-заглушка без индекса. */
  | { type: "empty"; parts: PickParts; path: string }
  | { type: "redirect"; to: string }
  | { type: "notFound" };

/**
 * Адрес → подборка. Мусорный адрес — 404; сегменты не в том порядке —
 * редирект на канонический адрес (штатно его делает next.config со статусом
 * 301, здесь — страховка).
 */
export async function resolvePick(segments: string[]): Promise<PickResolution> {
  const parsed = parseSegments(segments);
  if (!parsed) return { type: "notFound" };
  const path = pickPath(parsed);
  if (path !== `/catalog/${segments.join("/")}`) return { type: "redirect", to: path };
  const pick = (await getCatalogPicks()).find((p) => p.path === path);
  if (pick) return { type: "page", pick };
  return { type: "empty", parts: parsed, path };
}

/** Сегменты в любом порядке, без повторов одного измерения. */
function parseSegments(segments: string[]): PickParts | null {
  if (!segments.length || segments.length > 3) return null;
  const parts: PickParts = {};
  for (const s of segments) {
    const district = districtBySlug(s);
    const roomType = roomTypeBySlug(s);
    const flag = PICK_FLAGS.find((f) => f.slug === s)?.slug;
    if (district && !parts.district) parts.district = district;
    else if (roomType && !parts.roomType) parts.roomType = roomType;
    else if (flag && !parts.flag) parts.flag = flag;
    else return null;
  }
  return parts;
}
