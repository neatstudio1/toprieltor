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
  /** Посадочные /lp: клик по любой кнопке, открывающей форму. */
  lpCtaClick: "lp_cta_click",
  /** Посадочные /lp: заявка принята сервером — главная цель для оптимизации Директа. */
  lpLead: "lp_lead",
  lpTgClick: "lp_tg_click",
  lpPhoneClick: "lp_phone_click",
  /** /lp/podbory: первое действие с калькулятором ипотеки (один раз за визит). */
  lpCalcUse: "lp_calc_use",
  /** /lp/podbory: клик «Хочу такой вариант» в карточке подборки. */
  lpPickClick: "lp_pick_click",
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

/** Метки рекламы, которые мы вообще готовы хранить и отправлять вместе с заявкой. */
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"] as const;
export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const UTM_STORAGE_KEY = "lp_utm";

/**
 * Метки из адреса, сохранённые в sessionStorage при первом заходе: после
 * перезагрузки страницы или перехода по якорю они уже не в ссылке, а в заявку
 * должны попасть. Значения обрезаются, ключи — только из белого списка.
 */
export function captureUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  let stored: UtmParams = {};
  try {
    stored = JSON.parse(window.sessionStorage.getItem(UTM_STORAGE_KEY) ?? "{}") as UtmParams;
  } catch {
    stored = {};
  }
  let fromUrl: UtmParams = {};
  try {
    const q = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) {
      const value = q.get(key);
      if (value && value.trim()) fromUrl = { ...fromUrl, [key]: value.trim().slice(0, 200) };
    }
  } catch {
    fromUrl = {};
  }
  if (Object.keys(fromUrl).length === 0) return stored;
  try {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
  } catch {
    /* приватный режим — живём без хранилища */
  }
  return fromUrl;
}

/** Цель посадочной: во всех целях есть landing и utm_term, чтобы в Метрике резать по варианту и запросу. */
export function lpGoal(goal: GoalName, landing: string, params?: Record<string, unknown>): void {
  reachGoal(goal, { landing, utm_term: captureUtm().utm_term ?? "none", ...params });
}
