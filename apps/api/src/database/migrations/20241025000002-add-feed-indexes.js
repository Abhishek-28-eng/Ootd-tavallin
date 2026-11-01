'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Composite index on outfit_posts for chronologic feed queries
    try {
      await queryInterface.addIndex(
        'outfit_posts',
        ['status', 'deleted_at', 'created_at'],
        { name: 'idx_outfit_posts_feed_created' }
      );
    } catch (_) {}

    // 2. Composite index on outfit_posts for trending feed queries
    try {
      await queryInterface.addIndex(
        'outfit_posts',
        ['status', 'deleted_at', 'likes_count', 'created_at'],
        { name: 'idx_outfit_posts_feed_trending' }
      );
    } catch (_) {}

    // 3. User posts index
    try {
      await queryInterface.addIndex(
        'outfit_posts',
        ['user_id', 'status', 'created_at'],
        { name: 'idx_outfit_posts_user_created' }
      );
    } catch (_) {}

    // 4. Notifications unread index
    try {
      await queryInterface.addIndex(
        'notifications',
        ['user_id', 'is_read', 'created_at'],
        { name: 'idx_notifications_user_unread' }
      );
    } catch (_) {}

    // 5. Device tokens active index
    try {
      await queryInterface.addIndex(
        'device_tokens',
        ['user_id', 'is_active'],
        { name: 'idx_device_tokens_user_active' }
      );
    } catch (_) {}
  },

  async down(queryInterface) {
    try { await queryInterface.removeIndex('outfit_posts', 'idx_outfit_posts_feed_created'); } catch (_) {}
    try { await queryInterface.removeIndex('outfit_posts', 'idx_outfit_posts_feed_trending'); } catch (_) {}
    try { await queryInterface.removeIndex('outfit_posts', 'idx_outfit_posts_user_created'); } catch (_) {}
    try { await queryInterface.removeIndex('notifications', 'idx_notifications_user_unread'); } catch (_) {}
    try { await queryInterface.removeIndex('device_tokens', 'idx_device_tokens_user_active'); } catch (_) {}
  },
};
