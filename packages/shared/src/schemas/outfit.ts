import { z } from 'zod';
import { STYLE_CATEGORIES, OCCASIONS } from '../constants/fashion';

export const CreateOutfitSchema = z.object({
  caption: z.string().max(2200, 'Caption must be at most 2200 characters').trim().optional(),
  mediaKeys: z
    .array(z.string().min(1))
    .max(10, 'Maximum 10 photos per post')
    .optional(),
  tags: z.array(z.string().max(50).trim().toLowerCase()).max(30, 'Maximum 30 tags').optional(),
  styleCategories: z.array(z.enum([...STYLE_CATEGORIES] as [string, ...string[]])).optional(),
  occasions: z.array(z.enum([...OCCASIONS] as [string, ...string[]])).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('INR'),
  clothingDetails: z.string().max(1000, 'Clothing details must be at most 1000 characters').optional(),
  products: z
    .array(
      z.object({
        productName: z.string().min(1).max(200),
        brand: z.string().max(100).optional(),
        price: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
        productUrl: z.string().url('Invalid product URL'),
        imageUrl: z.string().url('Invalid image URL').optional(),
        isAffiliate: z.boolean().default(false),
      }),
    )
    .max(10, 'Maximum 10 product references')
    .optional(),
});
export type CreateOutfitInput = z.infer<typeof CreateOutfitSchema>;

export const UpdateOutfitSchema = CreateOutfitSchema.omit({ mediaKeys: true }).partial();
export type UpdateOutfitInput = z.infer<typeof UpdateOutfitSchema>;

export const MediaUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, 'File must be at most 10MB'),
});
export type MediaUploadUrlInput = z.infer<typeof MediaUploadUrlSchema>;

export const MediaCompleteSchema = z.object({
  objectKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type MediaCompleteInput = z.infer<typeof MediaCompleteSchema>;

export const CreateCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100, 'Name must be at most 100 characters').trim(),
  description: z.string().max(500, 'Description must be at most 500 characters').trim().optional(),
  isPublic: z.boolean().default(false),
});
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;

export const FeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['personalized', 'following', 'trending', 'latest']).default('personalized'),
});
export type FeedQueryInput = z.infer<typeof FeedQuerySchema>;

export const ExploreQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  style: z.enum([...STYLE_CATEGORIES] as [string, ...string[]]).optional(),
  occasion: z.enum([...OCCASIONS] as [string, ...string[]]).optional(),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  tag: z.string().optional(),
});
export type ExploreQueryInput = z.infer<typeof ExploreQuerySchema>;
