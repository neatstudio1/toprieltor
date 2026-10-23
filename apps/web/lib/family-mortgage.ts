/**
 * Семейная ипотека с 1 октября 2026 года, регионы кроме Москвы, Санкт-Петербурга
 * и их областей: ставка и лимит кредита зависят от числа детей.
 *
 * Лежит в коде, а не в Strapi: компонент «Ставка» в CMS не умеет зависеть от
 * числа детей. Источники: harant.ru и altapress.ru (со ссылкой на Минфин),
 * проверено 2026-10-23. Менять здесь, если условия изменятся.
 */

export interface FamilyTier {
  children: 1 | 2 | 3 | 4 | 5;
  label: string;
  rate: number;
  /** Максимальная сумма кредита по льготной ставке, ₽. */
  maxLoan: number;
}

export const FAMILY_LABEL = "Семейная ипотека";

/** Государство субсидирует ставку только первые 15 лет, дальше ставка рыночная. */
export const FAMILY_SUBSIDY_YEARS = 15;

export const FAMILY_TIERS: FamilyTier[] = [
  { children: 1, label: "1 ребёнок", rate: 0.1, maxLoan: 6_000_000 },
  { children: 2, label: "2 ребёнка", rate: 0.08, maxLoan: 8_000_000 },
  { children: 3, label: "3 ребёнка", rate: 0.06, maxLoan: 10_000_000 },
  { children: 4, label: "4 ребёнка", rate: 0.04, maxLoan: 10_000_000 },
  { children: 5, label: "5 и больше", rate: 0.02, maxLoan: 10_000_000 },
];

/** Для карточек подборки берём самый осторожный вариант: один ребёнок, ставка 10%. */
export const CARD_TIER = FAMILY_TIERS[0];
