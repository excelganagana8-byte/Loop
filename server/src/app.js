import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { sendSuccess, sendError } from './utils/apiResponse.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import workspaceRoutes from './modules/workspace/workspace.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import insightRoutes from './modules/insights/insight.routes.js';
import askRoutes from './modules/ask/ask.routes.js';

export const createApp = () => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS setup
  const configuredOrigins = (env.CLIENT_URL || '')
    .split(',')
    .map(url => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      // Check if origin is allowed
      const isConfigured = configuredOrigins.includes(cleanOrigin);
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
      const isVercel = /^https:\/\/.*\.vercel\.app$/.test(cleanOrigin);
      const isDev = env.NODE_ENV !== 'production';

      if (isConfigured || isLocalhost || isVercel || isDev) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Explicit preflight handling
  app.options('*', cors());

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  const sendHealth = (req, res) => {
    return sendSuccess(res, {
      status: 'healthy',
      service: 'loop-api',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    });
  };
  app.get('/api/health', sendHealth);
  app.get('/health', sendHealth);

  // API Routes (mounted at /api and root paths for resilience)
  app.use('/api/auth', authRoutes);
  app.use('/auth', authRoutes);

  app.use('/api/workspaces', workspaceRoutes);
  app.use('/workspaces', workspaceRoutes);

  app.use('/api/feedback', feedbackRoutes);
  app.use('/feedback', feedbackRoutes);

  app.use('/api/ai', aiRoutes);
  app.use('/ai', aiRoutes);

  app.use('/api/analytics', analyticsRoutes);
  app.use('/analytics', analyticsRoutes);

  app.use('/api/insights', insightRoutes);
  app.use('/insights', insightRoutes);

  app.use('/api/ask', askRoutes);
  app.use('/ask', askRoutes);

  // Catch-all 404 handler for unhandled routes
  app.use((req, res) => {
    return sendError(res, {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }, 404);
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};
