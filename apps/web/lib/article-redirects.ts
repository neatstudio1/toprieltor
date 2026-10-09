/**
 * Статьи, слитые в другие. Ключ — слаг, который больше не живёт своей страницей,
 * значение — слаг статьи, куда перенесён его текст.
 *
 * Запись в Strapi остаётся (снять с публикации можно только из админки), поэтому
 * старый адрес закрываем на стороне сайта: 301 в next.config.ts и фильтр в
 * getArticles / getAllArticleSlugs, чтобы слаг пропал из блога, sitemap и llms.txt.
 * Две статьи на одну тему делили между собой запрос и обе проигрывали.
 */
export const MERGED_ARTICLES: Record<string, string> = {
  // 311 слов про пять причин отказа — теперь раздел «Если СФР или банк отказали».
  "matkapital-oshibki-otkaz": "matkapital-kak-pervonachalnyi-vznos",
};

export function isMergedArticle(slug: string): boolean {
  return Object.hasOwn(MERGED_ARTICLES, slug);
}
