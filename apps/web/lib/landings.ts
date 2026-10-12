/**
 * Конфиг посадочных страниц под Яндекс Директ (/lp/*).
 *
 * Здесь только то, что отличается между вариантами, и общие тексты блоков.
 * Цифры в карточках цен — из макета; по ТЗ они должны считаться из базы
 * (docs/landings/tz-claude-code-lp.md, раздел 5), пока это только вёрстка.
 */

import { calcMonthlyPayment } from "@/lib/mortgage";

export type LandingSlug = "podbor" | "kvartiry" | "s-otdelkoy";

export interface PriceCard {
  title: string;
  from: string;
  payment: string;
}

export interface LandingVariant {
  slug: LandingSlug;
  /** Вариант целиком, как он уходит в заявку и Метрику: «podbor», «kvartiry/2k». */
  key: string;
  /** Адрес страницы вместе с type — в карточке заявки по нему видно, откуда пришла. */
  path: string;
  label: string;
  meta: { title: string; description: string };
  hero: {
    h1Main: string;
    /** Запасной вариант, если в базе нет цены; обычно акцент считается из базы по priceType. */
    h1Accent: string;
    /** Тип квартир, по минимальной цене которого строится «от N млн ₽» в заголовке. */
    priceType?: string;
    accentNoWrap?: boolean;
  };
  /** Индекс карточки цены, которую подсвечиваем (лендинг по комнатам). */
  highlightPrice: number | null;
  /** Подпись главной кнопки первого экрана; по умолчанию — «Подобрать квартиры». */
  heroCta?: string;
  /** Карточки «боли», которые ставятся перед общими. Текст-подпись необязателен. */
  painLead?: { title: string; text?: string }[];
}

export const ROOM_TYPES = ["1k", "2k"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

const PODBOR: LandingVariant = {
  slug: "podbor",
  key: "podbor",
  path: "/lp/podbor",
  label: "A · подбор",
  meta: {
    title: "Подбор новостроек в Екатеринбурге под ваш бюджет",
    description:
      "Подберём новостройку в Екатеринбурге под бюджет и капитал, проведём от ипотеки до ремонта. Подбор и сопровождение бесплатно для покупателя.",
  },
  hero: {
    h1Main: "Подберём новостройку в Екатеринбурге",
    h1Accent: "под ваш бюджет и капитал",
  },
  highlightPrice: null,
};

const S_OTDELKOY: LandingVariant = {
  slug: "s-otdelkoy",
  key: "s-otdelkoy",
  path: "/lp/s-otdelkoy",
  label: "C · с отделкой",
  meta: {
    title: "Квартиры с отделкой в новостройках Екатеринбурга",
    description:
      "Подберём квартиру с отделкой в новостройке Екатеринбурга за наличные и в ипотеку. Яна — дизайнер интерьеров: оценит отделку до брони. Подбор бесплатно для покупателя.",
  },
  hero: {
    h1Main: "Квартиры с отделкой в новостройках Екатеринбурга",
    h1Accent: "за наличные и в ипотеку",
  },
  highlightPrice: null,
  heroCta: "Подобрать с отделкой",
  painLead: [{ title: "Какая отделка не отвалится?" }],
};

const KVARTIRY: Record<RoomType, LandingVariant> = {
  "1k": {
    slug: "kvartiry",
    key: "kvartiry/1k",
    path: "/lp/kvartiry?type=1k",
    label: "B · 1-комнатные",
    meta: {
      title: "1-комнатные квартиры в новостройках Екатеринбурга от 4,5 млн",
      description:
        "Подберём 1-комнатную квартиру в новостройке Екатеринбурга с удобной планировкой, посчитаем платёж и проведём до ключей.",
    },
    hero: {
      h1Main: "1-комнатные квартиры в новостройках Екатеринбурга",
      h1Accent: "от 4,5 млн ₽",
      priceType: "1к",
      accentNoWrap: true,
    },
    highlightPrice: 1,
  },
  "2k": {
    slug: "kvartiry",
    key: "kvartiry/2k",
    path: "/lp/kvartiry?type=2k",
    label: "B · 2-комнатные",
    meta: {
      title: "2-комнатные квартиры в новостройках Екатеринбурга от 5,3 млн",
      description:
        "Подберём 2-комнатную квартиру в новостройке Екатеринбурга с удобной планировкой, посчитаем платёж и проведём до ключей.",
    },
    hero: {
      h1Main: "2-комнатные квартиры в новостройках Екатеринбурга",
      h1Accent: "от 5,3 млн ₽",
      priceType: "2к",
      accentNoWrap: true,
    },
    highlightPrice: 2,
  },
};

export function parseRoomType(raw: string | string[] | undefined): RoomType {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return ROOM_TYPES.find((t) => t === value) ?? "1k";
}

export function landingVariant(slug: string, rawType?: string | string[]): LandingVariant | null {
  if (slug === "podbor") return PODBOR;
  if (slug === "s-otdelkoy") return S_OTDELKOY;
  if (slug === "kvartiry") return KVARTIRY[parseRoomType(rawType)];
  return null;
}

export const LANDING_SLUGS: LandingSlug[] = ["podbor", "kvartiry", "s-otdelkoy"];

// ───────────────────────── общие блоки ─────────────────────────

export const HERO_SUB =
  "Не просто подбираем квартиру — ведём под ключ: ипотека, юридическая проверка, приёмка, дизайн, ремонт и заселение / сдача в аренду.";

/** Круглая фотка в блоке «Квартиру без переделок»: кадр подобран так, чтобы голова и рука были по центру круга. */
export const YANA_AVATAR = { src: "/lp/yana-2.webp", position: "50% 6%" };

export const HERO_BADGES = [
  { value: "100+", label: "семей получили ключи", accent: true },
  { value: "с 2019", label: "на рынке новостроек", accent: false },
  { value: "под ключ", label: "от подбора до ремонта", accent: false },
];

export const PAIN_CARDS = [
  { title: "У каждого ЖК свои акции", text: "Сравнить условия вручную почти невозможно." },
  { title: "В офисе продаж хвалят свой дом", text: "Про соседний ЖК дешевле вам не скажут." },
  { title: "Планировка на картинке ≠ в жизни", text: "Узкий коридор и тесную кухню видно только вживую." },
  { title: "Ипотека, взнос, рассрочка", text: "Непонятно, что дешевле за 20 лет." },
];

export type AudienceIcon = "family" | "military" | "relocation";

export const AUDIENCE = [
  { icon: "family" as AudienceIcon, title: "Семьи с детьми", text: "Семейная ипотека" },
  { icon: "military" as AudienceIcon, title: "Военные и семьи СВО", text: "Военная ипотека и льготы" },
  { icon: "relocation" as AudienceIcon, title: "Переезд в Екатеринбург", text: "Подбор квартиры дистанционно" },
];

export const PROCESS_STEPS = [
  { n: "01", tag: "Подбор", title: "3–5 вариантов в тот же день", text: "С ценой, платежом и акциями." },
  { n: "02", tag: "Ипотека", title: "Заявки в несколько банков", text: "Берём лучшее одобрение." },
  { n: "03", tag: "Сделка", title: "Юридическая проверка", text: "ДДУ, застройщик, эскроу." },
  { n: "04", tag: "Приёмка", title: "Проверяем квартиру", text: "Фиксируем недочёты до подписания акта." },
  { n: "05", tag: "Дизайн и ремонт", title: "Проект и бригада", text: "Скидки на сантехнику и стройматериалы." },
  { n: "06", tag: "Аренда", title: "Сдаём, если покупали для дохода", text: "Подбор жильцов и договор." },
];

export const PERKS = {
  free: { title: "Цену застройщика", text: "Подбор и сделка для вас 0 ₽." },
  promos: { title: "Все акции, а не одну", text: "Видно, где скидка реально больше." },
  rate: { title: "Лучшую ставку", text: "Подаём в несколько банков сразу." },
  designer: { title: "Квартиру без переделок", text: "Яна — дизайнер, оценит планировку и отделку до брони." },
  noSearch: { title: "Не нужно искать дизайнера", text: "Дизайн-проект и ремонт делаем сами." },
  discounts: { title: "Скидки на сантехнику и материалы", text: "Партнёрские цены для наших клиентов." },
};

export interface ClientCase {
  tag: string;
  photo: string;
  position: string;
  value: string;
  text: string;
  meta: string;
}

export const CLIENT_CASES: ClientCase[] = [
  {
    tag: "Семья с ребёнком",
    photo: "/lp/clients/IMG_1629.webp",
    position: "50% 28%",
    value: "−640 тыс ₽",
    text: "Совместили акцию застройщика и семейную ипотеку.",
    meta: "2-комнатная, Академический",
  },
  {
    tag: "Покупка под сдачу",
    photo: "/lp/clients/IMG_2406.webp",
    position: "50% 30%",
    value: "Под ключ",
    text: "От подбора до ремонта",
    meta: "2-комнатная, Atlas Development",
  },
  {
    tag: "Из другого города",
    photo: "/lp/clients/IMG_5706.webp",
    position: "50% 25%",
    value: "Ипотека 6%",
    text: "Успели в последний вагон",
    meta: "3-комнатная квартира в центре",
  },
];

/** Порядок важен: первые четыре видны и на мобильном, остальные только на десктопе. */
export const CLIENT_PHOTOS = [
  { src: "/lp/clients/IMG_8514.webp", position: "50% 35%" },
  { src: "/lp/clients/IMG_2779.webp", position: "50% 40%" },
  { src: "/lp/clients/D7CA20C7.webp", position: "50% 45%" },
  { src: "/lp/clients/46BC81D2.webp", position: "50% 45%" },
  { src: "/lp/clients/IMG_1629.webp", position: "50% 28%" },
  { src: "/lp/clients/IMG_2406.webp", position: "50% 30%" },
  { src: "/lp/clients/IMG_5706.webp", position: "50% 25%" },
];

export interface DocumentScan {
  src: string;
  width: number;
  height: number;
  title: string;
  caption: string;
}

export const DOCUMENTS: DocumentScan[] = [
  {
    src: "/lp/docs/diplom.webp",
    width: 1800,
    height: 1190,
    title: "Диплом о профессиональной переподготовке",
    caption: "«Дизайн интерьера» · УрГАХУ, 2016",
  },
  {
    src: "/lp/docs/diplom-prilozhenie.webp",
    width: 1171,
    height: 1651,
    title: "Приложение к диплому",
    caption: "520 часов, дисциплины и оценки",
  },
  {
    src: "/lp/docs/sertifikat-dekorator.webp",
    width: 1738,
    height: 1235,
    title: "Сертификат «Декоратор»",
    caption: "УрГАХУ, 2016",
  },
  {
    src: "/lp/docs/sertifikat-risunok.webp",
    width: 1800,
    height: 1168,
    title: "Сертификат «Интерьерный рисунок»",
    caption: "УралГАХА, 2015",
  },
];

export const DEVELOPERS = [
  "Брусника",
  "Атлас Девелопмент",
  "Астон",
  "Атомстройкомплекс",
  "СКМ Девелопмент",
  "РСГ-Академическое",
];

/** Запасные цифры из макета — на случай, если в базе нет квартир нужного типа. */
const FALLBACK_PRICE_CARDS: PriceCard[] = [
  { title: "Студии", from: "от 3,0 млн", payment: "от 14 500 ₽/мес" },
  { title: "1-комнатные", from: "от 4,5 млн", payment: "от 21 700 ₽/мес" },
  { title: "2-комнатные", from: "от 5,3 млн", payment: "от 25 400 ₽/мес" },
  { title: "3 комнаты и больше", from: "от 9,9 млн", payment: "от 47 300 ₽/мес" },
];

const PRICE_GROUPS = [
  { title: "Студии", types: ["студия"] },
  { title: "1-комнатные", types: ["1к"] },
  { title: "2-комнатные", types: ["2к"] },
  { title: "3 комнаты и больше", types: ["3к", "4к", "5к"] },
];

/** Условия, на которых считается «платёж от …»; они же выводятся мелким текстом на странице. */
export const DOWN_PAYMENT_SHARE = 0.2;
export const MORTGAGE_TERM_YEARS = 30;

/** Округляем вниз до 0,1 млн: «от 4,5 млн» не должно обещать цену ниже реальной. */
export function formatMln(price: number): string {
  const tenths = Math.floor(price / 100_000);
  return `${Math.floor(tenths / 10)},${tenths % 10}`;
}

function formatThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/0$/, "").replace(/\.0$/, "").replace(".", ",")}%`;
}

export function monthlyPaymentText(price: number, rate: number): string {
  const payment = calcMonthlyPayment({
    price,
    down: price * DOWN_PAYMENT_SHARE,
    annualRate: rate,
    termMonths: MORTGAGE_TERM_YEARS * 12,
  });
  return `от ${formatThousands(Math.round(payment / 100) * 100)} ₽/мес`;
}

function minPrice(minByType: Record<string, number>, types: string[]): number | null {
  const prices = types.map((t) => minByType[t]).filter((p): p is number => typeof p === "number");
  return prices.length ? Math.min(...prices) : null;
}

export function buildPriceCards(minByType: Record<string, number>, rate: number): PriceCard[] {
  return PRICE_GROUPS.map((group, i) => {
    const price = minPrice(minByType, group.types);
    if (price === null) return FALLBACK_PRICE_CARDS[i];
    return { title: group.title, from: `от ${formatMln(price)} млн`, payment: monthlyPaymentText(price, rate) };
  });
}

export function heroAccent(variant: LandingVariant, minByType: Record<string, number>): string {
  const type = variant.hero.priceType;
  const price = type ? minPrice(minByType, [type]) : null;
  return price === null ? variant.hero.h1Accent : `от ${formatMln(price)} млн ₽`;
}

export const FAQ = [
  {
    q: "Почему для меня бесплатно?",
    a: "Нам платит застройщик из своего маркетингового бюджета. Цена квартиры такая же, как в офисе продаж.",
  },
  {
    q: "Я уже был у застройщика. Можно подключить вас?",
    a: "Напишите, проверим. У каждого застройщика свои правила закрепления клиента, иногда подключиться ещё можно.",
  },
  {
    q: "Через вас не выйдет дороже?",
    a: "Нет. Цена застройщика, а у партнёров бывают условия, которых нет на сайте.",
  },
  {
    q: "Помогаете с ипотекой?",
    a: "Да. Подаём заявку в несколько банков и берём лучшее одобрение.",
  },
  {
    q: "Ремонт тоже делаете?",
    a: "Да. Дизайн-проект, бригада и материалы со скидкой у партнёров. Можно взять только проект или только приёмку.",
  },
  {
    q: "Можно купить, если я в другом городе?",
    a: "Да. Видеопросмотры, электронная подпись и регистрация без поездок.",
  },
];

export const CHANNELS = [
  { id: "tg", label: "Telegram" },
  { id: "max", label: "MAX" },
  { id: "call", label: "Звонок" },
] as const;
export type ChannelId = (typeof CHANNELS)[number]["id"];

/** Мини-квиз в плавающем пузыре. */
export const POPUP_STEPS = [
  {
    key: "goal",
    tag: "Цель",
    q: "Для чего покупаете?",
    opts: [
      ["Жить самим", ""],
      ["Для семьи с детьми", ""],
      ["Сдавать в аренду", ""],
      ["Пока присматриваюсь", ""],
    ],
  },
  {
    key: "rooms",
    tag: "Комнатность",
    q: "Сколько комнат нужно?",
    opts: [
      ["Студия", "от 3,0 млн"],
      ["1-комнатная", "от 4,5 млн"],
      ["2-комнатная", "от 5,3 млн"],
      ["3 и больше", "от 9,9 млн"],
    ],
  },
  {
    key: "down",
    tag: "Взнос",
    q: "Есть ли первоначальный взнос?",
    opts: [
      ["Нет", ""],
      ["20%", ""],
      ["30% и более", ""],
    ],
  },
] as const;
