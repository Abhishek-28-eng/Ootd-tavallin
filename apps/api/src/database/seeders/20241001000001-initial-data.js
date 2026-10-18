'use strict';

const { v4: uuidv4 } = require('uuid');
const argon2 = require('argon2');

const STYLE_CATEGORIES = [
  { slug: 'korean_streetwear', name: 'Korean Streetwear', emoji: '🇰🇷', description: 'Trendy Korean-inspired street fashion' },
  { slug: 'minimalist', name: 'Minimalist', emoji: '⬜', description: 'Clean lines, neutral tones, less is more' },
  { slug: 'casual', name: 'Casual', emoji: '👕', description: 'Everyday comfortable and relaxed looks' },
  { slug: 'smart_casual', name: 'Smart Casual', emoji: '👔', description: 'Polished yet relaxed — office to dinner' },
  { slug: 'streetwear', name: 'Streetwear', emoji: '🧢', description: 'Urban culture-inspired fashion' },
  { slug: 'ethnic_traditional', name: 'Ethnic & Traditional', emoji: '🪔', description: 'Indian ethnic and traditional wear' },
  { slug: 'festive', name: 'Festive', emoji: '✨', description: 'Celebrations, weddings, and parties' },
  { slug: 'formal', name: 'Formal', emoji: '🎩', description: 'Professional and formal attire' },
  { slug: 'business_casual', name: 'Business Casual', emoji: '💼', description: 'Smart professional but not too formal' },
  { slug: 'athleisure', name: 'Athleisure', emoji: '🏃', description: 'Athletic meets leisure — gym to street' },
  { slug: 'bohemian', name: 'Bohemian', emoji: '🌸', description: 'Free-spirited, earthy, artistic' },
  { slug: 'vintage', name: 'Vintage', emoji: '🕰️', description: 'Retro-inspired and thrifted looks' },
  { slug: 'y2k', name: 'Y2K', emoji: '💿', description: 'Early 2000s nostalgia fashion revival' },
  { slug: 'dark_academia', name: 'Dark Academia', emoji: '📚', description: 'Scholarly, moody, literature-inspired' },
  { slug: 'cottagecore', name: 'Cottagecore', emoji: '🌿', description: 'Pastoral, floral, nature-inspired' },
  { slug: 'preppy', name: 'Preppy', emoji: '🎓', description: 'Classic collegiate American style' },
  { slug: 'grunge', name: 'Grunge', emoji: '🎸', description: 'Edgy, distressed, rock-inspired' },
  { slug: 'romantic', name: 'Romantic', emoji: '🌹', description: 'Feminine, delicate, soft and dreamy' },
  { slug: 'androgynous', name: 'Androgynous', emoji: '⚡', description: 'Gender-fluid, boundary-breaking looks' },
  { slug: 'eclectic', name: 'Eclectic', emoji: '🎨', description: 'Mix and match from multiple styles' },
];

const SAMPLE_TAGS = [
  'ootd', 'fashion', 'style', 'outfit', 'lookoftheday',
  'kolkata', 'delhi', 'mumbai', 'bangalore', 'pune',
  'summerlooks', 'winterfashion', 'monsoonvibes', 'festiveseason',
  'collegefashion', 'campusstyle', 'workwear', 'datenight',
  'streetstyle', 'budgetfashion', 'thrifted', 'sustainablefashion',
  'kurti', 'saree', 'kurta', 'lehenga', 'salwarkameez',
  'denim', 'blazer', 'sneakers', 'ethnic',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ─── Style Categories ──────────────────────────────────────────────────────
    await queryInterface.bulkInsert('style_categories', STYLE_CATEGORIES.map(cat => ({
      id: uuidv4(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      emoji: cat.emoji,
      is_active: true,
      posts_count: 0,
      created_at: now,
      updated_at: now,
    })));

    // ─── Tags ─────────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('tags', SAMPLE_TAGS.map(tag => ({
      id: uuidv4(),
      name: tag,
      slug: tag.toLowerCase().replace(/\s+/g, '-'),
      posts_count: 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    })));

    // ─── Super Admin User ──────────────────────────────────────────────────────
    // Password is read from env in real usage; here we use a strong default
    // CHANGE THIS IMMEDIATELY after first login
    const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'TavallinAdmin@2024!';
    const passwordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const adminId = uuidv4();
    const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@tavallin.com';

    await queryInterface.bulkInsert('users', [{
      id: adminId,
      email: adminEmail,
      username: 'tavallin_admin',
      password_hash: passwordHash,
      role: 'super_admin',
      is_email_verified: true,
      is_onboarded: true,
      is_private: false,
      is_suspended: false,
      created_at: now,
      updated_at: now,
    }]);

    await queryInterface.bulkInsert('user_profiles', [{
      id: uuidv4(),
      user_id: adminId,
      display_name: 'Tavallin Admin',
      avatar_url: null,
      bio: 'Platform administrator',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: now,
      updated_at: now,
    }]);

    await queryInterface.bulkInsert('user_preferences', [{
      id: uuidv4(),
      user_id: adminId,
      style_categories: '[]',
      occasions: '[]',
      color_preferences: '[]',
      fit_preferences: '[]',
      currency: 'INR',
      brands: '[]',
      show_budget_on_profile: false,
      created_at: now,
      updated_at: now,
    }]);

    console.log(`\n✅ Seed complete!`);
    console.log(`📧 Admin email: ${adminEmail}`);
    console.log(`🔑 Admin password: ${adminPassword}`);
    console.log(`⚠️  IMPORTANT: Change the admin password immediately after first login!\n`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_preferences', null, {});
    await queryInterface.bulkDelete('user_profiles', null, {});
    await queryInterface.bulkDelete('users', { role: 'super_admin' }, {});
    await queryInterface.bulkDelete('tags', null, {});
    await queryInterface.bulkDelete('style_categories', null, {});
  },
};
