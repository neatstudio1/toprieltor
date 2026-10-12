/**
 * Уведомление в Telegram о каждой новой заявке — со всех источников.
 *
 * Токен бота и чат берутся из env (LEAD_BOT_TOKEN, LEAD_BOT_CHAT_ID). Бот личный:
 * в чат уходит только если id совпадает с владельцем из bot/owner.ts, любой другой
 * id из env отбрасывается. Нет настроек — один раз предупреждаем в лог и молчим. Сбой отправки никогда не роняет создание заявки: уведомление уходит
 * в фоне с таймаутом, ошибка только пишется в лог.
 */

import { isOwner } from '../../../../bot/owner';

const TIMEOUT_MS = 5000;
let warnedAboutMissingConfig = false;

const SOURCE_LABEL: Record<string, string> = {
  viewing: 'форма «Записаться на просмотр»',
  quiz: 'квиз на сайте',
  landing: 'посадочная страница',
};

const MESSENGER_LABEL: Record<string, string> = {
  telegram: 'Telegram',
  max: 'MAX',
  call: 'звонок',
};

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const ANSWER_LABEL: Record<string, string> = {
  goal: 'Цель',
  rooms: 'Комнат',
  down: 'Взнос',
  budget: 'Бюджет',
  matkap: 'Маткапитал',
  term: 'Срок',
};

function answerLines(answers: unknown): string[] {
  if (!answers || typeof answers !== 'object') return [];
  return Object.entries(answers as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object')
    .map(([k, v]) => `• ${esc(ANSWER_LABEL[k] ?? k)}: ${esc(typeof v === 'number' ? v.toLocaleString('ru-RU') : v)}`);
}

export function buildLeadMessage(lead: Record<string, any>, adminBase: string): string {
  const phone = String(lead.phone ?? '');
  const lines: string[] = ['<b>Новая заявка</b>'];

  const source = SOURCE_LABEL[lead.lead_source] ?? esc(lead.lead_source);
  lines.push(`Источник: ${source}${lead.landing ? ` · <code>${esc(lead.landing)}</code>` : ''}`);
  if (lead.name) lines.push(`Имя: ${esc(lead.name)}`);
  lines.push(`Телефон: <a href="tel:${esc(phone)}">${esc(phone)}</a>`);
  if (lead.messenger) lines.push(`Связаться: ${MESSENGER_LABEL[lead.messenger] ?? esc(lead.messenger)}`);
  if (lead.comment) lines.push(`Комментарий: ${esc(lead.comment)}`);

  const answers = answerLines(lead.quiz_answers);
  if (answers.length) lines.push('', '<b>Ответы квиза</b>', ...answers);
  const matched = lead.quiz_answers?.matched;
  if (matched && typeof matched === 'object' && matched.count !== undefined) {
    lines.push(`Нашлось квартир: ${esc(matched.count)}${matched.projects ? ` в ${esc(matched.projects)} ЖК` : ''}`);
  }

  if (lead.utm && typeof lead.utm === 'object') {
    const term = lead.utm.utm_term;
    const campaign = lead.utm.utm_campaign;
    if (term || campaign) lines.push('');
    if (term) lines.push(`Запрос в Директе: ${esc(term)}`);
    if (campaign) lines.push(`Кампания: ${esc(campaign)}`);
  }

  if (lead.source_path) lines.push('', `Страница: ${esc(lead.source_path)}`);
  if (lead.documentId) {
    lines.push(
      `<a href="${esc(adminBase)}/admin/content-manager/collection-types/api::lead.lead/${esc(lead.documentId)}">Открыть в админке</a>`,
    );
  }
  return lines.join('\n');
}

async function notify(lead: Record<string, any>): Promise<void> {
  const token = process.env.LEAD_BOT_TOKEN;
  const configured = String(process.env.LEAD_BOT_CHAT_ID ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const chats = configured.filter(isOwner);
  const rejected = configured.filter((id) => !isOwner(id));
  if (rejected.length) {
    strapi.log.warn(`[lead-notify] id ${rejected.join(', ')} не владелец — заявки туда не отправляются.`);
  }

  if (!token || !chats.length) {
    if (!warnedAboutMissingConfig) {
      warnedAboutMissingConfig = true;
      strapi.log.warn('[lead-notify] LEAD_BOT_TOKEN / LEAD_BOT_CHAT_ID не заданы — заявки не уходят в Telegram.');
    }
    return;
  }

  const api = process.env.LEAD_BOT_API || 'https://api.telegram.org';
  const adminBase = (process.env.PUBLIC_ADMIN_URL || 'http://localhost:1337').replace(/\/$/, '');
  const text = buildLeadMessage(lead, adminBase);

  await Promise.all(
    chats.map(async (chatId) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`${api}/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          strapi.log.error(`[lead-notify] Telegram ответил ${res.status} для чата ${chatId}`);
        }
      } catch (err) {
        strapi.log.error(`[lead-notify] не удалось отправить в чат ${chatId}: ${(err as Error).message}`);
      } finally {
        clearTimeout(timer);
      }
    }),
  );
}

export default {
  afterCreate(event: { result: Record<string, any> }) {
    // Намеренно без await: ответ клиенту не ждёт Telegram.
    void notify(event.result).catch((err) => strapi.log.error(`[lead-notify] ${(err as Error).message}`));
  },
};
