import { factories } from '@strapi/strapi';

const MIN_FILL_MS = 1200;

/** Accepts 8/+7 RU mobile numbers with optional spacing/braces, normalizes to +7XXXXXXXXXX. */
function normalizeRuPhone(raw: string): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  return null;
}

export default factories.createCoreController('api::lead.lead', ({ strapi }) => ({
  async create(ctx) {
    const body = ctx.request.body ?? {};
    const data = body.data ?? {};

    // Honeypot + time-trap: bots fill hidden fields and submit instantly.
    // Answer 200 without persisting anything — no signal for the bot to adapt to.
    const honeypotFilled = typeof body.website === 'string' && body.website.trim().length > 0;
    const filledTooFast = typeof body.elapsed_ms === 'number' && body.elapsed_ms < MIN_FILL_MS;
    if (honeypotFilled || filledTooFast) {
      strapi.log.warn(
        `[anti-spam] blocked lead submit ip=${ctx.request.ip} honeypot=${honeypotFilled} tooFast=${filledTooFast} at ${new Date().toISOString()}`,
      );
      ctx.status = 200;
      ctx.body = { data: null, meta: { accepted: true } };
      return;
    }

    const phone = normalizeRuPhone(data.phone);
    if (!phone) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'ValidationError', message: 'Некорректный номер телефона' } };
      return;
    }
    if (!data.name || !String(data.name).trim()) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'ValidationError', message: 'Укажите имя' } };
      return;
    }

    const hasQuizAnswers = data.quiz_answers && typeof data.quiz_answers === 'object';

    ctx.request.body = {
      data: {
        name: String(data.name).trim().slice(0, 200),
        phone,
        comment: data.comment ? String(data.comment).trim().slice(0, 2000) : null,
        source_path: data.source_path ? String(data.source_path).slice(0, 300) : null,
        source_title: data.source_title ? String(data.source_title).slice(0, 300) : null,
        lead_status: 'new',
        lead_source: hasQuizAnswers ? 'quiz' : 'viewing',
        quiz_answers: hasQuizAnswers ? data.quiz_answers : null,
      },
    };

    return await super.create(ctx);
  },
}));
