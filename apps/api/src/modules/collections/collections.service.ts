// ============================================================
// Collections Service
// ============================================================
import { Op } from 'sequelize';
import { Collection, SavedOutfit, OutfitPost, OutfitMedia, User, UserProfile } from '../../database/models';
import { AppError } from '../../shared/errors/AppError';

export interface CreateCollectionDTO {
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionDTO {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}

export class CollectionsService {
  async createCollection(userId: string, data: CreateCollectionDTO): Promise<Collection> {
    return Collection.create({
      userId,
      name: data.name,
      description: data.description || null,
      coverImageUrl: data.coverImageUrl || null,
      isPublic: data.isPublic ?? false,
      itemsCount: 0,
    });
  }

  async getUserCollections(userId: string, requesterId?: string): Promise<Collection[]> {
    const isOwner = requesterId === userId;
    const where: Record<string, unknown> = { userId };
    if (!isOwner) {
      where['isPublic'] = true;
    }

    return Collection.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async getCollectionById(collectionId: string, requesterId?: string): Promise<{
    collection: Collection;
    outfits: Array<{
      id: string;
      caption: string | null;
      author: { id: string; username: string; displayName: string; avatarUrl: string | null };
      media: Array<{ publicUrl: string; thumbnailUrl: string | null }>;
      savedAt: string;
    }>;
  }> {
    const collection = await Collection.findByPk(collectionId);
    if (!collection) throw AppError.notFound('Collection not found');

    if (!collection.isPublic && collection.userId !== requesterId) {
      throw AppError.forbidden('This collection is private');
    }

    const savedItems = await SavedOutfit.findAll({
      where: { collectionId },
      include: [
        {
          model: OutfitPost,
          as: 'outfitPost',
          where: { status: 'published', deletedAt: null },
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username'],
              include: [
                {
                  model: UserProfile,
                  as: 'profile',
                  attributes: ['displayName', 'avatarUrl'],
                },
              ],
            },
            {
              model: OutfitMedia,
              as: 'media',
              attributes: ['publicUrl', 'thumbnailUrl', 'orderIndex'],
              separate: true,
              order: [['orderIndex', 'ASC']],
              limit: 1,
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const outfits = savedItems
      .map((item) => {
        const post = item.get('outfitPost') as OutfitPost | null;
        if (!post) return null;
        const author = post.get('author') as (User & { profile?: UserProfile }) | null;
        const media = (post.get('media') as OutfitMedia[]) || [];

        return {
          id: post.id,
          caption: post.caption,
          author: {
            id: author?.id || '',
            username: author?.username || '',
            displayName: author?.profile?.displayName || author?.username || '',
            avatarUrl: author?.profile?.avatarUrl || null,
          },
          media: media.map((m) => ({
            publicUrl: m.publicUrl,
            thumbnailUrl: m.thumbnailUrl,
          })),
          savedAt: item.createdAt.toISOString(),
        };
      })
      .filter((o): o is NonNullable<typeof o> => o !== null);

    return { collection, outfits };
  }

  async updateCollection(
    collectionId: string,
    userId: string,
    data: UpdateCollectionDTO,
  ): Promise<Collection> {
    const collection = await Collection.findOne({ where: { id: collectionId, userId } });
    if (!collection) throw AppError.notFound('Collection not found');

    await collection.update(data);
    return collection;
  }

  async deleteCollection(collectionId: string, userId: string): Promise<void> {
    const collection = await Collection.findOne({ where: { id: collectionId, userId } });
    if (!collection) throw AppError.notFound('Collection not found');

    // Remove collection reference from saved outfits
    await SavedOutfit.update({ collectionId: null }, { where: { collectionId } });
    await collection.destroy();
  }

  async addOutfitToCollection(
    collectionId: string,
    outfitPostId: string,
    userId: string,
  ): Promise<void> {
    const collection = await Collection.findOne({ where: { id: collectionId, userId } });
    if (!collection) throw AppError.notFound('Collection not found');

    const [saved, created] = await SavedOutfit.findOrCreate({
      where: { userId, outfitPostId },
      defaults: { userId, outfitPostId, collectionId },
    });

    if (!created && saved.collectionId !== collectionId) {
      if (saved.collectionId) {
        await Collection.decrement({ itemsCount: 1 }, { where: { id: saved.collectionId } });
      }
      await saved.update({ collectionId });
      await Collection.increment({ itemsCount: 1 }, { where: { id: collectionId } });
    } else if (created) {
      await Collection.increment({ itemsCount: 1 }, { where: { id: collectionId } });
      await OutfitPost.increment({ savesCount: 1 }, { where: { id: outfitPostId } });
    }
  }

  async removeOutfitFromCollection(
    collectionId: string,
    outfitPostId: string,
    userId: string,
  ): Promise<void> {
    const saved = await SavedOutfit.findOne({
      where: { userId, outfitPostId, collectionId },
    });
    if (!saved) return;

    await saved.update({ collectionId: null });
    await Collection.decrement({ itemsCount: 1 }, { where: { id: collectionId } });
  }
}

export const collectionsService = new CollectionsService();
