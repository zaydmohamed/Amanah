const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop_management_db';
    
    // Attempt standard connection first with 3 second timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected to database: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to primary URI (${err.message}).`);
    
    if (process.env.ENABLE_IN_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test') {
      console.log('[MongoDB] Spawning in-memory MongoDB server instance for standalone execution...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const inMemoryUri = mongoMemoryServer.getUri();
        await mongoose.connect(inMemoryUri);
        console.log(`[MongoDB] Connected to In-Memory MongoDB: ${inMemoryUri}`);
      } catch (innerErr) {
        console.error('[MongoDB] Failed to start in-memory MongoDB:', innerErr);
        process.exit(1);
      }
    } else {
      console.error('[MongoDB] Fatal error connecting to database:', err);
      process.exit(1);
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

