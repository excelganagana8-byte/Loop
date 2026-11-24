import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Relaxed rate limiting in test/development environments
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again later.'
    }
  }
});

export const askLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'test' ? 1000 : 30, // 30 queries per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many queries. Please slow down.'
    }
  }
});
