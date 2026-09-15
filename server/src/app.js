import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getDbStatus } from './config/db.js';
import { protect } from './middleware/authMiddleware.js';
import { resolveAgency } from './middleware/resolveAgency.js';

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
import tripExpenseRoutes from './routes/tripExpenses.js';
import complianceRoutes from './routes/compliance.js';
import maintenanceRoutes from './routes/maintenance.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import agencyRoutes from './routes/agencies.js';
import profileRoutes from './routes/profile.js';
import notificationRoutes from './routes/notifications.js';
import payrollRoutes from './routes/payroll.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import driverAssignmentRoutes from './routes/driverAssignments.js';
import sosRoutes from './routes/sos.js';
import activityRoutes from './routes/activities.js';
import revenueRoutes from './routes/revenue.js';

const app = express();

// ngrok / reverse proxy forwards X-Forwarded-For
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// CORS configuration (allow frontend origin or any during development)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      const allowed = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Agency-Id']
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

// Official Server Time (IST - Asia/Kolkata)
app.get('/api/server-time', (req, res) => {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const istFormatted = istFormatter.format(now);
  res.json({
    success: true,
    timestamp: now.getTime(),
    iso: now.toISOString(),
    timezone: 'Asia/Kolkata (IST)',
    ist: istFormatted
  });
});

app.use('/api', (req, res, next) => {
  if (getDbStatus().connected) return next();
  return res.status(503).json({
    success: false,
    error: 'Database unavailable. MongoDB is not connected.'
  });
});

// Public / auth routes (no tenant scope)
app.use('/api/auth', authRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/sos', sosRoutes);

// Mixed auth routes (dashboard user OR driver app) — must register BEFORE tenantApi
// so driver JWTs are not blocked by dashboard-only protect middleware.
app.use('/api/upload', uploadRoutes);
app.use('/api/driver-expenses', driverExpenseRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/trip-expenses', tripExpenseRoutes);

// Bookings: driver /my route + admin routes with own middleware chain
app.use('/api/bookings', bookingRoutes);

// Tenant-scoped fleet routes (require login + active agency)
const tenantApi = express.Router();
tenantApi.use(protect);
tenantApi.use(resolveAgency);

tenantApi.use('/profile', profileRoutes);
tenantApi.use('/vehicles', vehicleRoutes);
tenantApi.use('/drivers', driverRoutes);
tenantApi.use('/attendance', attendanceRoutes);
tenantApi.use('/contracts', contractRoutes);
tenantApi.use('/duty-logs', dutyLogRoutes);
tenantApi.use('/bills', billRoutes);
tenantApi.use('/monthly-bills', billRoutes);
tenantApi.use('/payments', paymentRoutes);
tenantApi.use('/fastag', fastagRoutes);
tenantApi.use('/expenses', expenseRoutes);
tenantApi.use('/compliance', complianceRoutes);
tenantApi.use('/maintenance', maintenanceRoutes);
tenantApi.use('/dashboard', dashboardRoutes);
tenantApi.use('/notifications', notificationRoutes);
tenantApi.use('/payroll', payrollRoutes);
tenantApi.use('/reports', reportRoutes);
tenantApi.use('/driver-assignments', driverAssignmentRoutes);
tenantApi.use('/activities', activityRoutes);
tenantApi.use('/revenue', revenueRoutes);
tenantApi.use('/trips', tripRoutes);

app.use('/api', tenantApi);

// Root route
app.get('/', (req, res) => {
  res.send('KABPRO API Server is running. Access API endpoints at /api/...');
});

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
