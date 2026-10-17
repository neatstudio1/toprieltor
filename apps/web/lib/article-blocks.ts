import type { Article, CatalogCard } from "@/lib/cms/client";
import type { ArticleService } from "@/lib/article-service";
import type { CatalogPick } from "@/lib/catalog-picks";
import { DISTRICTS, ROOM_TYPES } from "@/lib/districts";

/**
 * Блоки заявки внутри статьи — тексты согласованы в таблице
 * ysrealty_title_description_2026-10-15.xlsx (вкладка «Заявки в блоге»).
 *
 * Раньше форма стояла только после статьи, куда доходит меньшинство читателей.
 * Теперь: после 2-го абзаца — общий подбор, в середине — блок по теме статьи
 * (ипотека / районы и застройщики / отделка), в конце — «Напишите Яне».
 */
export interface LeadBlock {
  kind: "podbor" | "ipoteka" | "price" | "remont" | "telegram" | "service";
  title: string;
  text: string;
  button: string;
}

export const LEAD_BLOCKS: Record<Exclude<LeadBlock["kind"], "service">, LeadBlock> = {
  podbor: {
    kind: "podbor",
    title: "Подберём новостройку под ваш бюджет",
    text: "Пришлём 3–5 вариантов с расчётом платежа сегодня. Бесплатно — платит застройщик.",
    button: "Подобрать квартиры",
  },
  ipoteka: {
    kind: "ipoteka",
    title: "Посчитаем вашу ипотеку в 5–7 банках",
    text: "Одна заявка — несколько одобрений, выбираем лучшую ставку. Бесплатно при покупке через нас.",
    button: "Посчитать ипотеку",
  },
  price: {
    kind: "price",
    title: "Узнайте лучшую цену в этом районе",
    text: "Сравним все ЖК района и акции застройщиков — покажем, где дешевле на самом деле.",
    button: "Узнать лучшую цену",
  },
  remont: {
    kind: "remont",
    title: "Квартира + ремонт — посчитаем до брони",
    text: "Яна — дизайнер интерьеров: подскажет, где отделку не придётся переделывать, и даст скидки на материалы.",
    button: "Посчитать с ремонтом",
  },
  telegram: {
    kind: "telegram",
    title: "Остались вопросы? Напишите Яне",
    text: "Ответим в Telegram или MAX в течение 15 минут, с 9:00 до 21:00.",
    button: "Написать в Telegram",
  },
};

/**
 * Блок в конце статьи — один (2026-10-17: раньше подряд шли «Напишите Яне»,
 * блок услуги и тёмная плашка «Начать подбор»). Есть услуга по теме статьи —
 * ведём на неё, нет — в Telegram к Яне.
 */
export function endBlock(service: ArticleService | null): { block: LeadBlock; href?: string } {
  if (!service) return { block: LEAD_BLOCKS.telegram };
  return {
    block: { kind: "service", title: service.title, text: service.cta, button: "Подробнее об услуге" },
    href: `/uslugi/${service.slug}`,
  };
}

const TOPICS: { kind: keyof typeof LEAD_BLOCKS; match: RegExp }[] = [
  { kind: "ipoteka", match: /ипотек|маткапитал|материнск|первоначальн|взнос|рассроч|ставк/i },
  { kind: "remont", match: /ремонт|отделк|приёмк|приемк|дизайн|white box/i },
  { kind: "price", match: /район|застройщик|девелопмент|брусник|атомстрой|астон|атлас/i },
];

/** Средний блок по теме статьи: по категории, тегам и заголовку; нет совпадения — блока нет. */
export function topicBlock(article: Article): LeadBlock | null {
  const haystack = [article.category ?? "", (article.tags ?? []).join(" "), article.title].join(" ");
  const topic = TOPICS.find((t) => t.match.test(haystack));
  return topic ? LEAD_BLOCKS[topic.kind] : null;
}

/**
 * Делит Markdown статьи на три части: до конца 2-го абзаца, до середины
 * (ближайший к середине заголовок ## или ###) и остаток. Блоки кода и таблицы
 * не режутся: граница ставится только между блоками, разделёнными пустой строкой.
 */
export function splitArticle(content: string): [string, string, string] {
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && line.trim() === "") {
      if (current.length) blocks.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  const isParagraph = (b: string) => !/^\s*([#|>!*\-+]|\d+[.)]\s|```|~~~|<)/.test(b);
  let paragraphs = 0;
  let first = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (isParagraph(blocks[i]) && ++paragraphs === 2) {
      first = i + 1;
      break;
    }
  }
  if (first <= 0 || first >= blocks.length) return [content, "", ""];

  // Середина по объёму текста, а не по числу блоков: таблица — один блок, но длинный.
  const total = blocks.reduce((n, b) => n + b.length, 0);
  let acc = 0;
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < blocks.length; i++) {
    // FAQ в конце статьи разбирается в разметку FAQPage — блок перед ним не ставим.
    if (i > first + 1 && /^#{2,3}\s/.test(blocks[i]) && !/вопрос|faq/i.test(blocks[i])) {
      const distance = Math.abs(acc - total / 2);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    acc += blocks[i].length;
  }
  const join = (from: number, to: number) => blocks.slice(from, to).join("\n\n");
  if (best === -1) return [join(0, first), join(first, blocks.length), ""];
  return [join(0, first), join(first, best), join(best, blocks.length)];
}

// ───────────────────────── ссылки из статьи на ЖК и подборки ─────────────────────────

function stem(word: string): string {
  const lower = word.toLowerCase();
  return lower.length > 5 ? lower.slice(0, -2) : lower;
}

/** ЖК, которые статья называет по имени, — в порядке первого упоминания. */
export function projectsMentioned(article: Article, cards: CatalogCard[], limit = 6): CatalogCard[] {
  const text = `${article.title}\n${article.content}`.toLowerCase();
  return cards
    .map((card) => {
      const name = card.name.toLowerCase();
      // Однословные имена («Традиции», «Лайв») — обычные слова, их засчитываем
      // только в виде «ЖК Традиции» или «Традиции» в кавычках.
      const needles = /[\s\d.-]/.test(name) ? [name] : [`жк ${name}`, `жк «${name}`, `«${name}»`];
      const positions = needles.map((n) => text.indexOf(n)).filter((i) => i !== -1);
      return { card, at: positions.length ? Math.min(...positions) : -1 };
    })
    .filter((x) => x.at !== -1)
    // В базе встречаются корпуса одного ЖК под одним именем в разном регистре.
    .filter((x, i, all) => all.findIndex((y) => y.card.name.toLowerCase() === x.card.name.toLowerCase()) === i)
    .sort((a, b) => a.at - b.at)
    .slice(0, limit)
    .map((x) => x.card);
}

/** Подборки каталога по теме статьи: районы и комнатность из текста, «с отделкой». */
export function picksMentioned(article: Article, picks: CatalogPick[], limit = 4): CatalogPick[] {
  const text = `${article.title}\n${article.content}`.toLowerCase();
  const head = `${article.title} ${article.category ?? ""} ${(article.tags ?? []).join(" ")}`.toLowerCase();
  const found: CatalogPick[] = [];
  const add = (path: string) => {
    const pick = picks.find((p) => p.indexable && p.path === path);
    if (pick && !found.includes(pick)) found.push(pick);
  };

  for (const district of DISTRICTS) {
    const names = [district.name, ...district.raw].map(stem);
    if (names.some((n) => head.includes(n))) add(`/catalog/${district.slug}`);
  }
  const roomPatterns: Record<string, RegExp> = {
    studiya: /студи/,
    "1k": /однокомнат|1-комнат|однушк/,
    "2k": /двухкомнат|2-комнат|двушк/,
    "3k": /трёхкомнат|трехкомнат|3-комнат|трёшк|трешк/,
  };
  for (const type of ROOM_TYPES) {
    if (roomPatterns[type.slug]?.test(head)) add(`/catalog/${type.slug}`);
  }
  if (/отделк|white box|ремонт/.test(head)) add("/catalog/s-otdelkoy");
  if (/сданн|готов[а-я]* (дом|жиль|квартир)|вторичк/.test(text) && /сдан/.test(head)) add("/catalog/sdannye");
  return found.slice(0, limit);
}
