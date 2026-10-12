import type { StrapiApp } from '@strapi/strapi/admin';
import { Mail } from '@strapi/icons';

export default {
  config: {
    locales: ['ru'],
  },
  register(app: StrapiApp) {
    // Отдельная страница «Заявки» в левом меню — чтобы не искать их в Content Manager.
    app.addMenuLink({
      to: '/leads',
      icon: Mail,
      intlLabel: { id: 'leads.menu.label', defaultMessage: 'Заявки' },
      Component: () => import('./pages/Leads'),
      permissions: [],
      position: 1,
    });
  },
  bootstrap(_app: StrapiApp) {},
};
