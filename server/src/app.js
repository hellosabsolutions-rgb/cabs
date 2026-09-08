import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getDbStatus } from './config/db.js';

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
import bookingRoutes from './routes/bookings.js';
import tripRoutes from './routes/trips.js';
import expenseRoutes from './routes/expenses.js';
import complianceRoutes from './routes/compliance.js';
import maintenanceRoutes from './routes/maintenance.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import agencyRoutes from './routes/agencies.js';
import profileRoutes from './routes/profile.js';
import notificationRoutes from './routes/notifications.js';
import payrollRoutes from './routes/payroll.js';
import reportRoutes from './routes/reports.js';

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

// Rate Limiting (per 2 mins per IP for general APIs)
const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 2 minutes.'
  }
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const db = getDbStatus();
  res.status(db.connected ? 200 : 503).json({
    success: db.connected,
    status: db.connected ? 'online' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db.label
  });
});

app.use('/api', (req, res, next) => {
  if (getDbStatus().connected) return next();
  return res.status(503).json({
    success: false,
    error: 'Database unavailable. MongoDB is not connected.'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/driver-expenses', driverExpenseRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/duty-logs', dutyLogRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/monthly-bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/fastag', fastagRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', bookingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('KABPRO API Server is running. Access API endpoints at /api/...');
});

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
