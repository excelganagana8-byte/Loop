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
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching CLIENT_URL
      if (!origin || origin === env.CLIENT_URL || env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true
  }));

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    return sendSuccess(res, {
      status: 'healthy',
      service: 'loop-api',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/insights', insightRoutes);
  app.use('/api/ask', askRoutes);

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
