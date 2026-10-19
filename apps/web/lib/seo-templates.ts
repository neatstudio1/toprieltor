import type { CatalogCard } from "@/lib/cms/client";
import type { CatalogPick } from "@/lib/catalog-picks";
import type { RoomType } from "@/lib/districts";
import { formatRub, pluralizeRu } from "@/lib/format";

/**
 * Шаблоны title / description / H1 для страниц, собранных из базы, — по
 * согласованной таблице ysrealty_title_description_2026-10-15.xlsx. Цифры
 * подставляются из живых данных и обновляются вместе с ними.
 *
 * Нормы: title до 85 символов (дальше Яндекс обрезает), description 120–160.
 */
export const TITLE_MAX = 85;
const FREE_PICK_SUFFIX = " — бесплатный подбор";

/** «4,3 млн ₽» */
export function millionsRub(value: number): string {
  return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн ₽`;
}

/** Хвост «— бесплатный подбор», если заголовок с ним укладывается в норму. */
function withFreePick(title: string): string {
  const longer = `${title}${FREE_PICK_SUFFIX}`;
  return longer.length <= TITLE_MAX ? longer : title;
}

/** Винительный падеж для «купить …»: «студию», «2-комнатную квартиру». */
export function roomAccusative(roomType: RoomType): string {
  if (roomType.slug === "studiya") return "студию";
  return `${roomType.slug[0]}-комнатную квартиру`;
}

/**
 * «есть сданные, сдача до 2029» / «сдача 2028» / «есть сданные» — по ЖК подборки.
 * Пусто, если сроков нет совсем.
 */
export function deliveryStatusText(projects: CatalogCard[]): string {
  const parts: string[] = [];
  const anyDelivered = projects.some((p) => p.hasDelivered);
  if (anyDelivered) parts.push("есть сданные");
  const years = Array.from(new Set(projects.flatMap((p) => p.pendingYears))).sort((a, b) => a - b);
  if (years.length) {
    const last = years[years.length - 1];
    parts.push(!anyDelivered && years.length === 1 ? `сдача ${last}` : `сдача до ${last}`);
  }
  return parts.join(", ");
}

function withStatus(head: string, status: string): string {
  return status ? `${head}, ${status}.` : `${head}.`;
}

export interface SeoText {
  title: string;
  description: string;
  h1: string;
}

// ───────────────────────── подборки каталога ─────────────────────────

export function pickSeo(pick: CatalogPick, projects: CatalogCard[]): SeoText {
  const price = millionsRub(pick.priceMin);
  const projectsCount = pick.projectSlugs.length;
  const status = deliveryStatusText(projects);
  const variants = `${pick.count} ${pluralizeRu(pick.count, "вариант", "варианта", "вариантов")}`;
  const flats = `${pick.count} ${pluralizeRu(pick.count, "квартира", "квартиры", "квартир")}`;

  if (pick.kind === "districtRoom" && pick.district && pick.roomType) {
    return {
      title: withFreePick(`Купить ${roomAccusative(pick.roomType)} ${pick.district.inCityPhrase} от ${price}`),
      description: withStatus(`${variants} в ${projectsCount} ЖК от ${price}`, status) +
        " Бесплатный подбор и ипотека — цена как у застройщика.",
      h1: `${pick.roomType.plural} в новостройках ${pick.district.inCityPhrase}`,
    };
  }
  if (pick.kind === "room" && pick.roomType) {
    return {
      title: withFreePick(`Купить ${roomAccusative(pick.roomType)} в новостройке Екатеринбурга от ${price}`),
      description: `${variants} в ${projectsCount} ЖК Екатеринбурга от ${price}. Бесплатный подбор, ипотека и сопровождение — платит застройщик.`,
      h1: `${pick.roomType.plural} в новостройках Екатеринбурга`,
    };
  }
  if (pick.kind === "district" && pick.district) {
    return {
      title: `Новостройки ${pick.district.inCityPhrase} — от ${price}`,
      description: withStatus(`${flats} в ${projectsCount} ЖК ${pick.district.inCityPhrase}, от ${price}`, status) +
        " Бесплатный подбор и ипотека — цена как у застройщика.",
      h1: `Новостройки ${pick.district.inCityPhrase}`,
    };
  }
  // Сочетания с особенностью: «район × отделка», «комнатность × сдан», все три.
  if (pick.flag && (pick.district || pick.roomType)) {
    const what = pick.roomType ? roomAccusative(pick.roomType) : "квартиру";
    const flagBuy = pick.flag === "sdannye" ? "в сданном доме" : "с отделкой";
    const flagH1 = pick.flag === "sdannye" ? "в сданных домах" : "с отделкой в новостройках";
    const where = pick.district ? pick.district.inCityPhrase : "Екатеринбурга";
    const whereBuy = pick.district ? pick.district.inCityPhrase : pick.flag === "sdannye" ? "в Екатеринбурге" : "в новостройке Екатеринбурга";
    const h1Where = pick.district ? pick.district.inCityPhrase : pick.flag === "sdannye" ? "Екатеринбурга" : "Екатеринбурга";
    return {
      title: withFreePick(`Купить ${what} ${flagBuy} ${whereBuy} от ${price}`),
      description: withStatus(`${variants} в ${projectsCount} ЖК от ${price}`, status) +
        " Бесплатный подбор и ипотека — цена как у застройщика.",
      h1: `${pick.roomType ? pick.roomType.plural : "Квартиры"} ${flagH1} ${pick.district ? where : h1Where}`,
    };
  }
  if (pick.flag === "sdannye") {
    return {
      title: `Купить квартиру в сданном доме в Екатеринбурге от ${price} — заезд сразу`,
      description: `${pick.count} ${pluralizeRu(pick.count, "квартира", "квартиры", "квартир")} в сданных домах в ${projectsCount} ЖК от ${price}. Заезд без ожидания стройки, подбор бесплатно.`,
      h1: "Квартиры в сданных домах Екатеринбурга",
    };
  }
  return {
    title: `Купить квартиру с отделкой в новостройке Екатеринбурга от ${price}`,
    description: `${flats} с чистовой и предчистовой отделкой в ${projectsCount} ЖК от ${price}. Посчитаем «квартира + ремонт» до брони, подбор бесплатно.`,
    h1: "Квартиры с отделкой в новостройках Екатеринбурга",
  };
}

/** Короткая подпись подборки для ссылок и крошек: «1-комнатные в Академическом». */
export function pickLabel(pick: CatalogPick): string {
  if (pick.flag && (pick.district || pick.roomType)) return partsLabel(pick);
  if (pick.kind === "districtRoom" && pick.district && pick.roomType) {
    return `${pick.roomType.plural} ${pick.district.inPhrase}`;
  }
  if (pick.kind === "room" && pick.roomType) return pick.roomType.plural;
  if (pick.kind === "district" && pick.district) return `Новостройки ${pick.district.inPhrase}`;
  return pick.flag === "sdannye" ? "Квартиры в сданных домах" : "Квартиры с отделкой";
}

/** Подпись любого сочетания фильтров — в том числе пустого, без подборки в базе. */
export function partsLabel(parts: {
  district?: { inPhrase: string } | null;
  roomType?: RoomType | null;
  flag?: string | null;
}): string {
  const what = parts.roomType ? parts.roomType.plural : parts.flag || parts.district ? "Квартиры" : "Новостройки";
  const flag = parts.flag === "sdannye" ? " в сданных домах" : parts.flag === "s-otdelkoy" ? " с отделкой" : "";
  const where = parts.district ? ` ${parts.district.inPhrase}` : "";
  return `${what}${flag}${where}`;
}

// ───────────────────────── ЖК ─────────────────────────

/** «ЖК «Атлас Ривер»», но «ЖК Квартал «Депо»» — без вложенных кавычек, если они уже в названии. */
export function quotedName(name: string): string {
  return /[«"]/.test(name) ? name : `«${name}»`;
}

export function projectSeo(input: {
  name: string;
  developerName: string | null;
  district: string | null;
  apartmentsCount: number;
  priceMin: number | null;
  card: CatalogCard | null;
}): SeoText {
  const { name, developerName, district, apartmentsCount, priceMin, card } = input;
  const price = priceMin ? millionsRub(priceMin) : null;
  const title = price
    ? `ЖК ${name} — купить квартиру от ${price}: цены и планировки`
    : `ЖК ${name} в Екатеринбурге — купить квартиру: цены и планировки`;

  let status = "сроки уточняются";
  if (card?.hasDelivered) status = "есть сданные";
  else if (card?.pendingYears.length) status = `сдача ${card.pendingYears[0]}`;

  const flats = `${apartmentsCount} ${pluralizeRu(apartmentsCount, "квартира", "квартиры", "квартир")}`;
  const where = district ? ` (${district})` : "";
  const from = developerName ? ` от застройщика ${developerName}` : "";
  const pricePart = price ? `от ${price}, ` : "";
  // Квартир в продаже нет — согласованный текст без цифр, вместо «0 квартир».
  if (!apartmentsCount) {
    return {
      title,
      description:
        `ЖК ${quotedName(name)}${from}: планировки, сроки сдачи и условия покупки. ` +
        "Узнаем актуальные цены и акции — бесплатно.",
      h1: developerName ? `ЖК ${quotedName(name)} — квартиры от застройщика ${developerName}` : `ЖК ${quotedName(name)}`,
    };
  }

  let description =
    `${apartmentsCount ? flats : "Квартиры"} в ЖК ${quotedName(name)}${where}${from}: ${pricePart}${status}. ` +
    "Бесплатный подбор и ипотека по цене застройщика.";
  // Норма 120–160, но в таблице согласованы и чуть более длинные — режем только явный перебор.
  if (description.length > 170) {
    description = `${apartmentsCount ? flats : "Квартиры"} в ЖК ${quotedName(name)}${developerName ? ` от ${developerName}` : ""}: ${pricePart}${status}. Бесплатный подбор и ипотека.`;
  }

  return {
    title,
    description,
    h1: developerName
      ? `ЖК ${quotedName(name)} — квартиры от застройщика ${developerName}`
      : `ЖК ${quotedName(name)}`,
  };
}

// ───────────────────────── застройщики ─────────────────────────

export function developerSeo(name: string, projects: CatalogCard[], apartmentsCount: number): SeoText {
  const prices = projects.map((p) => p.priceFrom).filter((p): p is number => p !== null && p > 0);
  const price = prices.length ? millionsRub(Math.min(...prices)) : null;
  const k = projects.length;
  return {
    title: price
      ? `${name}: купить квартиру в ЖК застройщика в Екатеринбурге от ${price}`
      : `${name}: купить квартиру в ЖК застройщика в Екатеринбурге`,
    description:
      `Все ЖК ${name} в Екатеринбурге: ${k} ${pluralizeRu(k, "проект", "проекта", "проектов")}, ` +
      `${apartmentsCount} ${pluralizeRu(apartmentsCount, "квартира", "квартиры", "квартир")}` +
      `${price ? ` от ${price}` : ""}. Репутация, сроки сдачи, отделка. Подбор бесплатно.`,
    h1: `${name} — застройщик в Екатеринбурге`,
  };
}

// ───────────────────────── квартиры ─────────────────────────

function typeAccusative(type: string): string {
  if (type === "студия") return "студию";
  const match = type.match(/^(\d)к$/);
  return match ? `${match[1]}-комнатную квартиру` : `квартиру ${type}`;
}

function typeShort(type: string): string {
  if (type === "студия") return "Студия";
  const match = type.match(/^(\d)к$/);
  return match ? `${match[1]}-комн.` : type;
}

export function apartmentSeo(input: {
  type: string;
  areaM2: number;
  price: number;
  projectName: string;
  district: string | null;
}): { title: string; description: string } {
  const area = input.areaM2.toFixed(2).replace(".", ",");
  const price = input.price ? ` за ${(input.price / 1_000_000).toFixed(2).replace(".", ",")} млн ₽` : "";
  const where = input.district ? ` (${input.district})` : "";
  return {
    title: `Купить ${typeAccusative(input.type)} ${area} м² в ЖК ${input.projectName}${price}`,
    description:
      `${typeShort(input.type)}, ${area} м² в ЖК «${input.projectName}»${where}. ` +
      `${input.price ? `Цена от ${formatRub(input.price)} ₽. ` : ""}` +
      "Бесплатный подбор и ипотека — цена как у застройщика.",
  };
}
