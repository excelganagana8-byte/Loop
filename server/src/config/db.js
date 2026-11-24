import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    
    // In production or test with existing uri
    if (env.NODE_ENV === 'production') {
      await mongoose.connect(env.MONGODB_URI);
      console.log(`[Database] Connected to MongoDB: ${mongoose.connection.host}`);
      return mongoose.connection;
    }

    // Try connecting to specified MONGODB_URI with 2s timeout
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`[Database] Connected to MongoDB at: ${env.MONGODB_URI}`);
      return mongoose.connection;
    } catch (localErr) {
      console.warn(`[Database] Could not connect to ${env.MONGODB_URI} (${localErr.message}). Starting in-memory MongoDB fallback...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] In-memory MongoDB started and connected: ${memoryUri}`);
      return mongoose.connection;
    }
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error during database disconnect:', err);
  }
};
