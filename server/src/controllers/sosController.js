import { enqueue } from '../services/notificationService.js';
import { getIO } from '../services/socketService.js';

export const handleSos = async (req, res) => {
  try {
    const {
      driverId,
      driverName,
      driverMobile,
      vehicleReg,
      tripId,
      latitude,
      longitude,
      accuracy,
      address,
      timestamp
    } = req.body || {};

    const sosTimestamp = timestamp || new Date().toISOString();
    const effectiveDriverName = driverName || (req.driver && req.driver.name) || 'Driver';
    const effectiveVehicle = vehicleReg || (req.driver && req.driver.assignedVehicle) || 'Fleet Vehicle';
    const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
    const mapsLink = hasCoords ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;

    const sosId = `SOS-${Date.now().toString(36).toUpperCase()}`;

    const locationDesc = address
      ? address
      : hasCoords
      ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy || 0)}m)`
      : 'Location unavailable';

    const message = `URGENT: SOS triggered by ${effectiveDriverName} (${effectiveVehicle}). Location: ${locationDesc}.`;

    console.log(`\n🚨🚨🚨 [EMERGENCY SOS RECEIVED] 🚨🚨🚨`);
    console.log(`ID: ${sosId}`);
    console.log(`Driver: ${effectiveDriverName} (${driverMobile || 'N/A'})`);
    console.log(`Vehicle: ${effectiveVehicle} | Trip: ${tripId || 'N/A'}`);
    console.log(`Coordinates: ${hasCoords ? `${latitude}, ${longitude}` : 'No GPS'}`);
    if (mapsLink) console.log(`Map: ${mapsLink}`);
    console.log(`Time: ${sosTimestamp}\n`);

    // 1. Enqueue critical notification in database & push queue
    enqueue({
      category: 'fleet',
      priority: 'critical',
      title: '🚨 EMERGENCY SOS ALERT',
      message,
      link: mapsLink || '/vehicles',
      metadata: {
        sosId,
        driverId: driverId || (req.driver && req.driver._id),
        driverName: effectiveDriverName,
        driverMobile,
        vehicleReg: effectiveVehicle,
        tripId,
        latitude,
        longitude,
        accuracy,
        address,
        mapsLink,
        timestamp: sosTimestamp
      }
    });

    // 2. Broadcast immediately over Socket.IO to all listening admins & dispatchers
    try {
      const io = getIO();
      if (io) {
        io.emit('sos_alert', {
          sosId,
          driverName: effectiveDriverName,
          vehicleReg: effectiveVehicle,
          latitude,
          longitude,
          mapsLink,
          timestamp: sosTimestamp,
          message
        });
      }
    } catch (err) {
      console.warn('Socket broadcast error in SOS:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Emergency SOS alert received and broadcasted to dispatch team.',
      sosId,
      timestamp: sosTimestamp,
      mapsLink
    });
  } catch (error) {
    console.error('Error handling SOS:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process SOS alert'
    });
  }
};
