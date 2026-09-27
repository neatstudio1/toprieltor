/**
 * Канонические районы Екатеринбурга для посадочных страниц каталога.
 *
 * `project.district` в Strapi — свободный текст, который парсер тянет с сайтов
 * застройщиков: на 40 ЖК там 23 разных значения, вперемешку микрорайоны
 * («Академический»), административные районы («Верх-Исетский район»), метро
 * («м. Ботаническая») и ориентиры («Центральный стадион»). Нормализуем на чтении,
 * а не в базе: следующий прогон парсера всё равно перезапишет поле.
 *
 * Слаги совпадают с существующими страницами /rayon/[slug] там, где те есть, —
 * это позволяет связать коммерческую выдачу с редакционным гидом по району.
 */
export interface District {
  slug: string;
  /** Именительный падеж, для заголовков вида «Ботанический». */
  name: string;
  /** Предложный падеж целиком, включая предлог: «в Ботаническом», «на Уралмаше». */
  inPhrase: string;
  /** Сырые значения district из базы, которые сюда сводятся. */
  raw: string[];
  /** Есть ли редакционный гид /rayon/[slug]. */
  hasGuide: boolean;
}

export const DISTRICTS: District[] = [
  {
    slug: "akademicheskiy",
    name: "Академический",
    inPhrase: "в Академическом",
    raw: ["Академический"],
    hasGuide: true,
  },
  {
    slug: "botanicheskiy",
    name: "Ботанический",
    inPhrase: "в Ботаническом",
    raw: ["м. Ботаническая", "Южная Ботаника"],
    hasGuide: true,
  },
  {
    slug: "sortirovka",
    name: "Сортировка",
    inPhrase: "на Сортировке",
    raw: ["Сортировка", "Новая Сортировка"],
    hasGuide: true,
  },
  {
    slug: "centr",
    name: "Центр",
    inPhrase: "в центре",
    raw: ["Центр", "Юг-Центр", "Центральный стадион"],
    hasGuide: false,
  },
  {
    slug: "chkalovskiy",
    name: "Чкаловский район",
    inPhrase: "в Чкаловском районе",
    raw: ["м. Чкаловская", "Чкаловский район"],
    hasGuide: false,
  },
  {
    slug: "elmash",
    name: "Эльмаш",
    inPhrase: "на Эльмаше",
    raw: ["Эльмаш"],
    hasGuide: false,
  },
  {
    slug: "uktus",
    name: "Уктус",
    inPhrase: "на Уктусе",
    raw: ["Уктус"],
    hasGuide: false,
  },
  {
    slug: "vtuzgorodok",
    name: "Втузгородок",
    inPhrase: "во Втузгородке",
    raw: ["Втузгородок"],
    hasGuide: false,
  },
  {
    slug: "viz",
    name: "ВИЗ",
    inPhrase: "на ВИЗе",
    raw: ["ВИЗ", "Верх-Исетский район"],
    hasGuide: true,
  },
  {
    slug: "uralmash",
    name: "Уралмаш",
    inPhrase: "на Уралмаше",
    raw: ["Уралмаш"],
    hasGuide: true,
  },
];

const BY_RAW = new Map<string, District>(
  DISTRICTS.flatMap((d) => d.raw.map((raw) => [raw.toLowerCase(), d] as const)),
);

const BY_SLUG = new Map(DISTRICTS.map((d) => [d.slug, d]));

/** Сырое значение district → канонический район, или null для неохваченных. */
export function normalizeDistrict(raw: string | null | undefined): District | null {
  if (!raw) return null;
  return BY_RAW.get(raw.trim().toLowerCase()) ?? null;
}

export function districtBySlug(slug: string): District | null {
  return BY_SLUG.get(slug) ?? null;
}

// ───────────────────────── типы квартир ─────────────────────────

export interface RoomType {
  /** Сегмент URL. Совпадает с префиксом слагов квартир: studiya-28-53, 2k-54-7. */
  slug: string;
  /** Значение поля type в базе. */
  value: string;
  /** Для заголовка: «Студии», «2-комнатные квартиры». */
  plural: string;
  /** Короткая форма для хлебных крошек и таблиц. */
  short: string;
}

export const ROOM_TYPES: RoomType[] = [
  { slug: "studiya", value: "студия", plural: "Студии", short: "Студия" },
  { slug: "1k", value: "1к", plural: "1-комнатные квартиры", short: "1-комн." },
  { slug: "2k", value: "2к", plural: "2-комнатные квартиры", short: "2-комн." },
  { slug: "3k", value: "3к", plural: "3-комнатные квартиры", short: "3-комн." },
  { slug: "4k", value: "4к", plural: "4-комнатные квартиры", short: "4-комн." },
  { slug: "5k", value: "5к", plural: "5-комнатные квартиры", short: "5-комн." },
];

const TYPE_BY_SLUG = new Map(ROOM_TYPES.map((t) => [t.slug, t]));

export function roomTypeBySlug(slug: string): RoomType | null {
  return TYPE_BY_SLUG.get(slug) ?? null;
}

/**
 * Порог, ниже которого посадочную страницу не создаём.
 *
 * Мы уже закрывали от индексации 2500 тонких карточек квартир, и Яндекс сейчас
 * выкидывает страницы-списки как малоценные. Комбинация вроде «Пионерский,
 * 4 комнаты» с двумя квартирами — ровно та же проблема в новой упаковке,
 * поэтому страница живёт только там, где есть что показать.
 */
export const MIN_APARTMENTS_FOR_LANDING = 15;
export const MIN_PROJECTS_FOR_LANDING = 2;
