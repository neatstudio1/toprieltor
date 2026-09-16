/**
 * Яндекс.Метрика: цели и разметка трафика (2026-09-16).
 *
 * Счётчик стоял с запуска, но ни один `reachGoal` в коде не вызывался — в
 * отчётах были визиты и не было конверсий. Пока трафик шёл из поиска, с этим
 * можно было жить. С приходом YouTube Shorts понадобилось знать не «сколько
 * пришло», а какой ролик доводит до заявки: просмотры там исчисляются
 * тысячами, а обращений не было ни одного, и без целей причину не найти.
 *
 * Все вызовы безопасны. Счётчик грузится стратегией afterInteractive, его
 * вырезают блокировщики, а в России YouTube смотрят через VPN — то есть
 * ситуация «ym ещё/уже нет» штатная, а не исключение. В ней функции молча
 * ничего не делают и никогда не роняют форму.
 */

export const YANDEX_METRIKA_ID = 111869737;

/**
 * Цели. Имена латиницей и без пробелов: их же вбивают руками в интерфейсе
 * Метрики при создании цели типа «JavaScript-событие».
 */
export const GOALS = {
  /** Первый ответ в квизе — человек начал, а не просто открыл страницу. */
  quizStart: "quiz_start",
  /** Дошёл до шага с телефоном. Главная точка отвала, её и меряем. */
  quizContact: "quiz_contact",
  /** Заявка из квиза ушла в CMS. */
  quizSubmit: "quiz_submit",
  /** Заявка из модального окна (кнопки «записаться на просмотр» и т.п.). */
  leadSubmit: "lead_submit",
} as const;

export type GoalName = (typeof GOALS)[keyof typeof GOALS];

type YmFn = (id: number, method: string, ...rest: unknown[]) => void;

function ym(): YmFn | null {
  if (typeof window === "undefined") return null;
  const fn = (window as unknown as { ym?: YmFn }).ym;
  return typeof fn === "function" ? fn : null;
}

/**
 * Отправить цель. `params` уходят параметрами визита — по ним в отчёте
 * «Цели» раскладывается, с какого ролика пришёл человек.
 */
export function reachGoal(goal: GoalName, params?: Record<string, unknown>): void {
  try {
    ym()?.(YANDEX_METRIKA_ID, "reachGoal", goal, params);
  } catch {
    /* аналитика не должна ломать сценарий пользователя */
  }
}

/**
 * utm_campaign из адреса страницы. В подписях к роликам это слово-триггер
 * латиницей (`stavka`, `etazh`, `kotlovan`) — по нему видно, какая тема
 * привела человека, а не безликое «переход с YouTube».
 *
 * Читаем из `window.location`, а не через `useSearchParams`: страницы
 * статические, и хук потребовал бы оборачивать их в Suspense ради параметра,
 * который ни на отрисовку, ни на индексацию не влияет.
 */
export function campaignFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = new URLSearchParams(window.location.search).get("utm_campaign");
    if (!raw) return null;
    // в CMS и в цель уходит только то, что мы сами могли проставить
    const clean = raw.trim().toLowerCase().slice(0, 40);
    return /^[a-z0-9_-]+$/.test(clean) ? clean : null;
  } catch {
    return null;
  }
}

/** Источник перехода целиком — чтобы в карточке лида было видно происхождение. */
export function trafficSource(): { campaign: string | null; medium: string | null } {
  if (typeof window === "undefined") return { campaign: null, medium: null };
  try {
    const q = new URLSearchParams(window.location.search);
    const medium = q.get("utm_medium");
    return {
      campaign: campaignFromUrl(),
      medium: medium && /^[a-z0-9_-]{1,40}$/i.test(medium) ? medium.toLowerCase() : null,
    };
  } catch {
    return { campaign: null, medium: null };
  }
}
