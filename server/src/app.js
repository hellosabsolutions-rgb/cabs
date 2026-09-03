import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFound } from './middleware/errorHandler.js';

// Route imports
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import attendanceRoutes from './routes/attendance.js';
import driverExpenseRoutes from './routes/driverExpenses.js';
import contractRoutes from './routes/contracts.js';
import dutyLogRoutes from './routes/dutyLogs.js';
import billRoutes from './routes/bills.js';
import paymentRoutes from './routes/payments.js';
import fuelLogRoutes from './routes/fuelLogs.js';
import fastagRoutes from './routes/fastag.js';
import tripRoutes from './routes/trips.js';
import expenseRoutes from './routes/expenses.js';
import complianceRoutes from './routes/compliance.js';
import maintenanceRoutes from './routes/maintenance.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import agencyRoutes from './routes/agencies.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration (allow frontend origin or any during development)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Gzip Compression for high-throughput responses
app.use(compression());

// Body Parsers with 10MB limits for receipts, slips, and document photos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting (120 requests per 15 mins per IP for general APIs)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/driver-expenses', driverExpenseRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/duty-logs', dutyLogRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/fastag', fastagRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('FleetOS API Server is running. Access API endpoints at /api/...');
});

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
