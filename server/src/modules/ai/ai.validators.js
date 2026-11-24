import { z } from 'zod';
import {
  AI_SENTIMENTS,
  AI_CATEGORIES
} from 'loop-shared';

// Zod schema for structured output returned by Anthropic tool use
export const aiAnalysisOutputSchema = z.object({
  sentiment: z.enum([
    AI_SENTIMENTS.POSITIVE,
    AI_SENTIMENTS.NEGATIVE,
    AI_SENTIMENTS.NEUTRAL
  ]),
  category: z.enum([
    AI_CATEGORIES.BUG,
    AI_CATEGORIES.FEATURE_REQUEST,
    AI_CATEGORIES.PRICING,
    AI_CATEGORIES.USABILITY,
    AI_CATEGORIES.CUSTOMER_SUPPORT,
    AI_CATEGORIES.PERFORMANCE,
    AI_CATEGORIES.PRAISE,
    AI_CATEGORIES.OTHER
  ]),
  summary: z.string().trim().min(3).max(300),
  keyPhrases: z.array(z.string().trim()).min(1).max(10),
  confidence: z.number().min(0).max(1)
});

export const batchAnalyzeSchema = z.object({
  feedbackIds: z.array(z.string()).max(25).optional()
});
