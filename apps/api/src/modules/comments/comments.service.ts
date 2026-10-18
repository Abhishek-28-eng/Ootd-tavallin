// ============================================================
// Comments Service
// ============================================================
import { Op } from 'sequelize';
import { Comment, OutfitPost, User, Notification, UserProfile } from '../../database/models';
import { AppError } from '../../shared/errors/AppError';
import type { CreateCommentInput } from '@tavallin/shared';

export interface CommentDTO {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  content: string;
  likesCount: number;
  isLiked: boolean;
  isOwner: boolean;
  parentId: string | null;
  repliesCount: number;
  replies?: CommentDTO[];
  createdAt: string;
  updatedAt: string;
}

export class CommentsService {
  async createComment(
    userId: string,
    outfitPostId: string,
    data: CreateCommentInput,
  ): Promise<CommentDTO> {
    const post = await OutfitPost.findOne({
      where: { id: outfitPostId, status: 'published', deletedAt: null },
    });
    if (!post) throw AppError.notFound('Outfit post not found');

    let parentComment: Comment | null = null;
    if (data.parentId) {
      parentComment = await Comment.findOne({
        where: { id: data.parentId, outfitPostId, deletedAt: null },
      });
      if (!parentComment) throw AppError.notFound('Parent comment not found');
    }

    const comment = await Comment.create({
      userId,
      outfitPostId,
      parentId: data.parentId || null,
      content: data.content,
      likesCount: 0,
      repliesCount: 0,
    });

    // Atomically increment comment counters
    await OutfitPost.increment({ commentsCount: 1 }, { where: { id: outfitPostId } });
    if (parentComment) {
      await Comment.increment({ repliesCount: 1 }, { where: { id: parentComment.id } });
    }

    // Create notification if commenter is not post author
    const commenter = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
    });
    const commenterProfile = (commenter as any)?.profile as UserProfile | undefined;
    const commenterName = commenterProfile?.displayName || commenter?.username || 'Someone';

    if (post.userId !== userId) {
      await Notification.create({
        userId: post.userId,
        actorId: userId,
        type: data.parentId ? 'comment_replied' : 'outfit_commented',
        title: data.parentId ? 'New Reply to Comment' : 'New Comment on Outfit',
        body: `${commenterName} commented: "${data.content.slice(0, 60)}${data.content.length > 60 ? '...' : ''}"`,
        targetId: outfitPostId,
        targetType: 'outfit',
        deepLink: `tavallin://outfit/${outfitPostId}`,
      });
    }

    return {
      id: comment.id,
      author: {
        id: commenter?.id || userId,
        username: commenter?.username || '',
        displayName: commenterProfile?.displayName || commenter?.username || 'User',
        avatarUrl: commenterProfile?.avatarUrl || null,
      },
      content: comment.content,
      likesCount: 0,
      isLiked: false,
      isOwner: true,
      parentId: comment.parentId,
      repliesCount: 0,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  async getComments(
    outfitPostId: string,
    requesterId?: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ comments: CommentDTO[]; meta: { hasMore: boolean; cursor: string | null; total: number } }> {
    const where: Record<string, unknown> = {
      outfitPostId,
      parentId: null,
      deletedAt: null,
      ...(cursor ? { createdAt: { [Op.lt]: new Date(cursor) } } : {}),
    };

    const total = await Comment.count({
      where: { outfitPostId, parentId: null, deletedAt: null },
    });

    const comments = await Comment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
        },
        {
          model: Comment,
          as: 'replies',
          where: { deletedAt: null },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username'],
              include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
            },
          ],
          order: [['createdAt', 'ASC']],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limit + 1,
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = items.length ? items[items.length - 1]!.createdAt.toISOString() : null;

    const formatted: CommentDTO[] = items.map((c) => {
      const author = c.get('user') as User;
      const authorProfile = (author as any)?.profile as UserProfile | undefined;
      const replies = (c.get('replies') as Comment[]) || [];

      return {
        id: c.id,
        author: {
          id: author?.id || c.userId,
          username: author?.username || 'user',
          displayName: authorProfile?.displayName || author?.username || 'User',
          avatarUrl: authorProfile?.avatarUrl || null,
        },
        content: c.content,
        likesCount: c.likesCount || 0,
        isLiked: false,
        isOwner: requesterId === c.userId,
        parentId: null,
        repliesCount: c.repliesCount || replies.length,
        replies: replies.map((r) => {
          const rAuthor = r.get('user') as User;
          const rAuthorProfile = (rAuthor as any)?.profile as UserProfile | undefined;
          return {
            id: r.id,
            author: {
              id: rAuthor?.id || r.userId,
              username: rAuthor?.username || 'user',
              displayName: rAuthorProfile?.displayName || rAuthor?.username || 'User',
              avatarUrl: rAuthorProfile?.avatarUrl || null,
            },
            content: r.content,
            likesCount: r.likesCount || 0,
            isLiked: false,
            isOwner: requesterId === r.userId,
            parentId: c.id,
            repliesCount: 0,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return {
      comments: formatted,
      meta: {
        hasMore,
        cursor: hasMore ? nextCursor : null,
        total,
      },
    };
  }

  async deleteComment(commentId: string, userId: string, isAdmin = false): Promise<void> {
    const comment = await Comment.findByPk(commentId);
    if (!comment) throw AppError.notFound('Comment not found');

    const post = await OutfitPost.findByPk(comment.outfitPostId);
    const isPostOwner = post?.userId === userId;
    const isCommentOwner = comment.userId === userId;

    if (!isCommentOwner && !isPostOwner && !isAdmin) {
      throw AppError.forbidden('Not authorized to delete this comment');
    }

    await comment.update({ deletedAt: new Date() });
    await OutfitPost.decrement({ commentsCount: 1 }, { where: { id: comment.outfitPostId } });
    if (comment.parentId) {
      await Comment.decrement({ repliesCount: 1 }, { where: { id: comment.parentId } });
    }
  }
}

export const commentsService = new CommentsService();
