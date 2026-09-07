import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 KABPRO Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🚗 Vehicles API: http://localhost:${PORT}/api/vehicles`);
  });

  const handleGracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('💾 MongoDB connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnect:', err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 3000).unref();
  };

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
