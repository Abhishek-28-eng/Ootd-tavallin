import { z } from 'zod';

export const CreateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be at most 1000 characters')
    .trim(),
  parentId: z.string().optional(),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const CreateReportSchema = z.object({
  targetType: z.enum(['outfit', 'user', 'comment']),
  targetId: z.string().min(1),
  category: z.enum([
    'spam',
    'nudity_or_sexual_content',
    'hate_speech',
    'violence',
    'harassment',
    'intellectual_property',
    'false_information',
    'other',
  ]),
  description: z.string().max(500).trim().optional(),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
