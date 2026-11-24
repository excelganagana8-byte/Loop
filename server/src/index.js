import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`[LOOP API] Server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[LOOP API] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[LOOP API] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[LOOP API] Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
