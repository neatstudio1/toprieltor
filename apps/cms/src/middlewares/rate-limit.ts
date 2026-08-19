import type { Core } from '@strapi/strapi';

/**
 * In-memory sliding-window rate limiter for a few sensitive write routes
 * (ТЗ §8). Fine for a single-instance deployment — swap for a shared store
 * (Redis) if the CMS ever runs as multiple replicas.
 */
interface Rule {
  name: string;
  windowMs: number;
  max: number;
  matches: (ctx: any) => boolean;
  keyOf: (ctx: any) => string;
}

const RULES: Rule[] = [
  {
    name: 'articles',
    windowMs: 60_000,
    max: 30,
    matches: (ctx) =>
      ['POST', 'PUT', 'DELETE'].includes(ctx.request.method) &&
      (ctx.request.path === '/api/articles' || ctx.request.path.startsWith('/api/articles/')),
    keyOf: (ctx) => {
      const auth = ctx.request.header.authorization;
      return auth?.startsWith('Bearer ') ? `token:${auth.slice(7, 23)}` : `ip:${ctx.request.ip}`;
    },
  },
  {
    name: 'leads',
    windowMs: 60_000,
    max: 5,
    matches: (ctx) => ctx.request.method === 'POST' && ctx.request.path === '/api/leads',
    keyOf: (ctx) => `ip:${ctx.request.ip}`,
  },
  {
    name: 'comments',
    windowMs: 60_000,
    max: 5,
    matches: (ctx) => ctx.request.method === 'POST' && ctx.request.path === '/api/comments',
    keyOf: (ctx) => `ip:${ctx.request.ip}`,
  },
];

const hits = new Map<string, number[]>();

function isRateLimited(bucketKey: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(bucketKey) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  hits.set(bucketKey, timestamps);
  return timestamps.length > max;
}

export default (config: Record<string, unknown>, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const rule = RULES.find((r) => r.matches(ctx));
    if (!rule) return next();

    const key = `${rule.name}:${rule.keyOf(ctx)}`;
    if (isRateLimited(key, rule.windowMs, rule.max)) {
      strapi.log.warn(
        `[rate-limit] ${rule.name} blocked for ${key} (ip=${ctx.request.ip}) at ${new Date().toISOString()}`,
      );
      ctx.status = 429;
      ctx.body = { error: { status: 429, name: 'TooManyRequestsError', message: 'Too many requests, try again later.' } };
      return;
    }

    return next();
  };
};
