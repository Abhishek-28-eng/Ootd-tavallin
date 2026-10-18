import { z } from 'zod';
import { STYLE_CATEGORIES, OCCASIONS, COLOR_PREFERENCES, FIT_PREFERENCES } from '../constants/fashion';

export const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .trim()
    .optional(),
  bio: z.string().max(300, 'Bio must be at most 300 characters').trim().optional(),
  location: z.string().max(100, 'Location must be at most 100 characters').trim().optional(),
  avatarUrl: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdatePreferencesSchema = z.object({
  styleCategories: z.array(z.enum([...STYLE_CATEGORIES] as [string, ...string[]])).optional(),
  occasions: z.array(z.enum([...OCCASIONS] as [string, ...string[]])).optional(),
  colorPreferences: z.array(z.enum([...COLOR_PREFERENCES] as [string, ...string[]])).optional(),
  fitPreferences: z.array(z.enum([...FIT_PREFERENCES] as [string, ...string[]])).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').optional(),
  city: z.string().max(100).trim().optional(),
  brands: z.array(z.string().max(100)).max(20, 'Maximum 20 brands').optional(),
  showBudgetOnProfile: z.boolean().optional(),
});
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

export const OnboardingSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50)
    .trim(),
  styleCategories: z.array(z.enum([...STYLE_CATEGORIES] as [string, ...string[]])).min(1, 'Select at least one style'),
  occasions: z.array(z.enum([...OCCASIONS] as [string, ...string[]])).optional(),
  colorPreferences: z.array(z.enum([...COLOR_PREFERENCES] as [string, ...string[]])).optional(),
  fitPreferences: z.array(z.enum([...FIT_PREFERENCES] as [string, ...string[]])).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('INR'),
  city: z.string().max(100).trim().optional(),
  brands: z.array(z.string().max(100)).max(20).optional(),
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
