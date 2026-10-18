// ============================================================
// Outfits Service — post CRUD, feed, explore, likes, saves
// ============================================================
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import {
  OutfitPost,
  OutfitMedia,
  Tag,
  OutfitTag,
  PostLike,
  SavedOutfit,
  Collection,
  User,
  UserProfile,
  Follow,
  ProductReference,
  UserPreference,
} from '../../database/models';
import { AppError } from '../../shared/errors/AppError';
import { mediaService } from '../media/media.service';
import type { CreateOutfitInput } from '@tavallin/shared';
import type { UploadedFile } from '../media/media.service';

// ─── Response DTOs ────────────────────────────────────────────
export interface OutfitCardDTO {
  id: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  media: Array<{
    id?: string;
    url: string;
    publicUrl: string;
    thumbnailUrl: string | null;
    width: number | null;
    height: number | null;
    orderIndex: number;
  }>;
  thumbnailUrl?: string | null;
  caption: string | null;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  savedCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isOwner?: boolean;
  tags: string[];
  styleCategories: string[];
  occasions: string[];
  products: any[];
  createdAt: string;
}

export class OutfitsService {
  // ─── Create outfit post ───────────────────────────────────────
  async createPost(
    userId: string,
    data: CreateOutfitInput,
    files: UploadedFile[],
  ): Promise<OutfitCardDTO> {
    if (!files.length) throw AppError.badRequest('At least one photo is required', 'VALIDATION_ERROR');

    // Process and upload all images
    const processedMedia = await Promise.all(
      files.map((f) => mediaService.processAndStore(f, userId, 'outfits')),
    );

    // Create outfit post
    const post = await OutfitPost.create({
      userId,
      caption: data.caption ?? null,
      styleCategories: data.styleCategories ? JSON.stringify(data.styleCategories) : '[]',
      occasions: data.occasions ? JSON.stringify(data.occasions) : '[]',
      budgetMin: data.budgetMin != null ? String(data.budgetMin) : null,
      budgetMax: data.budgetMax != null ? String(data.budgetMax) : null,
      currency: data.currency ?? 'INR',
      clothingDetails: data.clothingDetails ?? null,
      status: 'published',
    });

    // Insert media records
    await OutfitMedia.bulkCreate(
      processedMedia.map((m, i) => ({
        outfitPostId: post.id,
        userId,
        objectKey: m.objectKey,
        publicUrl: m.publicUrl,
        thumbnailUrl: m.thumbnailUrl,
        mimeType: m.mimeType,
        fileSize: m.fileSize,
        width: m.width,
        height: m.height,
        orderIndex: i,
        isProcessed: true,
      })),
    );

    // Handle tags
    if (data.tags?.length) {
      const tagSlugs = data.tags.map((t) => t.toLowerCase().replace(/\s+/g, '_'));
      await Promise.all(
        tagSlugs.map(async (slug) => {
          const [tag] = await Tag.findOrCreate({
            where: { slug },
            defaults: { name: slug.replace(/_/g, ' '), slug },
          });
          await OutfitTag.findOrCreate({
            where: { outfitPostId: post.id, tagId: tag.id },
            defaults: { outfitPostId: post.id, tagId: tag.id },
          });
          await Tag.increment({ postsCount: 1 }, { where: { id: tag.id } });
        }),
      );
    }

    // Handle product references
    if (data.products?.length) {
      await ProductReference.bulkCreate(
        data.products.map((p) => ({
          outfitPostId: post.id,
          productName: p.productName,
          brand: p.brand,
          price: p.price?.toString(),
          currency: p.currency ?? 'INR',
          productUrl: p.productUrl,
          imageUrl: p.imageUrl,
          isAffiliate: p.isAffiliate ?? false,
        })),
      );
    }

    // Increment user posts count
    await UserProfile.increment({ postsCount: 1 }, { where: { userId } });

    return this.getPostById(post.id, userId);
  }

  // ─── Get single post ──────────────────────────────────────────
  async getPostById(postId: string, requesterId?: string): Promise<OutfitCardDTO> {
    const post = await OutfitPost.findOne({
      where: { id: postId, status: 'published', deletedAt: null },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
        },
        {
          model: OutfitMedia,
          as: 'media',
          attributes: ['publicUrl', 'thumbnailUrl', 'width', 'height', 'orderIndex'],
          order: [['orderIndex', 'ASC']],
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['slug'],
          through: { attributes: [] },
        },
        {
          model: ProductReference,
          as: 'products',
        },
      ],
    });

    if (!post) throw AppError.notFound('Post not found');

    let isLiked = false;
    let isSaved = false;

    if (requesterId) {
      const [like, saved] = await Promise.all([
        PostLike.findOne({ where: { userId: requesterId, outfitPostId: postId } }),
        SavedOutfit.findOne({ where: { userId: requesterId, outfitPostId: postId } }),
      ]);
      isLiked = !!like;
      isSaved = !!saved;
    }

    const author = post.get('author') as User;
    const authorProfile = (author as any)?.profile as UserProfile | undefined;
    const mediaItems = (post.get('media') as OutfitMedia[]) ?? [];
    const tagItems = (post.get('tags') as Tag[]) ?? [];
    const productItems = (post.get('products') as ProductReference[]) ?? [];

    const userSummary = {
      id: author?.id || '',
      username: author?.username || 'user',
      displayName: authorProfile?.displayName || author?.username || 'User',
      avatarUrl: authorProfile?.avatarUrl ?? null,
    };

    return {
      id: post.id,
      creator: userSummary,
      author: userSummary,
      media: mediaItems.map((m) => ({
        id: m.id,
        url: m.publicUrl,
        publicUrl: m.publicUrl,
        thumbnailUrl: m.thumbnailUrl ?? null,
        width: m.width ?? null,
        height: m.height ?? null,
        orderIndex: m.orderIndex ?? 0,
      })),
      caption: post.caption ?? null,
      likesCount: post.likesCount ?? 0,
      commentsCount: post.commentsCount ?? 0,
      savesCount: post.savesCount ?? 0,
      savedCount: post.savesCount ?? 0,
      isLiked,
      isSaved,
      isOwner: requesterId ? post.userId === requesterId : false,
      tags: tagItems.map((t) => t.slug),
      styleCategories: post.styleCategories
        ? (typeof post.styleCategories === 'string' ? JSON.parse(post.styleCategories) : post.styleCategories)
        : [],
      occasions: post.occasions
        ? (typeof post.occasions === 'string' ? JSON.parse(post.occasions) : post.occasions)
        : [],
      products: productItems.map((p) => ({
        id: p.id,
        productName: p.productName,
        brand: p.brand,
        price: p.price,
        currency: p.currency,
        productUrl: p.productUrl,
        imageUrl: p.imageUrl,
        isAffiliate: p.isAffiliate,
      })),
      createdAt: post.createdAt.toISOString(),
    };
  }

  // ─── Delete post ──────────────────────────────────────────────
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await OutfitPost.findOne({ where: { id: postId, userId } });
    if (!post) throw AppError.notFound('Post not found or you do not have permission');

    // Soft delete
    await post.update({ deletedAt: new Date(), status: 'removed' });
    await UserProfile.decrement({ postsCount: 1 }, { where: { userId } });
  }

  // ─── Toggle like ──────────────────────────────────────────────
  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const post = await OutfitPost.findByPk(postId);
    if (!post || post.status !== 'published') throw AppError.notFound('Post not found');

    const existing = await PostLike.findOne({ where: { userId, outfitPostId: postId } });

    if (existing) {
      await existing.destroy();
      await OutfitPost.decrement({ likesCount: 1 }, { where: { id: postId } });
      await post.reload();
      return { liked: false, likesCount: post.likesCount ?? 0 };
    } else {
      await PostLike.create({ userId, outfitPostId: postId });
      await OutfitPost.increment({ likesCount: 1 }, { where: { id: postId } });
      await post.reload();
      return { liked: true, likesCount: post.likesCount ?? 0 };
    }
  }

  // ─── Toggle save ──────────────────────────────────────────────
  async toggleSave(
    userId: string,
    postId: string,
    collectionId?: string,
  ): Promise<{ saved: boolean }> {
    const post = await OutfitPost.findByPk(postId);
    if (!post || post.status !== 'published') throw AppError.notFound('Post not found');

    const existing = await SavedOutfit.findOne({ where: { userId, outfitPostId: postId } });

    if (existing) {
      await existing.destroy();
      await OutfitPost.decrement({ savesCount: 1 }, { where: { id: postId } });
      return { saved: false };
    } else {
      await SavedOutfit.create({ userId, outfitPostId: postId, collectionId });
      await OutfitPost.increment({ savesCount: 1 }, { where: { id: postId } });
      return { saved: true };
    }
  }

  // ─── Home feed (following + personalized) ─────────────────────
  async getFeed(
    userId: string,
    type: 'personalized' | 'following' | 'trending' | 'latest',
    cursor?: string,
    limit = 20,
  ): Promise<OutfitCardDTO[]> {
    const where: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
    };

    if (cursor) {
      where['createdAt'] = { [Op.lt]: new Date(cursor) };
    }

    // For "following" feed — only posts from followed users
    if (type === 'following') {
      const follows = await Follow.findAll({
        where: { followerId: userId },
        attributes: ['followingId'],
      });
      const followingIds = follows.map((f) => f.followingId);
      if (!followingIds.length) return [];
      where['userId'] = { [Op.in]: followingIds };
    }

    let order: [string, string][] = [['createdAt', 'DESC']];
    if (type === 'trending') {
      order = [['likesCount', 'DESC'], ['createdAt', 'DESC']];
    }

    const posts = await OutfitPost.findAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
        },
        {
          model: OutfitMedia,
          as: 'media',
          attributes: ['publicUrl', 'thumbnailUrl', 'width', 'height', 'orderIndex'],
          separate: true,
          order: [['orderIndex', 'ASC']],
          limit: 1, // Only first image for feed cards
        },
      ],
      order,
      limit,
    });

    // Batch-fetch like/save status
    const postIds = posts.map((p) => p.id);
    const [likes, saves] = await Promise.all([
      PostLike.findAll({ where: { userId, outfitPostId: { [Op.in]: postIds } }, attributes: ['outfitPostId'] }),
      SavedOutfit.findAll({ where: { userId, outfitPostId: { [Op.in]: postIds } }, attributes: ['outfitPostId'] }),
    ]);
    const likedSet = new Set(likes.map((l) => l.outfitPostId));
    const savedSet = new Set(saves.map((s) => s.outfitPostId));

    return posts.map((post) => {
      const author = post.get('author') as User;
      const authorProfile = (author as any)?.profile as UserProfile | undefined;
      const mediaItems = (post.get('media') as OutfitMedia[]) ?? [];
      const userSummary = {
        id: author?.id || '',
        username: author?.username || 'user',
        displayName: authorProfile?.displayName || author?.username || 'User',
        avatarUrl: authorProfile?.avatarUrl ?? null,
      };
      return {
        id: post.id,
        creator: userSummary,
        author: userSummary,
        media: mediaItems.map((m) => ({
          id: m.id,
          url: m.publicUrl,
          publicUrl: m.publicUrl,
          thumbnailUrl: m.thumbnailUrl ?? null,
          width: m.width ?? null,
          height: m.height ?? null,
          orderIndex: m.orderIndex ?? 0,
        })),
        caption: post.caption ?? null,
        likesCount: post.likesCount ?? 0,
        commentsCount: post.commentsCount ?? 0,
        savesCount: post.savesCount ?? 0,
        savedCount: post.savesCount ?? 0,
        isLiked: likedSet.has(post.id),
        isSaved: savedSet.has(post.id),
        isOwner: post.userId === userId,
        tags: [],
        styleCategories: post.styleCategories
          ? (typeof post.styleCategories === 'string' ? JSON.parse(post.styleCategories) : post.styleCategories)
          : [],
        occasions: post.occasions
          ? (typeof post.occasions === 'string' ? JSON.parse(post.occasions) : post.occasions)
          : [],
        products: [],
        createdAt: post.createdAt.toISOString(),
      };
    });
  }

  // ─── Explore feed (filtered) ──────────────────────────────────
  async getExploreFeed(
    filters: {
      style?: string;
      occasion?: string;
      budgetMin?: number;
      budgetMax?: number;
      tag?: string;
    },
    cursor?: string,
    limit = 20,
    requesterId?: string,
  ): Promise<OutfitCardDTO[]> {
    const where: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
    };

    if (cursor) where['createdAt'] = { [Op.lt]: new Date(cursor) };
    if (filters.style) where['styleCategories'] = { [Op.like]: `%${filters.style}%` };
    if (filters.occasion) where['occasions'] = { [Op.like]: `%${filters.occasion}%` };
    if (filters.budgetMin !== undefined) where['budgetMax'] = { [Op.gte]: filters.budgetMin };
    if (filters.budgetMax !== undefined) where['budgetMin'] = { [Op.lte]: filters.budgetMax };

    const include: object[] = [
      {
        model: User,
        as: 'author',
        where: { isPrivate: false, isSuspended: false },
        attributes: ['id', 'username'],
        include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
      },
      {
        model: OutfitMedia,
        as: 'media',
        attributes: ['publicUrl', 'thumbnailUrl', 'width', 'height', 'orderIndex'],
        separate: true,
        order: [['orderIndex', 'ASC']],
        limit: 1,
      },
    ];

    if (filters.tag) {
      include.push({
        model: Tag,
        as: 'tags',
        where: { slug: filters.tag },
        attributes: [],
        through: { attributes: [] },
        required: true,
      });
    }

    const posts = await OutfitPost.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit,
    });

    const postIds = posts.map((p) => p.id);
    let likedSet = new Set<string>();
    let savedSet = new Set<string>();

    if (requesterId && postIds.length) {
      const [likes, saves] = await Promise.all([
        PostLike.findAll({ where: { userId: requesterId, outfitPostId: { [Op.in]: postIds } } }),
        SavedOutfit.findAll({ where: { userId: requesterId, outfitPostId: { [Op.in]: postIds } } }),
      ]);
      likedSet = new Set(likes.map((l) => l.outfitPostId));
      savedSet = new Set(saves.map((s) => s.outfitPostId));
    }

    return posts.map((post) => {
      const author = post.get('author') as User;
      const authorProfile = (author as any)?.profile as UserProfile | undefined;
      const mediaItems = (post.get('media') as OutfitMedia[]) ?? [];
      const userSummary = {
        id: author?.id || '',
        username: author?.username || 'user',
        displayName: authorProfile?.displayName || author?.username || 'User',
        avatarUrl: authorProfile?.avatarUrl ?? null,
      };
      return {
        id: post.id,
        creator: userSummary,
        author: userSummary,
        media: mediaItems.map((m) => ({
          id: m.id,
          url: m.publicUrl,
          publicUrl: m.publicUrl,
          thumbnailUrl: m.thumbnailUrl ?? null,
          width: m.width ?? null,
          height: m.height ?? null,
          orderIndex: m.orderIndex ?? 0,
        })),
        caption: post.caption ?? null,
        likesCount: post.likesCount ?? 0,
        commentsCount: post.commentsCount ?? 0,
        savesCount: post.savesCount ?? 0,
        savedCount: post.savesCount ?? 0,
        isLiked: likedSet.has(post.id),
        isSaved: savedSet.has(post.id),
        isOwner: requesterId ? post.userId === requesterId : false,
        tags: [],
        styleCategories: post.styleCategories
          ? (typeof post.styleCategories === 'string' ? JSON.parse(post.styleCategories) : post.styleCategories)
          : [],
        occasions: post.occasions
          ? (typeof post.occasions === 'string' ? JSON.parse(post.occasions) : post.occasions)
          : [],
        products: [],
        createdAt: post.createdAt.toISOString(),
      };
    });
  }

  // ─── Get user posts grid ──────────────────────────────────────
  async getUserPosts(
    username: string,
    cursor?: string,
    limit = 20,
    requesterId?: string,
  ): Promise<OutfitCardDTO[]> {
    const user = await User.findOne({ where: { username: username.toLowerCase() } });
    if (!user) throw AppError.notFound(`User @${username} not found`);

    if (user.isPrivate && (!requesterId || requesterId !== user.id)) {
      let isFollowing = false;
      if (requesterId) {
        const follow = await Follow.findOne({ where: { followerId: requesterId, followingId: user.id } });
        isFollowing = !!follow;
      }
      if (!isFollowing) {
        return [];
      }
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      status: 'published',
      deletedAt: null,
      ...(cursor ? { createdAt: { [Op.lt]: new Date(cursor) } } : {}),
    };

    const posts = await OutfitPost.findAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
        },
        {
          model: OutfitMedia,
          as: 'media',
          attributes: ['publicUrl', 'thumbnailUrl', 'width', 'height', 'orderIndex'],
          separate: true,
          order: [['orderIndex', 'ASC']],
          limit: 1,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    });

    return posts.map((post) => {
      const author = post.get('author') as User;
      const authorProfile = (author as any)?.profile as UserProfile | undefined;
      const mediaItems = (post.get('media') as OutfitMedia[]) ?? [];
      const userSummary = {
        id: author?.id || '',
        username: author?.username || 'user',
        displayName: authorProfile?.displayName || author?.username || 'User',
        avatarUrl: authorProfile?.avatarUrl ?? null,
      };
      const firstMedia = mediaItems[0];
      const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.publicUrl || null;
      return {
        id: post.id,
        creator: userSummary,
        author: userSummary,
        thumbnailUrl,
        media: mediaItems.map((m) => ({
          id: m.id,
          url: m.publicUrl,
          publicUrl: m.publicUrl,
          thumbnailUrl: m.thumbnailUrl ?? null,
          width: m.width ?? null,
          height: m.height ?? null,
          orderIndex: m.orderIndex ?? 0,
        })),
        caption: post.caption ?? null,
        likesCount: post.likesCount ?? 0,
        commentsCount: post.commentsCount ?? 0,
        savesCount: post.savesCount ?? 0,
        savedCount: post.savesCount ?? 0,
        isLiked: false,
        isSaved: false,
        isOwner: false,
        tags: [],
        styleCategories: post.styleCategories
          ? (typeof post.styleCategories === 'string' ? JSON.parse(post.styleCategories) : post.styleCategories)
          : [],
        occasions: post.occasions
          ? (typeof post.occasions === 'string' ? JSON.parse(post.occasions) : post.occasions)
          : [],
        products: [],
        createdAt: post.createdAt.toISOString(),
      };
    });
  }
}

export const outfitsService = new OutfitsService();
