/**
 * Запросы к Telegram Bot API с обходом нестабильной сети сервера.
 *
 * С прод-сервера IPv4-адрес api.telegram.org (149.154.166.110) почти не
 * отвечает: соединение висит до таймаута. IPv6 отвечает за 0,1 с, но тоже не
 * всегда. Встроенный fetch идёт по IPv4 и обрывается, из-за этого заявка
 * создавалась, а уведомление в Telegram пропадало (2026-10-27).
 * Здесь запрос идёт по IPv6, затем по IPv4, с несколькими повторами.
 *
 * LEAD_BOT_API (тестовый сервер) работает как обычный адрес, без выбора IPv6/IPv4.
 */
import http from 'node:http';
import https from 'node:https';

const DEFAULT_API = 'https://api.telegram.org';
/** Порядок семейств адресов по попыткам: IPv6 надёжнее, IPv4 — запасной. */
const FAMILY_ORDER: (0 | 4 | 6)[] = [6, 6, 4];

export interface TelegramResult {
  ok: boolean;
  status: number;
  body: any;
}

function once(
  base: URL,
  token: string,
  method: string,
  payload: unknown,
  family: 0 | 4 | 6,
  timeoutMs: number,
): Promise<TelegramResult> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const secure = base.protocol === 'https:';
    const req = (secure ? https : http).request(
      {
        hostname: base.hostname,
        port: base.port || (secure ? 443 : 80),
        path: `/bot${token}/${method}`,
        method: 'POST',
        ...(family ? { family } : {}),
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          let body: any = null;
          try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          } catch {
            /* не JSON — оставим null */
          }
          resolve({ ok: (res.statusCode ?? 0) < 300, status: res.statusCode ?? 0, body });
        });
      },
    );
    // Общий таймер на попытку: включает и установку соединения.
    const timer = setTimeout(() => req.destroy(new Error('timeout')), timeoutMs);
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.on('close', () => clearTimeout(timer));
    req.end(data);
  });
}

/**
 * Вызов метода бота. Сбой сети и 5xx повторяем; ответ 4xx (бот заблокирован,
 * чат не найден) возвращаем сразу: повтор ничего не изменит.
 */
export async function telegramCall(
  token: string,
  method: string,
  payload: unknown,
  opts: { timeoutMs?: number; attempts?: number } = {},
): Promise<TelegramResult> {
  const base = new URL(process.env.LEAD_BOT_API || DEFAULT_API);
  const real = base.hostname === 'api.telegram.org';
  const timeoutMs = opts.timeoutMs ?? 7000;
  const attempts = opts.attempts ?? 5;

  let lastError: Error = new Error('нет попыток');
  for (let i = 0; i < attempts; i++) {
    const family = real ? FAMILY_ORDER[i % FAMILY_ORDER.length] : 0;
    try {
      const res = await once(base, token, method, payload, family, timeoutMs);
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
      lastError = new Error(`Telegram ответил ${res.status}`);
    } catch (err) {
      lastError = err as Error;
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw lastError;
}
