import { notify } from './notificationService.js';
import { emitToDriver } from './socketService.js';
import { Driver } from '../models/Driver.js';

async function notifyDriverByName(name, event, data) {
  if (!name || name === 'None' || name === '—') return;
  try {
    const driver = await Driver.findOne({
      name: new RegExp(`^${name.trim()}$`, 'i')
    }).select('_id');
    if (driver) {
      emitToDriver(driver._id, event, data);
      emitToDriver(driver._id, 'driver:updated', { action: event, ...data });
    }
  } catch (err) {
    console.warn('notifyDriverByName error:', err.message);
  }
}

/**
 * NotificationEmitter
 * ────────────────────
 * Domain-specific event hooks — call these from controllers
 * after successful database writes.
 *
 * Each function accepts an `actor` object { userId, agencyId }
 * and domain-specific data.
 */

// ─── BOOKINGS ──────────────────────────────────────────────────────────────

export const emitBookingCreated = ({ userId, agencyId, booking }) => {
  notify.bookings({
    userId,
    agencyId,
    priority: 'success',
    title: 'New Booking Created',
    message: `Booking #${booking.bookingNumber || booking.id?.slice(-6)} — ${booking.vehicle || 'Vehicle'} for ${booking.customerName || 'Customer'} on ${booking.startDate}.`,
    metadata: { bookingId: booking._id?.toString(), bookingNumber: booking.bookingNumber }
  });

  if (booking.driverName) {
    notifyDriverByName(booking.driverName, 'booking:assigned', { booking });
  }
};

export const emitBookingUpdated = ({ userId, agencyId, booking, changes = '' }) => {
  notify.bookings({
    userId,
    agencyId,
    priority: 'info',
    title: 'Booking Updated',
    message: `Booking #${booking.bookingNumber || booking.id?.slice(-6)} has been updated. ${changes}`,
    metadata: { bookingId: booking._id?.toString() }
  });

  if (booking.driverName) {
    notifyDriverByName(booking.driverName, 'booking:updated', { booking, changes });
  }
};

export const emitBookingCompleted = ({ userId, agencyId, booking }) => {
  notify.bookings({
    userId,
    agencyId,
    priority: 'success',
    title: 'Trip Completed',
    message: `Trip #${booking.bookingNumber || booking.id?.slice(-6)} completed. Revenue: ₹${(booking.revenue || booking.totalAmount || 0).toLocaleString('en-IN')}.`,
    metadata: { bookingId: booking._id?.toString(), revenue: booking.revenue }
  });

  if (booking.driverName) {
    notifyDriverByName(booking.driverName, 'booking:completed', { booking });
  }
};

export const emitBookingCancelled = ({ userId, agencyId, booking }) => {
  notify.bookings({
    userId,
    agencyId,
    priority: 'warning',
    title: 'Booking Cancelled',
    message: `Booking #${booking.bookingNumber || booking.id?.slice(-6)} has been cancelled.`,
    metadata: { bookingId: booking._id?.toString() }
  });
};

export const emitPaymentReceived = ({ userId, agencyId, booking, amount }) => {
  notify.financial({
    userId,
    agencyId,
    priority: 'success',
    title: 'Payment Received',
    message: `₹${amount.toLocaleString('en-IN')} received for Booking #${booking.bookingNumber || booking.id?.slice(-6)}.`,
    metadata: { bookingId: booking._id?.toString(), amount }
  });
};

// ─── FLEET ─────────────────────────────────────────────────────────────────

export const emitVehicleStatusChange = ({ userId, agencyId, vehicle, oldStatus, newStatus }) => {
  const priority = newStatus === 'Maintenance' ? 'warning' : 'info';
  notify.fleet({
    userId,
    agencyId,
    priority,
    title: `Vehicle ${newStatus === 'Maintenance' ? 'Sent to Workshop' : 'Status Updated'}`,
    message: `${vehicle.registrationNumber} status changed from ${oldStatus} to ${newStatus}.`,
    metadata: { vehicleId: vehicle._id?.toString(), registrationNumber: vehicle.registrationNumber, newStatus }
  });
};

export const emitDriverAssigned = ({ userId, agencyId, vehicle, driverName }) => {
  notify.fleet({
    userId,
    agencyId,
    priority: 'info',
    title: 'Driver Assigned',
    message: `${driverName} has been assigned to ${vehicle.registrationNumber}.`,
    metadata: { vehicleId: vehicle._id?.toString(), driverName }
  });

  if (driverName) {
    notifyDriverByName(driverName, 'driver:vehicle-assigned', {
      vehicleRegistration: vehicle.registrationNumber,
      vehicleId: vehicle._id?.toString()
    });
  }
};

export const emitDriverAdded = ({ userId, agencyId, driver }) => {
  notify.fleet({
    userId,
    agencyId,
    priority: 'success',
    title: 'New Driver Added',
    message: `${driver.name} has been added to the fleet.`,
    metadata: { driverId: driver._id?.toString(), driverName: driver.name }
  });
};

// ─── COMPLIANCE ────────────────────────────────────────────────────────────

export const emitComplianceExpiring = ({ userId, agencyId, entityName, documentName, daysLeft }) => {
  const priority = daysLeft <= 7 ? 'critical' : 'warning';
  notify.compliance({
    userId,
    agencyId,
    priority,
    title: daysLeft <= 0 ? 'Document Expired' : 'Document Expiring Soon',
    message: `${entityName} — ${documentName} ${daysLeft <= 0 ? 'has expired' : `expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}.`,
    metadata: { entityName, documentName, daysLeft }
  });
};

export const emitDocumentUploaded = ({ userId, agencyId, entityName, documentName }) => {
  notify.compliance({
    userId,
    agencyId,
    priority: 'success',
    title: 'Document Uploaded',
    message: `${documentName} for ${entityName} has been uploaded and verified.`,
    metadata: { entityName, documentName }
  });
};

// ─── MAINTENANCE ────────────────────────────────────────────────────────────

export const emitMaintenanceScheduled = ({ userId, agencyId, record }) => {
  notify.maintenance({
    userId,
    agencyId,
    priority: 'warning',
    title: 'Maintenance Scheduled',
    message: `${record.vehicle} — ${record.type} scheduled. Estimated cost: ₹${(record.cost || 0).toLocaleString('en-IN')}.`,
    metadata: { maintenanceId: record._id?.toString(), vehicle: record.vehicle, type: record.type }
  });
};

export const emitMaintenanceCompleted = ({ userId, agencyId, record }) => {
  notify.maintenance({
    userId,
    agencyId,
    priority: 'success',
    title: 'Maintenance Completed',
    message: `${record.vehicle} — ${record.type} completed. Cost: ₹${(record.cost || 0).toLocaleString('en-IN')}.`,
    metadata: { maintenanceId: record._id?.toString(), vehicle: record.vehicle }
  });
};

// ─── FINANCIAL ─────────────────────────────────────────────────────────────

export const emitLowFastagBalance = ({ userId, agencyId, vehicleReg, balance }) => {
  const priority = balance < 100 ? 'critical' : 'warning';
  notify.financial({
    userId,
    agencyId,
    priority,
    title: 'Low FASTag Balance',
    message: `${vehicleReg} FASTag balance is ₹${balance.toLocaleString('en-IN')}. Recharge to avoid toll disruptions.`,
    metadata: { vehicleReg, balance }
  });
};

export const emitFastagRecharged = ({ userId, agencyId, vehicleReg, amount }) => {
  notify.financial({
    userId,
    agencyId,
    priority: 'success',
    title: 'FASTag Recharged',
    message: `${vehicleReg} FASTag recharged with ₹${amount.toLocaleString('en-IN')}.`,
    metadata: { vehicleReg, amount }
  });
};

export const emitExpenseLogged = ({ userId, agencyId, expense }) => {
  notify.financial({
    userId,
    agencyId,
    priority: 'info',
    title: 'Expense Logged',
    message: `${expense.category} expense of ₹${(expense.amount || 0).toLocaleString('en-IN')} recorded for ${expense.vehicle || 'fleet'}.`,
    metadata: { expenseId: expense._id?.toString(), category: expense.category, amount: expense.amount }
  });
};

// ─── SYSTEM ────────────────────────────────────────────────────────────────

export const emitLoginAlert = ({ userId, userAgent = '', ip = '' }) => {
  notify.system({
    userId,
    priority: 'info',
    title: 'New Login Detected',
    message: `Your account was accessed from ${ip ? `IP ${ip}` : 'a new device'}.`,
    metadata: { userAgent: userAgent.slice(0, 80), ip }
  });
};

export const emitPasswordChanged = ({ userId }) => {
  notify.system({
    userId,
    priority: 'warning',
    title: 'Password Changed',
    message: 'Your account password was changed. If this was not you, contact support immediately.',
    metadata: {}
  });
};

export const emitProfileUpdated = ({ userId }) => {
  notify.system({
    userId,
    priority: 'success',
    title: 'Profile Updated',
    message: 'Your profile information has been updated successfully.',
    metadata: {}
  });
};

export const emitAgencyCreated = ({ userId, agencyName }) => {
  notify.system({
    userId,
    priority: 'success',
    title: 'Agency Created',
    message: `New agency "${agencyName}" has been set up and linked to your account.`,
    metadata: { agencyName }
  });
};
