import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
  type HasManyGetAssociationsMixin,
  type HasOneGetAssociationMixin,
  type BelongsToManyGetAssociationsMixin,
} from 'sequelize';
import { sequelize } from '../../config/database';
import type { UserRole } from '@tavallin/shared';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare username: string;
  declare passwordHash: string;
  declare role: CreationOptional<UserRole>;
  declare isEmailVerified: CreationOptional<boolean>;
  declare isOnboarded: CreationOptional<boolean>;
  declare isPrivate: CreationOptional<boolean>;
  declare isSuspended: CreationOptional<boolean>;
  declare suspendedAt: CreationOptional<Date | null>;
  declare suspendedUntil: CreationOptional<Date | null>;
  declare suspensionReason: CreationOptional<string | null>;
  declare deletedAt: CreationOptional<Date | null>;
  declare lastActiveAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (populated via include)
  declare profile?: NonAttribute<UserProfile>;
  declare preferences?: NonAttribute<UserPreference>;

  // Association mixins
  declare getProfile: HasOneGetAssociationMixin<UserProfile>;
  declare getFollowers: BelongsToManyGetAssociationsMixin<User>;
  declare getFollowing: BelongsToManyGetAssociationsMixin<User>;
  declare getOutfitPosts: HasManyGetAssociationsMixin<OutfitPost>;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(320),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-zA-Z0-9_]+$/,
        len: [3, 30],
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'moderator', 'admin', 'super_admin'),
      defaultValue: 'user',
      allowNull: false,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isOnboarded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isSuspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    suspendedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    suspendedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    suspensionReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['username'], unique: true },
      { fields: ['role'] },
      { fields: ['is_suspended'] },
      { fields: ['created_at'] },
      { fields: ['deleted_at'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// UserProfile
// ─────────────────────────────────────────────────────────────────────────────

export class UserProfile extends Model<
  InferAttributes<UserProfile>,
  InferCreationAttributes<UserProfile>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare displayName: string;
  declare avatarUrl: CreationOptional<string | null>;
  declare bio: CreationOptional<string | null>;
  declare location: CreationOptional<string | null>;
  declare website: CreationOptional<string | null>;
  declare followersCount: CreationOptional<number>;
  declare followingCount: CreationOptional<number>;
  declare postsCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    bio: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    followersCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      allowNull: false,
    },
    followingCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      allowNull: false,
    },
    postsCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'user_profiles',
    underscored: true,
    indexes: [{ fields: ['user_id'], unique: true }],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// UserPreference
// ─────────────────────────────────────────────────────────────────────────────

export class UserPreference extends Model<
  InferAttributes<UserPreference>,
  InferCreationAttributes<UserPreference>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare styleCategories: CreationOptional<string>; // JSON array
  declare occasions: CreationOptional<string>;
  declare colorPreferences: CreationOptional<string>;
  declare fitPreferences: CreationOptional<string>;
  declare budgetMin: CreationOptional<number | null>;
  declare budgetMax: CreationOptional<number | null>;
  declare currency: CreationOptional<string>;
  declare city: CreationOptional<string | null>;
  declare brands: CreationOptional<string>;
  declare showBudgetOnProfile: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserPreference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    styleCategories: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      allowNull: false,
      get() {
        const raw = this.getDataValue('styleCategories') as string;
        return JSON.parse(raw || '[]') as string[];
      },
      set(value: string[]) {
        this.setDataValue('styleCategories', JSON.stringify(value));
      },
    },
    occasions: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      allowNull: false,
      get() {
        const raw = this.getDataValue('occasions') as string;
        return JSON.parse(raw || '[]') as string[];
      },
      set(value: string[]) {
        this.setDataValue('occasions', JSON.stringify(value));
      },
    },
    colorPreferences: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      allowNull: false,
      get() {
        const raw = this.getDataValue('colorPreferences') as string;
        return JSON.parse(raw || '[]') as string[];
      },
      set(value: string[]) {
        this.setDataValue('colorPreferences', JSON.stringify(value));
      },
    },
    fitPreferences: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      allowNull: false,
      get() {
        const raw = this.getDataValue('fitPreferences') as string;
        return JSON.parse(raw || '[]') as string[];
      },
      set(value: string[]) {
        this.setDataValue('fitPreferences', JSON.stringify(value));
      },
    },
    budgetMin: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    budgetMax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.CHAR(3),
      defaultValue: 'INR',
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    brands: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      allowNull: false,
      get() {
        const raw = this.getDataValue('brands') as string;
        return JSON.parse(raw || '[]') as string[];
      },
      set(value: string[]) {
        this.setDataValue('brands', JSON.stringify(value));
      },
    },
    showBudgetOnProfile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'user_preferences',
    underscored: true,
    indexes: [{ fields: ['user_id'], unique: true }],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// RefreshToken
// ─────────────────────────────────────────────────────────────────────────────

export class RefreshToken extends Model<
  InferAttributes<RefreshToken>,
  InferCreationAttributes<RefreshToken>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare tokenHash: string;   // Hashed refresh token
  declare expiresAt: Date;
  declare isRevoked: CreationOptional<boolean>;
  declare revokedAt: CreationOptional<Date | null>;
  declare deviceInfo: CreationOptional<string | null>;
  declare ipAddress: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deviceInfo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'], unique: true },
      { fields: ['expires_at'] },
      { fields: ['is_revoked'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PasswordResetToken
// ─────────────────────────────────────────────────────────────────────────────

export class PasswordResetToken extends Model<
  InferAttributes<PasswordResetToken>,
  InferCreationAttributes<PasswordResetToken>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'password_reset_tokens',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'], unique: true },
      { fields: ['expires_at'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// EmailVerificationToken
// ─────────────────────────────────────────────────────────────────────────────

export class EmailVerificationToken extends Model<
  InferAttributes<EmailVerificationToken>,
  InferCreationAttributes<EmailVerificationToken>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

EmailVerificationToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'email_verification_tokens',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'], unique: true },
      { fields: ['expires_at'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Follow (Join table with extra data)
// ─────────────────────────────────────────────────────────────────────────────

export class Follow extends Model<InferAttributes<Follow>, InferCreationAttributes<Follow>> {
  declare id: CreationOptional<string>;
  declare followerId: string;
  declare followingId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Follow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    followerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'follows',
    underscored: true,
    indexes: [
      { fields: ['follower_id', 'following_id'], unique: true, name: 'unique_follow' },
      { fields: ['follower_id'] },
      { fields: ['following_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// UserBlock
// ─────────────────────────────────────────────────────────────────────────────

export class UserBlock extends Model<InferAttributes<UserBlock>, InferCreationAttributes<UserBlock>> {
  declare id: CreationOptional<string>;
  declare blockerId: string;
  declare blockedId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserBlock.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blockerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    blockedId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'user_blocks',
    underscored: true,
    indexes: [
      { fields: ['blocker_id', 'blocked_id'], unique: true, name: 'unique_block' },
      { fields: ['blocker_id'] },
      { fields: ['blocked_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// OutfitPost (with soft delete)
// ─────────────────────────────────────────────────────────────────────────────

export class OutfitPost extends Model<InferAttributes<OutfitPost>, InferCreationAttributes<OutfitPost>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare caption: CreationOptional<string | null>;
  declare styleCategories: CreationOptional<string>; // JSON
  declare occasions: CreationOptional<string>; // JSON
  declare budgetMin: CreationOptional<string | null>;
  declare budgetMax: CreationOptional<string | null>;
  declare currency: CreationOptional<string>;
  declare clothingDetails: CreationOptional<string | null>;
  declare status: CreationOptional<'draft' | 'published' | 'removed' | 'under_review'>;
  declare likesCount: CreationOptional<number>;
  declare commentsCount: CreationOptional<number>;
  declare savesCount: CreationOptional<number>;
  declare publishedAt: CreationOptional<Date | null>;
  declare deletedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare media?: NonAttribute<OutfitMedia[]>;
  declare tags?: NonAttribute<Tag[]>;
  declare products?: NonAttribute<ProductReference[]>;
}

OutfitPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    styleCategories: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('styleCategories') as string;
        return JSON.parse(raw || '[]') as string[];
      },
      set(value: string[]) {
        this.setDataValue('styleCategories', JSON.stringify(value));
      },
    },
    occasions: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('occasions') as string;
        return JSON.parse(raw || '[]') as string[];
      },
      set(value: string[]) {
        this.setDataValue('occasions', JSON.stringify(value));
      },
    },
    budgetMin: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    budgetMax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.CHAR(3),
      defaultValue: 'INR',
      allowNull: false,
    },
    clothingDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'removed', 'under_review'),
      defaultValue: 'published',
      allowNull: false,
    },
    likesCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    commentsCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    savesCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'outfit_posts',
    underscored: true,
    indexes: [
      { fields: ['user_id', 'created_at'] },
      { fields: ['status', 'created_at'] },
      { fields: ['status', 'published_at'] },
      { fields: ['deleted_at'] },
      { fields: ['likes_count'] },
      {
        name: 'outfit_posts_fulltext',
        type: 'FULLTEXT',
        fields: ['caption'],
      },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// OutfitMedia
// ─────────────────────────────────────────────────────────────────────────────

export class OutfitMedia extends Model<InferAttributes<OutfitMedia>, InferCreationAttributes<OutfitMedia>> {
  declare id: CreationOptional<string>;
  declare outfitPostId: string;
  declare userId: string;
  declare objectKey: string;
  declare publicUrl: string;
  declare thumbnailUrl: CreationOptional<string | null>;
  declare mimeType: string;
  declare fileSize: number;
  declare width: CreationOptional<number | null>;
  declare height: CreationOptional<number | null>;
  declare orderIndex: CreationOptional<number>;
  declare isProcessed: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OutfitMedia.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    outfitPostId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    objectKey: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    publicUrl: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    orderIndex: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 0,
      allowNull: false,
    },
    isProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'outfit_media',
    underscored: true,
    indexes: [
      { fields: ['outfit_post_id', 'order_index'] },
      { fields: ['user_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tag
// ─────────────────────────────────────────────────────────────────────────────

export class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare postsCount: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Tag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    postsCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'tags',
    underscored: true,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['name'], unique: true },
      { fields: ['posts_count'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// OutfitTag (join table)
// ─────────────────────────────────────────────────────────────────────────────

export class OutfitTag extends Model<InferAttributes<OutfitTag>, InferCreationAttributes<OutfitTag>> {
  declare outfitPostId: string;
  declare tagId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OutfitTag.init(
  {
    outfitPostId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'outfit_tags',
    underscored: true,
    indexes: [
      { fields: ['outfit_post_id'] },
      { fields: ['tag_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PostLike
// ─────────────────────────────────────────────────────────────────────────────

export class PostLike extends Model<InferAttributes<PostLike>, InferCreationAttributes<PostLike>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare outfitPostId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PostLike.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    outfitPostId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'post_likes',
    underscored: true,
    indexes: [
      { fields: ['user_id', 'outfit_post_id'], unique: true, name: 'unique_post_like' },
      { fields: ['outfit_post_id'] },
      { fields: ['user_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Comment
// ─────────────────────────────────────────────────────────────────────────────

export class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare outfitPostId: string;
  declare parentId: CreationOptional<string | null>;
  declare content: string;
  declare likesCount: CreationOptional<number>;
  declare repliesCount: CreationOptional<number>;
  declare deletedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare replies?: NonAttribute<Comment[]>;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    outfitPostId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    content: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    likesCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    repliesCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'comments',
    underscored: true,
    indexes: [
      { fields: ['outfit_post_id', 'created_at'] },
      { fields: ['user_id'] },
      { fields: ['parent_id'] },
      { fields: ['deleted_at'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// SavedOutfit
// ─────────────────────────────────────────────────────────────────────────────

export class SavedOutfit extends Model<InferAttributes<SavedOutfit>, InferCreationAttributes<SavedOutfit>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare outfitPostId: string;
  declare collectionId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

SavedOutfit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    outfitPostId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    collectionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'saved_outfits',
    underscored: true,
    indexes: [
      { fields: ['user_id', 'outfit_post_id'], unique: true, name: 'unique_saved_outfit' },
      { fields: ['user_id'] },
      { fields: ['collection_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Collection
// ─────────────────────────────────────────────────────────────────────────────

export class Collection extends Model<InferAttributes<Collection>, InferCreationAttributes<Collection>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare coverImageUrl: CreationOptional<string | null>;
  declare isPublic: CreationOptional<boolean>;
  declare itemsCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Collection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    coverImageUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    itemsCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'collections',
    underscored: true,
    indexes: [
      { fields: ['user_id', 'created_at'] },
      { fields: ['is_public'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// ProductReference
// ─────────────────────────────────────────────────────────────────────────────

export class ProductReference extends Model<
  InferAttributes<ProductReference>,
  InferCreationAttributes<ProductReference>
> {
  declare id: CreationOptional<string>;
  declare outfitPostId: string;
  declare productName: string;
  declare brand: CreationOptional<string | null>;
  declare price: CreationOptional<string | null>;
  declare currency: CreationOptional<string>;
  declare productUrl: string;
  declare imageUrl: CreationOptional<string | null>;
  declare isAffiliate: CreationOptional<boolean>;
  declare affiliateDisclosureUrl: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ProductReference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    outfitPostId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.CHAR(3),
      defaultValue: 'INR',
      allowNull: false,
    },
    productUrl: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    isAffiliate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    affiliateDisclosureUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'product_references',
    underscored: true,
    indexes: [{ fields: ['outfit_post_id'] }],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────────────────────────────────────

export class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<string>;
  declare userId: string;   // recipient
  declare actorId: CreationOptional<string | null>;
  declare type: string;
  declare title: string;
  declare body: string;
  declare targetId: CreationOptional<string | null>;
  declare targetType: CreationOptional<string | null>;
  declare deepLink: CreationOptional<string | null>;
  declare isRead: CreationOptional<boolean>;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    body: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    deepLink: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'notifications',
    underscored: true,
    indexes: [
      { fields: ['user_id', 'created_at'] },
      { fields: ['user_id', 'is_read'] },
      { fields: ['type'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// DeviceToken
// ─────────────────────────────────────────────────────────────────────────────

export class DeviceToken extends Model<InferAttributes<DeviceToken>, InferCreationAttributes<DeviceToken>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare token: string;
  declare platform: 'ios' | 'android';
  declare expoToken: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
  declare lastUsedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DeviceToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    platform: {
      type: DataTypes.ENUM('ios', 'android'),
      allowNull: false,
    },
    expoToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'device_tokens',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token'], unique: true },
      { fields: ['is_active'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// ContentReport
// ─────────────────────────────────────────────────────────────────────────────

export class ContentReport extends Model<InferAttributes<ContentReport>, InferCreationAttributes<ContentReport>> {
  declare id: CreationOptional<string>;
  declare reporterId: string;
  declare targetType: 'outfit' | 'user' | 'comment';
  declare targetId: string;
  declare category: string;
  declare description: CreationOptional<string | null>;
  declare status: CreationOptional<'pending' | 'under_review' | 'resolved' | 'dismissed'>;
  declare resolvedById: CreationOptional<string | null>;
  declare moderationNote: CreationOptional<string | null>;
  declare resolvedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ContentReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    targetType: {
      type: DataTypes.ENUM('outfit', 'user', 'comment'),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
      defaultValue: 'pending',
    },
    resolvedById: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    moderationNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'content_reports',
    underscored: true,
    indexes: [
      { fields: ['reporter_id'] },
      { fields: ['target_type', 'target_id'] },
      { fields: ['status', 'created_at'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// ModerationAction
// ─────────────────────────────────────────────────────────────────────────────

export class ModerationAction extends Model<InferAttributes<ModerationAction>, InferCreationAttributes<ModerationAction>> {
  declare id: CreationOptional<string>;
  declare moderatorId: string;
  declare reportId: CreationOptional<string | null>;
  declare targetType: string;
  declare targetId: string;
  declare action: string;
  declare note: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ModerationAction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    moderatorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reportId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'moderation_actions',
    underscored: true,
    indexes: [
      { fields: ['moderator_id'] },
      { fields: ['target_type', 'target_id'] },
      { fields: ['report_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// AuditLog
// ─────────────────────────────────────────────────────────────────────────────

export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<string>;
  declare actorId: string;
  declare action: string;
  declare targetType: string;
  declare targetId: string;
  declare description: string;
  declare ipAddress: CreationOptional<string | null>;
  declare metadata: CreationOptional<string>; // JSON
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.TEXT,
      defaultValue: '{}',
      get() {
        const raw = this.getDataValue('metadata') as string;
        return JSON.parse(raw || '{}') as Record<string, unknown>;
      },
      set(value: Record<string, unknown>) {
        this.setDataValue('metadata', JSON.stringify(value));
      },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'audit_logs',
    underscored: true,
    indexes: [
      { fields: ['actor_id', 'created_at'] },
      { fields: ['action'] },
      { fields: ['target_type', 'target_id'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// StyleCategory (Taxonomy)
// ─────────────────────────────────────────────────────────────────────────────

export class StyleCategoryModel extends Model<InferAttributes<StyleCategoryModel>, InferCreationAttributes<StyleCategoryModel>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare description: CreationOptional<string | null>;
  declare emoji: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
  declare postsCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

StyleCategoryModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    emoji: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    postsCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'style_categories',
    underscored: true,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['is_active'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Associations
// ─────────────────────────────────────────────────────────────────────────────

export function setupAssociations(): void {
  // User <-> Profile (1:1)
  User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
  UserProfile.belongsTo(User, { foreignKey: 'userId' });

  // User <-> Preferences (1:1)
  User.hasOne(UserPreference, { foreignKey: 'userId', as: 'preferences', onDelete: 'CASCADE' });
  UserPreference.belongsTo(User, { foreignKey: 'userId' });

  // User <-> RefreshTokens (1:N)
  User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
  RefreshToken.belongsTo(User, { foreignKey: 'userId' });

  // User <-> PasswordResetTokens (1:N)
  User.hasMany(PasswordResetToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
  PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

  // User <-> EmailVerificationTokens (1:N)
  User.hasMany(EmailVerificationToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
  EmailVerificationToken.belongsTo(User, { foreignKey: 'userId' });

  // User <-> OutfitPost (1:N)
  User.hasMany(OutfitPost, { foreignKey: 'userId', as: 'outfitPosts', onDelete: 'CASCADE' });
  OutfitPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  OutfitPost.belongsTo(User, { foreignKey: 'userId', as: 'author' });

  // OutfitPost <-> OutfitMedia (1:N)
  OutfitPost.hasMany(OutfitMedia, { foreignKey: 'outfitPostId', as: 'media', onDelete: 'CASCADE' });
  OutfitMedia.belongsTo(OutfitPost, { foreignKey: 'outfitPostId' });

  // OutfitPost <-> Tags (N:M)
  OutfitPost.belongsToMany(Tag, {
    through: OutfitTag,
    foreignKey: 'outfitPostId',
    otherKey: 'tagId',
    as: 'tags',
  });
  Tag.belongsToMany(OutfitPost, {
    through: OutfitTag,
    foreignKey: 'tagId',
    otherKey: 'outfitPostId',
    as: 'outfitPosts',
  });

  // PostLike
  User.hasMany(PostLike, { foreignKey: 'userId', as: 'likes', onDelete: 'CASCADE' });
  OutfitPost.hasMany(PostLike, { foreignKey: 'outfitPostId', as: 'likes', onDelete: 'CASCADE' });
  PostLike.belongsTo(User, { foreignKey: 'userId' });
  PostLike.belongsTo(OutfitPost, { foreignKey: 'outfitPostId' });

  // Comment
  User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
  OutfitPost.hasMany(Comment, { foreignKey: 'outfitPostId', as: 'comments', onDelete: 'CASCADE' });
  Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Comment.belongsTo(OutfitPost, { foreignKey: 'outfitPostId' });
  Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
  Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

  // SavedOutfit
  User.hasMany(SavedOutfit, { foreignKey: 'userId', as: 'savedOutfits', onDelete: 'CASCADE' });
  OutfitPost.hasMany(SavedOutfit, { foreignKey: 'outfitPostId', onDelete: 'CASCADE' });
  SavedOutfit.belongsTo(User, { foreignKey: 'userId' });
  SavedOutfit.belongsTo(OutfitPost, { foreignKey: 'outfitPostId' });
  SavedOutfit.belongsTo(OutfitPost, { foreignKey: 'outfitPostId', as: 'outfitPost' });

  // Collection
  User.hasMany(Collection, { foreignKey: 'userId', as: 'collections', onDelete: 'CASCADE' });
  Collection.belongsTo(User, { foreignKey: 'userId' });
  Collection.hasMany(SavedOutfit, { foreignKey: 'collectionId', as: 'items' });
  SavedOutfit.belongsTo(Collection, { foreignKey: 'collectionId', as: 'collection' });

  // ProductReference
  OutfitPost.hasMany(ProductReference, { foreignKey: 'outfitPostId', as: 'products', onDelete: 'CASCADE' });
  ProductReference.belongsTo(OutfitPost, { foreignKey: 'outfitPostId' });

  // Follow (self-referential N:M)
  User.belongsToMany(User, {
    through: Follow,
    foreignKey: 'followerId',
    otherKey: 'followingId',
    as: 'following',
  });
  User.belongsToMany(User, {
    through: Follow,
    foreignKey: 'followingId',
    otherKey: 'followerId',
    as: 'followers',
  });
  Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
  Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

  // UserBlock (self-referential N:M)
  User.belongsToMany(User, {
    through: UserBlock,
    foreignKey: 'blockerId',
    otherKey: 'blockedId',
    as: 'blockedUsers',
  });

  // Notification
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
  Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

  // DeviceToken
  User.hasMany(DeviceToken, { foreignKey: 'userId', as: 'deviceTokens', onDelete: 'CASCADE' });
  DeviceToken.belongsTo(User, { foreignKey: 'userId' });

  // ContentReport
  User.hasMany(ContentReport, { foreignKey: 'reporterId', as: 'reports' });
  ContentReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
  ContentReport.belongsTo(User, { foreignKey: 'resolvedById', as: 'resolvedBy' });

  // ModerationAction
  User.hasMany(ModerationAction, { foreignKey: 'moderatorId' });
  ModerationAction.belongsTo(User, { foreignKey: 'moderatorId', as: 'moderator' });

  // AuditLog
  User.hasMany(AuditLog, { foreignKey: 'actorId' });
  AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
}


