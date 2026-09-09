import './config/loadEnv.js';

import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';
import { getCorsOrigins } from './config/loadEnv.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);

  const server = httpServer.listen(PORT, () => {
    console.log(`🚀 KABPRO Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 CORS origins: ${getCorsOrigins().join(', ')}`);
    console.log(`⚡ Socket.IO online (/notifications, /chat, /tracking)`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Stop the other server (Ctrl+C in the other terminal) or set PORT in .env.development.`);
      process.exit(1);
    }
    throw err;
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

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 [Server Process] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('💥 [Server Process] Uncaught Exception:', err);
  });

  start().catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
