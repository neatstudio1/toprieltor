/**
 * Входящие сообщения боту заявок (long polling). Пускаем только владельца:
 * ему отвечаем, всем остальным — отказ, и больше ничего. Заявки посторонним
 * не уходят в принципе (см. lifecycles лида).
 */
import { isOwner } from './owner';
import { telegramCall } from './telegram';

const POLL_TIMEOUT_S = 25;
const REFUSE_COOLDOWN_MS = 60_000;

type Log = { info(m: string): void; warn(m: string): void; error(m: string): void };

interface Update {
  update_id: number;
  message?: { chat?: { id: number; type?: string }; from?: { id: number }; text?: string };
}

export function startLeadBot(log: Log): () => void {
  const token = process.env.LEAD_BOT_TOKEN;
  if (!token) return () => {};

  const lastRefusal = new Map<number, number>();
  let stopped = false;
  let offset = 0;

  const call = (method: string, body: Record<string, unknown>, timeoutMs: number, attempts: number) =>
    telegramCall(token, method, body, { timeoutMs, attempts }).then((r) => ({ ok: r.ok, result: r.body?.result, description: r.body?.description as string | undefined }));

  const send = (chatId: number, text: string) =>
    call('sendMessage', { chat_id: chatId, text }, 7000, 3).catch((e) => log.error(`[lead-bot] ${(e as Error).message}`));

  const handle = async (u: Update) => {
    const msg = u.message;
    const chatId = msg?.chat?.id;
    if (!msg || chatId === undefined) return;

    // Проверяем и автора, и чат: групповой чат с владельцем не считается.
    if (msg.chat?.type === 'private' && isOwner(msg.from?.id) && isOwner(chatId)) {
      await send(chatId, 'Готово. Новые заявки с сайта будут приходить сюда.');
      return;
    }

    const now = Date.now();
    if (now - (lastRefusal.get(chatId) ?? 0) < REFUSE_COOLDOWN_MS) return;
    lastRefusal.set(chatId, now);
    log.warn(`[lead-bot] отказ: попытка доступа от id ${msg.from?.id ?? 'неизвестен'}, чат ${chatId}`);
    await send(chatId, 'Доступ закрыт. Этот бот — личный.');
  };

  const loop = async () => {
    let failures = 0;
    while (!stopped) {
      try {
        // Один запрос на цикл: при сбое сети цикл сам повторит через паузу.
        const data = await call(
          'getUpdates',
          { offset, timeout: POLL_TIMEOUT_S, allowed_updates: ['message'] },
          (POLL_TIMEOUT_S + 10) * 1000,
          1,
        );
        if (!data.ok) {
          log.error(`[lead-bot] getUpdates: ${data.description ?? 'ошибка'}`);
          await new Promise((r) => setTimeout(r, 15_000));
          continue;
        }
        failures = 0;
        for (const u of data.result as Update[]) {
          offset = u.update_id + 1;
          await handle(u).catch((e) => log.error(`[lead-bot] ${(e as Error).message}`));
        }
      } catch (e) {
        if (stopped) break;
        // Сеть до Telegram нестабильна, одиночные сбои в журнал не пишем: первый и каждый двадцатый.
        failures += 1;
        if (failures === 1 || failures % 20 === 0) {
          log.error(`[lead-bot] нет связи с Telegram (${failures} подряд): ${(e as Error).message}`);
        }
        await new Promise((r) => setTimeout(r, 5_000));
      }
    }
  };

  void loop();
  log.info('[lead-bot] слушаю бота (доступ только владельцу)');
  return () => {
    stopped = true;
  };
}
