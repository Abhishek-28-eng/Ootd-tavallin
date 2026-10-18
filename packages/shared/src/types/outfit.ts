// ============================================================
// Outfit & Media Types
// ============================================================

import type { UserSummary } from './user';
import type { StyleCategory, Occasion } from '../constants/fashion';

export type OutfitPostStatus = 'draft' | 'published' | 'removed' | 'under_review';

export interface OutfitMedia {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  orderIndex: number;
  mimeType: string;
}

export interface ProductReference {
  id: string;
  productName: string;
  brand: string | null;
  price: string | null;          // DECIMAL stored as string
  currency: string;
  productUrl: string;
  imageUrl: string | null;
  isAffiliate: boolean;
  affiliateDisclosureUrl: string | null;
}

export interface OutfitTag {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
}

export interface OutfitPost {
  id: string;
  creator: UserSummary;
  caption: string | null;
  media: OutfitMedia[];
  tags: OutfitTag[];
  styleCategories: StyleCategory[];
  occasions: Occasion[];
  budgetMin: string | null;     // DECIMAL
  budgetMax: string | null;
  currency: string;
  clothingDetails: string | null;
  status: OutfitPostStatus;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isOwner: boolean;
  products: ProductReference[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitSummary {
  id: string;
  creator: UserSummary;
  thumbnailUrl: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  styleCategories: StyleCategory[];
  createdAt: string;
}

export interface CreateOutfitRequest {
  caption?: string;
  mediaKeys: string[];           // S3 object keys after upload
  tags?: string[];
  styleCategories?: StyleCategory[];
  occasions?: Occasion[];
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  clothingDetails?: string;
  products?: CreateProductRequest[];
}

export interface CreateProductRequest {
  productName: string;
  brand?: string;
  price?: number;
  currency?: string;
  productUrl: string;
  imageUrl?: string;
  isAffiliate?: boolean;
}

export interface UpdateOutfitRequest {
  caption?: string;
  tags?: string[];
  styleCategories?: StyleCategory[];
  occasions?: Occasion[];
  budgetMin?: number;
  budgetMax?: number;
  clothingDetails?: string;
  products?: CreateProductRequest[];
}

export interface FeedResponse {
  posts: OutfitPost[];
  meta: {
    hasMore: boolean;
    cursor: string | null;
  };
}

export interface MediaUploadUrlRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface MediaUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface MediaCompleteRequest {
  objectKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export interface MediaCompleteResponse {
  mediaId: string;
  publicUrl: string;
  thumbnailUrl: string | null;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  itemsCount: number;
  createdAt: string;
}

export interface CollectionWithItems extends Collection {
  items: OutfitSummary[];
}
