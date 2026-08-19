import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // The admin Content Manager's JSON field widget submits an empty string
    // for an untouched/cleared optional `json` attribute instead of omitting
    // it — Postgres's `json` column rejects `''` as invalid JSON syntax and
    // the whole save 500s. Normalize it to `null` before it reaches the DB,
    // for every content-type, so a blank JSON field never breaks a save.
    strapi.documents.use(async (context, next) => {
      if (
        (context.action === 'create' || context.action === 'update') &&
        context.params &&
        typeof context.params === 'object' &&
        'data' in context.params &&
        context.params.data &&
        typeof context.params.data === 'object'
      ) {
        const model = strapi.getModel(context.uid);
        const data = context.params.data as Record<string, unknown>;
        for (const [attrName, attr] of Object.entries(model.attributes)) {
          if (attr.type === 'json' && data[attrName] === '') {
            data[attrName] = null;
          }
        }
      }
      return next();
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
