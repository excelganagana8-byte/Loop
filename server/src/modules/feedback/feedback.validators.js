import { z } from 'zod';
import {
  FEEDBACK_SOURCE_LIST,
  FEEDBACK_STATUS_LIST,
  AI_SENTIMENT_LIST,
  AI_CATEGORY_LIST
} from 'loop-shared';

export const createFeedbackSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120),
  customerEmail: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(1, 'Feedback message is required')
    .max(5000, 'Feedback message cannot exceed 5000 characters'),
  source: z.enum(FEEDBACK_SOURCE_LIST, {
    errorMap: () => ({ message: 'Please select a valid feedback source' })
  }),
  receivedAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().datetime())
    .or(z.literal(''))
});

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUS_LIST, {
    errorMap: () => ({ message: 'Invalid feedback status' })
  })
});

export const listFeedbackQuerySchema = z.object({
  q: z.string().optional().default(''),
  source: z.string().optional(),
  sentiment: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional().default('-receivedAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});
