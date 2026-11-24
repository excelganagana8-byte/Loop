import { z } from 'zod';

export const distributionQuerySchema = z.object({
  by: z.enum(['sentiment', 'category', 'source']).default('sentiment'),
  range: z.enum(['7d', '30d', '90d', 'all']).default('30d')
});

export const trendsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).default('30d')
});
