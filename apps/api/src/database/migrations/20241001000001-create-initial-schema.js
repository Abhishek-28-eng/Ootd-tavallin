'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ─── users ────────────────────────────────────────────────────────────────
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(320),
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('user', 'moderator', 'admin', 'super_admin'),
        defaultValue: 'user',
        allowNull: false,
      },
      is_email_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      is_onboarded: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      is_private: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      is_suspended: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      suspended_at: { type: Sequelize.DATE, allowNull: true },
      suspended_until: { type: Sequelize.DATE, allowNull: true },
      suspension_reason: { type: Sequelize.STRING(500), allowNull: true },
      last_active_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_unique' });
    await queryInterface.addIndex('users', ['username'], { unique: true, name: 'users_username_unique' });
    await queryInterface.addIndex('users', ['role'], { name: 'users_role' });
    await queryInterface.addIndex('users', ['is_suspended'], { name: 'users_is_suspended' });
    await queryInterface.addIndex('users', ['created_at'], { name: 'users_created_at' });
    await queryInterface.addIndex('users', ['deleted_at'], { name: 'users_deleted_at' });

    // ─── user_profiles ────────────────────────────────────────────────────────
    await queryInterface.createTable('user_profiles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      display_name: { type: Sequelize.STRING(50), allowNull: false },
      avatar_url: { type: Sequelize.STRING(2048), allowNull: true },
      bio: { type: Sequelize.STRING(300), allowNull: true },
      location: { type: Sequelize.STRING(100), allowNull: true },
      website: { type: Sequelize.STRING(2048), allowNull: true },
      followers_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0, allowNull: false },
      following_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0, allowNull: false },
      posts_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });

    // ─── user_preferences ─────────────────────────────────────────────────────
    await queryInterface.createTable('user_preferences', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      style_categories: { type: Sequelize.TEXT, defaultValue: '[]', allowNull: false },
      occasions: { type: Sequelize.TEXT, defaultValue: '[]', allowNull: false },
      color_preferences: { type: Sequelize.TEXT, defaultValue: '[]', allowNull: false },
      fit_preferences: { type: Sequelize.TEXT, defaultValue: '[]', allowNull: false },
      budget_min: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      budget_max: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'INR', allowNull: false },
      city: { type: Sequelize.STRING(100), allowNull: true },
      brands: { type: Sequelize.TEXT, defaultValue: '[]', allowNull: false },
      show_budget_on_profile: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });

    // ─── refresh_tokens ───────────────────────────────────────────────────────
    await queryInterface.createTable('refresh_tokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE(3), allowNull: false },
      is_revoked: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      device_info: { type: Sequelize.STRING(500), allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id'], { name: 'refresh_tokens_user_id' });
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], { unique: true, name: 'refresh_tokens_hash_unique' });
    await queryInterface.addIndex('refresh_tokens', ['expires_at'], { name: 'refresh_tokens_expires_at' });
    await queryInterface.addIndex('refresh_tokens', ['is_revoked'], { name: 'refresh_tokens_is_revoked' });

    // ─── password_reset_tokens ────────────────────────────────────────────────
    await queryInterface.createTable('password_reset_tokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE(3), allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('password_reset_tokens', ['token_hash'], { unique: true });
    await queryInterface.addIndex('password_reset_tokens', ['user_id']);

    // ─── email_verification_tokens ────────────────────────────────────────────
    await queryInterface.createTable('email_verification_tokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE(3), allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('email_verification_tokens', ['token_hash'], { unique: true });
    await queryInterface.addIndex('email_verification_tokens', ['user_id']);

    // ─── follows ──────────────────────────────────────────────────────────────
    await queryInterface.createTable('follows', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      follower_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      following_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('follows', ['follower_id', 'following_id'], { unique: true, name: 'unique_follow' });
    await queryInterface.addIndex('follows', ['follower_id']);
    await queryInterface.addIndex('follows', ['following_id']);

    // ─── user_blocks ──────────────────────────────────────────────────────────
    await queryInterface.createTable('user_blocks', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      blocker_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      blocked_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('user_blocks', ['blocker_id', 'blocked_id'], { unique: true, name: 'unique_block' });

    // ─── style_categories ─────────────────────────────────────────────────────
    await queryInterface.createTable('style_categories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(500), allowNull: true },
      emoji: { type: Sequelize.STRING(10), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      posts_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });

    // ─── outfit_posts ─────────────────────────────────────────────────────────
    await queryInterface.createTable('outfit_posts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      caption: { type: Sequelize.TEXT, allowNull: true },
      style_categories: { type: Sequelize.TEXT, defaultValue: '[]' },
      occasions: { type: Sequelize.TEXT, defaultValue: '[]' },
      budget_min: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      budget_max: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'INR', allowNull: false },
      clothing_details: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('draft', 'published', 'removed', 'under_review'), defaultValue: 'published', allowNull: false },
      likes_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      comments_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      saves_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      published_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('outfit_posts', ['user_id', 'created_at'], { name: 'outfit_posts_user_created' });
    await queryInterface.addIndex('outfit_posts', ['status', 'created_at'], { name: 'outfit_posts_status_created' });
    await queryInterface.addIndex('outfit_posts', ['deleted_at']);
    await queryInterface.addIndex('outfit_posts', ['likes_count']);

    // ─── outfit_media ─────────────────────────────────────────────────────────
    await queryInterface.createTable('outfit_media', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      outfit_post_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'outfit_posts', key: 'id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      object_key: { type: Sequelize.STRING(1024), allowNull: false },
      public_url: { type: Sequelize.STRING(2048), allowNull: false },
      thumbnail_url: { type: Sequelize.STRING(2048), allowNull: true },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      file_size: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      width: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      height: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      order_index: { type: Sequelize.TINYINT.UNSIGNED, defaultValue: 0, allowNull: false },
      is_processed: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('outfit_media', ['outfit_post_id', 'order_index']);

    // ─── tags ─────────────────────────────────────────────────────────────────
    await queryInterface.createTable('tags', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      posts_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });

    // ─── outfit_tags ──────────────────────────────────────────────────────────
    await queryInterface.createTable('outfit_tags', {
      outfit_post_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'outfit_posts', key: 'id' }, onDelete: 'CASCADE', primaryKey: true },
      tag_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tags', key: 'id' }, onDelete: 'CASCADE', primaryKey: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('outfit_tags', ['outfit_post_id']);
    await queryInterface.addIndex('outfit_tags', ['tag_id']);

    // ─── post_likes ───────────────────────────────────────────────────────────
    await queryInterface.createTable('post_likes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      outfit_post_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'outfit_posts', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('post_likes', ['user_id', 'outfit_post_id'], { unique: true, name: 'unique_post_like' });
    await queryInterface.addIndex('post_likes', ['outfit_post_id']);

    // ─── comments ─────────────────────────────────────────────────────────────
    await queryInterface.createTable('comments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      outfit_post_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'outfit_posts', key: 'id' }, onDelete: 'CASCADE' },
      parent_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'comments', key: 'id' }, onDelete: 'CASCADE' },
      content: { type: Sequelize.STRING(1000), allowNull: false },
      likes_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      replies_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('comments', ['outfit_post_id', 'created_at']);
    await queryInterface.addIndex('comments', ['parent_id']);

    // ─── collections ──────────────────────────────────────────────────────────
    await queryInterface.createTable('collections', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.STRING(500), allowNull: true },
      cover_image_url: { type: Sequelize.STRING(2048), allowNull: true },
      is_public: { type: Sequelize.BOOLEAN, defaultValue: false },
      items_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('collections', ['user_id', 'created_at']);

    // ─── saved_outfits ────────────────────────────────────────────────────────
    await queryInterface.createTable('saved_outfits', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      outfit_post_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'outfit_posts', key: 'id' }, onDelete: 'CASCADE' },
      collection_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'collections', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('saved_outfits', ['user_id', 'outfit_post_id'], { unique: true, name: 'unique_saved_outfit' });
    await queryInterface.addIndex('saved_outfits', ['user_id']);
    await queryInterface.addIndex('saved_outfits', ['collection_id']);

    // ─── product_references ───────────────────────────────────────────────────
    await queryInterface.createTable('product_references', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      outfit_post_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'outfit_posts', key: 'id' }, onDelete: 'CASCADE' },
      product_name: { type: Sequelize.STRING(200), allowNull: false },
      brand: { type: Sequelize.STRING(100), allowNull: true },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      currency: { type: Sequelize.CHAR(3), defaultValue: 'INR', allowNull: false },
      product_url: { type: Sequelize.STRING(2048), allowNull: false },
      image_url: { type: Sequelize.STRING(2048), allowNull: true },
      is_affiliate: { type: Sequelize.BOOLEAN, defaultValue: false },
      affiliate_disclosure_url: { type: Sequelize.STRING(2048), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('product_references', ['outfit_post_id']);

    // ─── notifications ────────────────────────────────────────────────────────
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      actor_id: { type: Sequelize.UUID, allowNull: true },
      type: { type: Sequelize.STRING(50), allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      body: { type: Sequelize.STRING(500), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: true },
      target_type: { type: Sequelize.STRING(50), allowNull: true },
      deep_link: { type: Sequelize.STRING(500), allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'created_at'], { name: 'notifications_user_created' });
    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], { name: 'notifications_user_read' });

    // ─── device_tokens ────────────────────────────────────────────────────────
    await queryInterface.createTable('device_tokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token: { type: Sequelize.STRING(500), allowNull: false, unique: true },
      platform: { type: Sequelize.ENUM('ios', 'android'), allowNull: false },
      expo_token: { type: Sequelize.STRING(500), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      last_used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('device_tokens', ['user_id']);
    await queryInterface.addIndex('device_tokens', ['token'], { unique: true });

    // ─── content_reports ──────────────────────────────────────────────────────
    await queryInterface.createTable('content_reports', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      reporter_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      target_type: { type: Sequelize.ENUM('outfit', 'user', 'comment'), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      category: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'under_review', 'resolved', 'dismissed'), defaultValue: 'pending' },
      resolved_by_id: { type: Sequelize.UUID, allowNull: true },
      moderation_note: { type: Sequelize.STRING(500), allowNull: true },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('content_reports', ['reporter_id']);
    await queryInterface.addIndex('content_reports', ['target_type', 'target_id'], { name: 'content_reports_target' });
    await queryInterface.addIndex('content_reports', ['status', 'created_at'], { name: 'content_reports_status_created' });

    // ─── moderation_actions ───────────────────────────────────────────────────
    await queryInterface.createTable('moderation_actions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      moderator_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      report_id: { type: Sequelize.UUID, allowNull: true },
      target_type: { type: Sequelize.STRING(50), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING(100), allowNull: false },
      note: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('moderation_actions', ['moderator_id']);

    // ─── audit_logs ───────────────────────────────────────────────────────────
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      actor_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING(100), allowNull: false },
      target_type: { type: Sequelize.STRING(50), allowNull: false },
      target_id: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.STRING(500), allowNull: false },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      metadata: { type: Sequelize.TEXT, defaultValue: '{}' },
      created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      updated_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
    });
    await queryInterface.addIndex('audit_logs', ['actor_id', 'created_at'], { name: 'audit_logs_actor_created' });
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['target_type', 'target_id'], { name: 'audit_logs_target' });
  },

  async down(queryInterface) {
    // Drop in reverse order (respecting FK dependencies)
    const tables = [
      'audit_logs', 'moderation_actions', 'content_reports',
      'device_tokens', 'notifications', 'product_references',
      'saved_outfits', 'collections', 'comments', 'post_likes',
      'outfit_tags', 'tags', 'outfit_media', 'outfit_posts',
      'style_categories', 'user_blocks', 'follows',
      'email_verification_tokens', 'password_reset_tokens',
      'refresh_tokens', 'user_preferences', 'user_profiles', 'users',
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table, { cascade: true });
    }
  },
};
