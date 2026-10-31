const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  // If already connected, reuse existing connection (vital for Vercel serverless)
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop_management_db';
    
    // Attempt standard connection
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected to database: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to primary URI (${err.message}).`);
    
    // In Vercel serverless, don't spawn in-memory server
    if (process.env.VERCEL) {
      console.error('[MongoDB] Running on Vercel: Please set MONGODB_URI in your Vercel Project Settings > Environment Variables.');
      throw err;
    }

    if (process.env.ENABLE_IN_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test') {
      console.log('[MongoDB] Spawning in-memory MongoDB server instance for standalone execution...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const inMemoryUri = mongoMemoryServer.getUri();
        await mongoose.connect(inMemoryUri);
        console.log(`[MongoDB] Connected to In-Memory MongoDB: ${inMemoryUri}`);
        return mongoose.connection;
      } catch (innerErr) {
        console.error('[MongoDB] Failed to start in-memory MongoDB:', innerErr);
        throw innerErr;
      }
    } else {
      console.error('[MongoDB] Fatal error connecting to database:', err);
      throw err;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('[MongoDB] Error disconnecting:', err);
  }
};

module.exports = { connectDB, disconnectDB };
