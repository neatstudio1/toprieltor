export default {
  routes: [
    {
      method: 'POST',
      path: '/articles/:id/view',
      handler: 'article.incrementViews',
      config: {
        auth: false,
      },
    },
  ],
};
