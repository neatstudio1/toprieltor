import type { Article } from "@/lib/cms/client";

export interface ArticleService {
  slug: string;
  title: string;
  cta: string;
}

/**
 * Maps an article to the service page it should hand the reader over to.
 *
 * Blog articles are what actually rank for long-tail queries, but they were a
 * dead end — a reader arriving for "ипотека молодой семье" was never passed to
 * the commercial page. Matching on category/tags/title keeps this working for
 * articles the content factory publishes later, with no per-article setup.
 */
const SERVICES: { slug: string; title: string; cta: string; match: RegExp }[] = [
  {
    slug: "ipoteka",
    title: "Ипотека под ключ",
    cta: "Соберём заявку в 25+ банков и подберём программу под вашу ситуацию — бесплатно.",
    match: /ипотек|маткапитал|материнск|рассроч|первоначальн|ставк/i,
  },
  {
    slug: "urist",
    title: "Юридическая проверка",
    cta: "Проверим застройщика, ДДУ и эскроу до подписания — письменное заключение с зонами риска.",
    // Словоформы («проверить застройщика», «проверка застройщика») ловим явным
    // кириллическим классом: \w в JS — это [A-Za-z0-9_], кириллицу он не покрывает.
    match: /юрид|дду|эскроу|дольщик|банкрот|котлован|провер[а-яё]*\s+застройщик|право собственност|регистрац/i,
  },
  {
    slug: "priemka",
    title: "Приёмка квартиры",
    cta: "Приедем на приёмку с тепловизором и чек-листом на 120+ пунктов.",
    match: /приёмк|приемк|дефект|акт приё|акт прие/i,
  },
  {
    slug: "remont",
    title: "Ремонт и дизайн",
    cta: "Сделаем дизайн-проект и ремонт под ключ, материалы — по партнёрским ценам.",
    match: /ремонт|отделк|дизайн|планировк|меблиров/i,
  },
  {
    slug: "arenda",
    title: "Аренда и инвестиции",
    cta: "Посчитаем доходность и сдадим квартиру — или перепродадим, если цель инвестиционная.",
    match: /аренд|инвестиц|доходност|перепродаж|сдать/i,
  },
];

export function matchServiceForArticle(article: Article): ArticleService | null {
  const haystack = [article.category ?? "", (article.tags ?? []).join(" "), article.title].join(" ");
  const found = SERVICES.find((service) => service.match.test(haystack));
  if (!found) return null;
  return { slug: found.slug, title: found.title, cta: found.cta };
}

/**
 * Every article belonging to a service — the hub → spoke half of the internal
 * linking. Google ranks topical authority, not single pages, so a service page
 * should link out to all of its articles, not just three.
 */
export function articlesForService(articles: Article[], serviceSlug: string, limit = 9): Article[] {
  return articles
    .filter((article) => matchServiceForArticle(article)?.slug === serviceSlug)
    .slice(0, limit);
}

/**
 * Articles that genuinely mention `term` (a district or developer name).
 * Deliberately has no recency fallback: a district page listing unrelated
 * articles is worse than showing no block at all.
 */
export function articlesAbout(articles: Article[], term: string, limit = 6): Article[] {
  const needle = term.toLowerCase();
  const stem = needle.length > 5 ? needle.slice(0, -2) : needle;

  return articles
    .filter((article) => {
      const haystack = [article.title, article.excerpt ?? "", article.category ?? "", (article.tags ?? []).join(" ")]
        .join(" ")
        .toLowerCase();
      return haystack.includes(stem);
    })
    .slice(0, limit);
}
