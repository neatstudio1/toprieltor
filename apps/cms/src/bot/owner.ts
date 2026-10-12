/**
 * Бот заявок закрыт для всех, кроме владельца. Id прописан в коде намеренно:
 * ошибка в .env не должна открыть заявки постороннему.
 * Для личного чата Telegram id пользователя и id чата совпадают.
 */
export const OWNER_ID = '5014174429';

export function isOwner(id: unknown): boolean {
  return String(id ?? '').trim() === OWNER_ID;
}
