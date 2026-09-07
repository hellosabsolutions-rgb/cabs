import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export const getDbStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    readyState,
    connected: readyState === 1,
    label: READY_STATES[readyState] || 'unknown'
  };
};

/**
 * MongoDB connection manager with connection pooling and event monitoring.
 * Throws on failure so the HTTP server never accepts traffic without a DB.
 */
export const connectDB = async () => {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fleetos';
  // Avoid localhost → IPv6 (::1) vs IPv4 split when mongod listens on both.
  uri = uri.replace('://localhost', '://127.0.0.1');

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully.');
    });
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error('👉 Ensure MongoDB is running locally or set MONGO_URI in .env');
    throw error;
  }
};
