import { z } from 'zod';

export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, 'Question must be at least 2 characters')
    .max(500, 'Question cannot exceed 500 characters'),
  conversationId: z.string().optional()
});
