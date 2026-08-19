import { factories } from '@strapi/strapi';

const MIN_FILL_MS = 1200;

export default factories.createCoreController('api::comment.comment', ({ strapi }) => ({
  // Public reads only ever see moderator-approved comments, regardless of
  // whatever filters the client sends — never trust the client to hide
  // pending/rejected comments from the public feed.
  async find(ctx) {
    const existingFilters = (ctx.query.filters as Record<string, unknown>) ?? {};
    ctx.query = {
      ...ctx.query,
      filters: { ...existingFilters, moderation_status: 'approved' },
    };
    return await super.find(ctx);
  },

  async create(ctx) {
    const body = ctx.request.body ?? {};
    const data = body.data ?? {};

    const honeypotFilled = typeof body.website === 'string' && body.website.trim().length > 0;
    const filledTooFast = typeof body.elapsed_ms === 'number' && body.elapsed_ms < MIN_FILL_MS;
    if (honeypotFilled || filledTooFast) {
      strapi.log.warn(
        `[anti-spam] blocked comment submit ip=${ctx.request.ip} honeypot=${honeypotFilled} tooFast=${filledTooFast} at ${new Date().toISOString()}`,
      );
      ctx.status = 200;
      ctx.body = { data: null, meta: { accepted: true } };
      return;
    }

    if (!data.author_name || !String(data.author_name).trim()) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'ValidationError', message: 'Укажите имя' } };
      return;
    }
    if (!data.text || !String(data.text).trim()) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'ValidationError', message: 'Комментарий не может быть пустым' } };
      return;
    }
    if (!data.article) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'ValidationError', message: 'Не указана статья' } };
      return;
    }

    ctx.request.body = {
      data: {
        author_name: String(data.author_name).trim().slice(0, 100),
        text: String(data.text).trim().slice(0, 2000),
        article: data.article,
        moderation_status: 'pending',
      },
    };

    return await super.create(ctx);
  },
}));
