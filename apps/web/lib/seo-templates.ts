import type { CatalogCard } from "@/lib/cms/client";
import type { CatalogPick } from "@/lib/catalog-picks";
import type { RoomType } from "@/lib/districts";
import { formatRub, pluralizeRu } from "@/lib/format";

/**
 * Шаблоны title / description / H1 для страниц, собранных из базы, — по
 * согласованной таблице ysrealty_title_description_2026-10-15.xlsx. Цифры
 * подставляются из живых данных и обновляются вместе с ними.
 *
 * Правила (таблица от 2026-10-23): title в форме запроса («Купить …») остаётся,
 * в конец всегда добавляется «подбор бесплатный»; description начинается с
 * действия («Подберём …», «Покажем …»).
 */
const FREE_PICK = "подбор бесплатный";

/** Склонение для «из N вариантов»: «из 21 варианта», «из 5 вариантов». */
function variantsAfterFrom(n: number): string {
  return `${n} ${n % 10 === 1 && n % 100 !== 11 ? "варианта" : "вариантов"}`;
}

/** «4,3 млн ₽» */
export function millionsRub(value: number): string {
  return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн ₽`;
}

/**
 * Хвост «подбор бесплатный»: через тире, а если в заголовке тире уже есть —
 * через запятую, чтобы не было двух тире подряд.
 */
export function withFreePick(title: string): string {
  return title.includes(" — ") ? `${title}, ${FREE_PICK}` : `${title} — ${FREE_PICK}`;
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
  const variants = variantsAfterFrom(pick.count);

  if (pick.kind === "districtRoom" && pick.district && pick.roomType) {
    return {
      title: withFreePick(`Купить ${roomAccusative(pick.roomType)} ${pick.district.inCityPhrase} от ${price}`),
      description: withStatus(`Подберём из ${variants} в ${projectsCount} ЖК от ${price}`, status) +
        " Подбор и помощь с ипотекой бесплатно, цена как у застройщика.",
      h1: `${pick.roomType.plural} в новостройках ${pick.district.inCityPhrase}`,
    };
  }
  if (pick.kind === "room" && pick.roomType) {
    return {
      title: withFreePick(`Купить ${roomAccusative(pick.roomType)} в новостройке Екатеринбурга от ${price}`),
      description: `Подберём из ${variants} в ${projectsCount} ЖК Екатеринбурга от ${price}. Подбор, ипотеку и сопровождение сделки делаем бесплатно: платит застройщик.`,
      h1: `${pick.roomType.plural} в новостройках Екатеринбурга`,
    };
  }
  if (pick.kind === "district" && pick.district) {
    return {
      title: withFreePick(`Новостройки ${pick.district.inCityPhrase} — от ${price}`),
      description: withStatus(`Подберём из ${variants} в ${projectsCount} ЖК ${pick.district.inCityPhrase}, от ${price}`, status) +
        " Подбор и помощь с ипотекой бесплатно, цена как у застройщика.",
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
      description: withStatus(`Подберём из ${variants} в ${projectsCount} ЖК от ${price}`, status) +
        " Подбор и помощь с ипотекой бесплатно, цена как у застройщика.",
      h1: `${pick.roomType ? pick.roomType.plural : "Квартиры"} ${flagH1} ${pick.district ? where : h1Where}`,
    };
  }
  if (pick.flag === "sdannye") {
    return {
      title: withFreePick(`Купить квартиру в сданном доме в Екатеринбурге от ${price}`),
      description: `Подберём из ${variants} в сданных домах в ${projectsCount} ЖК от ${price}. Заезд без ожидания стройки, подбор бесплатно.`,
      h1: "Квартиры в сданных домах Екатеринбурга",
    };
  }
  return {
    title: withFreePick(`Купить квартиру с отделкой в новостройке Екатеринбурга от ${price}`),
    description: `Подберём из ${variants} с чистовой и предчистовой отделкой в ${projectsCount} ЖК от ${price}. Посчитаем «квартира + ремонт» до брони, подбор бесплатно.`,
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
  const title = withFreePick(
    price
      ? `ЖК ${name} — купить квартиру от ${price}: цены и планировки`
      : `ЖК ${name} в Екатеринбурге — купить квартиру: цены и планировки`,
  );

  let status = "сроки уточняются";
  if (card?.hasDelivered) status = "есть сданные";
  else if (card?.pendingYears.length) status = `сдача ${card.pendingYears[0]}`;

  const variants = `${apartmentsCount} ${pluralizeRu(apartmentsCount, "вариант", "варианта", "вариантов")}`;
  const where = district ? ` (${district})` : "";
  const from = developerName ? ` от застройщика ${developerName}` : "";
  // Квартир в продаже нет — согласованный текст без цифр, вместо «0 квартир».
  if (!apartmentsCount) {
    return {
      title,
      description:
        `Подберём квартиру в ЖК ${quotedName(name)}${from}: планировки, сроки сдачи и условия покупки. ` +
        "Узнаем актуальные цены и акции — бесплатно.",
      h1: developerName ? `ЖК ${quotedName(name)} — квартиры от застройщика ${developerName}` : `ЖК ${quotedName(name)}`,
    };
  }

  // Описание вида «Подберём квартиру в ЖК «X» (район) от застройщика Y: 36 вариантов от 4,3 млн ₽, есть сданные. …»
  const pricePart2 = price ? ` от ${price}` : "";
  const statusPart = `, ${status}`;
  let description =
    `Подберём квартиру в ЖК ${quotedName(name)}${where}${from}: ${variants}${pricePart2}${statusPart}. ` +
    "Подбор и ипотека бесплатно, цена как у застройщика.";
  // Явный перебор режем: короче, без района и без «цена как у застройщика».
  if (description.length > 200) {
    description = `Подберём квартиру в ЖК ${quotedName(name)}${developerName ? ` от ${developerName}` : ""}: ${variants}${pricePart2}${statusPart}. Подбор и ипотека бесплатно.`;
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
    title: withFreePick(
      price
        ? `${name}: купить квартиру в ЖК застройщика в Екатеринбурге от ${price}`
        : `${name}: купить квартиру в ЖК застройщика в Екатеринбурге`,
    ),
    description:
      `Покажем все ЖК ${name} в Екатеринбурге: ${k} ${pluralizeRu(k, "проект", "проекта", "проектов")}, ` +
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
    title: withFreePick(`Купить ${typeAccusative(input.type)} ${area} м² в ЖК ${input.projectName}${price}`),
    description:
      `Подберём квартиру: ${typeShort(input.type).toLowerCase()}, ${area} м² в ЖК «${input.projectName}»${where}` +
      `${input.price ? `, цена от ${formatRub(input.price)} ₽` : ""}. ` +
      "Подбор и ипотека бесплатно, цена как у застройщика.",
  };
}
