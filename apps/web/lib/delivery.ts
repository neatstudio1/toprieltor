/**
 * Сроки сдачи в базе — свободный текст с сайтов застройщиков, в нескольких
 * форматах сразу: «3 кв. 2026», «IV кв. 2028», «2 квартал 2027», «30.09.2026»,
 * «Сдан», «Дом сдан», «Сдано».
 */

const ROMAN_QUARTER: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

/** Застройщик прямо пишет, что дом сдан. */
export function isExplicitlyDelivered(text: string | null | undefined): boolean {
  return Boolean(text && /сдан/i.test(text));
}

/** Последний день срока: конец квартала или точная дата. null — срок не распознан. */
export function deliveryDeadline(text: string | null | undefined): Date | null {
  if (!text) return null;
  const exact = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (exact) return new Date(Number(exact[3]), Number(exact[2]) - 1, Number(exact[1]));
  const quarter = text.match(/\b(\d|I{1,3}|IV)\s*кв\S*\s*(\d{4})/i);
  if (quarter) {
    const q = /^\d$/.test(quarter[1]) ? Number(quarter[1]) : ROMAN_QUARTER[quarter[1].toUpperCase()];
    // День 0 следующего месяца — последний день квартала.
    return new Date(Number(quarter[2]), q * 3, 0);
  }
  return null;
}

/** Сдан ли дом: явное «сдан» или прошедший плановый срок сдачи. */
export function isDeliveredOrDue(text: string | null | undefined, now = new Date()): boolean {
  if (isExplicitlyDelivered(text)) return true;
  const deadline = deliveryDeadline(text);
  return deadline !== null && deadline.getTime() <= now.getTime();
}

export function deliveryYear(text: string | null | undefined): number | null {
  const match = text?.match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}
