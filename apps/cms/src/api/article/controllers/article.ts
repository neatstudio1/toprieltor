import { factories } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';

const COVER_FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetches an image server-side and uploads it into the Media Library,
 * returning the new file's id. Server-to-server fetch, so unlike the
 * browser's "Add from URL" widget it isn't subject to the source host's
 * CORS policy — this is what lets the content-factory set a cover by URL
 * without needing CORS support from wherever it hosts images.
 */
async function uploadCoverFromUrl(strapi: Core.Strapi, url: string): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COVER_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    throw new Error(`не удалось загрузить cover_url: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`cover_url вернул HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`cover_url — не изображение (content-type: ${contentType || 'неизвестен'})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = (contentType.split('/')[1]?.split(';')[0] || 'jpg').replace('jpeg', 'jpg');
  const filename = `cover-${randomUUID()}.${ext}`;
  const tmpPath = path.join(os.tmpdir(), filename);
  await fs.promises.writeFile(tmpPath, buffer);

  try {
    const [uploaded] = await strapi.plugin('upload').service('upload').upload({
      data: {},
      files: {
        filepath: tmpPath,
        originalFilename: filename,
        newFilename: filename,
        mimetype: contentType,
        size: buffer.length,
      },
    });
    return uploaded.id;
  } finally {
    await fs.promises.unlink(tmpPath).catch(() => {});
  }
}

/**
 * POST /api/articles is idempotent on `slug`: the content-factory can retry
 * or re-publish the same run without creating duplicates — a second POST
 * with a slug that already exists updates that article instead (ТЗ §7).
 */
export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  async create(ctx) {
    const data = ctx.request.body?.data ?? {};
    const slug = data.slug;

    if (typeof data.cover_url === 'string' && data.cover_url.trim()) {
      try {
        data.cover = await uploadCoverFromUrl(strapi, data.cover_url.trim());
      } catch (err) {
        ctx.status = 400;
        ctx.body = { error: { status: 400, name: 'ValidationError', message: (err as Error).message } };
        return;
      }
      delete data.cover_url;
    }

    if (typeof slug === 'string' && slug.trim()) {
      const existing = await strapi.documents('api::article.article').findFirst({
        filters: { slug },
      });

      if (existing) {
        const updated = await strapi.documents('api::article.article').update({
          documentId: existing.documentId,
          data,
          status: ctx.request.query?.status === 'draft' ? 'draft' : 'published',
        });
        ctx.status = 200;
        ctx.body = { data: updated, meta: { idempotent: 'updated-existing-slug' } };
        return;
      }
    }

    return await super.create(ctx);
  },

  /** Public, unauthenticated: bumps the published article's view counter by 1. */
  async incrementViews(ctx) {
    const { id } = ctx.params;
    const existing = await strapi.documents('api::article.article').findOne({
      documentId: id,
      fields: ['views'],
    });
    if (!existing) {
      ctx.status = 404;
      ctx.body = { error: { status: 404, name: 'NotFoundError', message: 'Article not found' } };
      return;
    }
    const updated = await strapi.documents('api::article.article').update({
      documentId: id,
      data: { views: (existing.views ?? 0) + 1 },
      status: 'published',
    });
    ctx.status = 200;
    ctx.body = { data: { views: updated?.views ?? (existing.views ?? 0) + 1 } };
  },
}));
