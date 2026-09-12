import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import {
  emitBookingCreated,
  emitBookingAssigned,
  emitBookingUnassigned,
  emitBookingUpdated,
  emitBookingCompleted,
  emitBookingCancelled,
  emitPaymentReceived,
  notifyDriverByName
} from '../services/notificationEmitter.js';
import { broadcastAll, emitToDriver } from '../services/socketService.js';

// @desc    Get all bookings with optional filters (month, date, status, paymentStatus, search)
// @route   GET /api/bookings
export const getAllBookings = async (req, res, next) => {
  try {
    const { month, date, status, paymentStatus, vehicle, search, driverName } = req.query;
    const query = {};

    // Filter by specific date (YYYY-MM-DD)
    if (date) {
      query.startDate = date;
    }

    // Filter by month (YYYY-MM)
    if (month && !date) {
      query.startDate = { $regex: `^${month}` };
    }

    // Filter by trip status (Scheduled, Ongoing, Completed)
    if (status && status !== 'All') {
      if (status === 'Dept-Weekend') {
        query.$or = [{ isDepartmentVehicle: true }, { weekendDutyType: { $exists: true, $ne: 'Regular Commercial Trip' } }];
      } else {
        query.status = status;
      }
    }

    // Filter by payment status (Paid, Partial, Unpaid)
    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    // Filter by vehicle registration
    if (vehicle) {
      query.vehicle = vehicle;
    }

    // Filter by driver name
    if (driverName) {
      query.driverName = { $regex: driverName, $options: 'i' };
    }

    // Search query
    if (search) {
      const sRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { bookingNumber: sRegex },
        { tripNumber: sRegex },
        { vehicle: sRegex },
        { driverName: sRegex },
        { customerName: sRegex },
        { route: sRegex },
        { pickupLocation: sRegex },
        { dropLocation: sRegex }
      ];
    }

    const countDocs = await Booking.countDocuments();
    if (countDocs === 0) {
      const today = new Date();
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const d0 = fmt(today);
      const d1 = fmt(new Date(Date.now() + 86400000));
      const d3 = fmt(new Date(Date.now() + 3 * 86400000));
      const d5 = fmt(new Date(Date.now() + 5 * 86400000));

      await Booking.insertMany([
        {
          bookingNumber: 'BK-9481',
          status: 'Ongoing',
          tripType: 'One-way (Single)',
          startDate: d0,
          startTime: '10:30 AM',
          customerName: 'Rahul Sharma',
          customerPhone: '+91 98101 23456',
          pickupLocation: 'Terminal 3, Departure Gate 4, IGI Airport',
          dropLocation: 'Cyber City, Building 10, DLF Phase 2, Gurugram',
          route: 'IGI Airport T3 → Cyber City Gurugram',
          vehicle: 'TRP-8841',
          vehicleModel: 'Toyota Innova Crysta',
          driverName: 'Maddy',
          revenue: 1850,
          totalAmount: 1850,
          advanceAmount: 1850,
          pendingAmount: 0,
          paymentStatus: 'Paid',
          notes: 'Corporate client flight arrival 6E-204. Need AC turned on prior to pickup.'
        },
        {
          bookingNumber: 'BK-9482',
          status: 'Scheduled',
          tripType: 'Round Trip',
          startDate: d0,
          startTime: '04:15 PM',
          endDate: d0,
          endTime: '09:00 PM',
          customerName: 'Priya Narang',
          customerPhone: '+91 98712 34567',
          pickupLocation: 'B-4/12, Safdarjung Enclave, New Delhi',
          dropLocation: 'Sector 62, Electronic City, Noida',
          route: 'Safdarjung Enclave → Noida Sec 62 (Round Trip)',
          vehicle: 'TRP-8841',
          vehicleModel: 'Toyota Innova Crysta',
          driverName: 'Maddy',
          revenue: 3200,
          totalAmount: 3200,
          advanceAmount: 1000,
          pendingAmount: 2200,
          paymentStatus: 'Partial',
          notes: 'Family with elderly passenger. Assist with luggage. Collect ₹2,200 balance.'
        },
        {
          bookingNumber: 'BK-9483',
          status: 'Scheduled',
          tripType: 'One-way (Single)',
          startDate: d1,
          startTime: '07:00 AM',
          customerName: 'Vikramaditya Oberoi',
          customerPhone: '+91 99580 98765',
          pickupLocation: 'The Leela Palace, Chanakyapuri, New Delhi',
          dropLocation: 'Noida Film City, Sector 16A, Noida',
          route: 'Chanakyapuri → Noida Film City',
          vehicle: 'TRP-8841',
          vehicleModel: 'Toyota Innova Crysta',
          driverName: 'Maddy',
          revenue: 2100,
          totalAmount: 2100,
          advanceAmount: 0,
          pendingAmount: 2100,
          paymentStatus: 'Unpaid',
          notes: 'VIP executive guest. On-time pickup.'
        },
        {
          bookingNumber: 'BK-9484',
          status: 'Scheduled',
          tripType: 'Round Trip',
          startDate: d3,
          startTime: '06:00 AM',
          customerName: 'Dr. Anita Desai',
          customerPhone: '+91 97110 54321',
          pickupLocation: 'Vasant Vihar, Block C, New Delhi',
          dropLocation: 'Neemrana Fort Palace, Delhi-Jaipur Highway',
          route: 'Delhi ⇄ Neemrana Fort Palace',
          vehicle: 'TRP-8841',
          vehicleModel: 'Toyota Innova Crysta',
          driverName: 'Maddy',
          revenue: 6500,
          totalAmount: 6500,
          advanceAmount: 2000,
          pendingAmount: 4500,
          paymentStatus: 'Partial',
          notes: 'Outstation day tour trip. Includes highway toll.'
        }
      ]).catch(() => {});
    }

    const bookings = await Booking.find(query).sort({ startDate: -1, createdAt: -1 });

    // Calculate aggregated metrics
    let totalRevenue = 0;
    let totalAdvance = 0;
    let totalBalancePaid = 0;
    let totalPending = 0;
    let totalExpenses = 0;
    let totalProfit = 0;

    bookings.forEach(b => {
      const rev = Number(b.revenue || b.totalAmount || 0);
      const adv = Number(b.advanceAmount || 0);
      const bal = Number(b.balancePaid || 0);
      const pend = Number(b.pendingAmount || Math.max(0, rev - (adv + bal)));
      const exp = Number(b.expenses || 0);
      const prof = Number(b.profit || (rev - exp));

      totalRevenue += rev;
      totalAdvance += adv;
      totalBalancePaid += bal;
      totalPending += pend;
      totalExpenses += exp;
      totalProfit += prof;
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      summary: {
        totalRevenue,
        totalAdvance,
        totalBalancePaid,
        totalPending,
        totalExpenses,
        totalProfit
      },
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new booking (advance or current)
// @route   POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const {
      vehicle,
      driverName,
      customerName,
      customerPhone,
      pickupLocation,
      dropLocation,
      route,
      startDate,
      startTime,
      endDate,
      endTime,
      tripType,
      revenue,
      totalAmount,
      advanceAmount,
      advancePaymentMode,
      startOdometer,
      fuelCost,
      fastagCost,
      driverBata,
      otherExpenses,
      notes,
      isDepartmentVehicle,
      departmentName,
      weekendDutyType
    } = req.body;

    if (!vehicle || !pickupLocation || !dropLocation || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle, Pickup & Drop locations, and Start Date are required.'
      });
    }

    // Check if vehicle is already booked on this date (unless forceBook is requested)
    if (!req.body.forceBook) {
      const conflictingBooking = await Booking.findOne({
        vehicle,
        $or: [
          { startDate },
          {
            startDate: { $lte: startDate },
            endDate: { $gte: startDate }
          }
        ],
        status: { $in: ['Scheduled', 'Ongoing'] }
      });

      if (conflictingBooking) {
        return res.status(400).json({
          success: false,
          error: `Vehicle ${vehicle} is already booked on ${startDate} (${conflictingBooking.bookingNumber} - ${conflictingBooking.customerName}). Please choose a free vehicle.`
        });
      }
    }

    // Auto-generate booking number
    const count = await Booking.countDocuments();
    const bookingNumber = `BKG-${1040 + count + 1}`;

    const totalFare = Number(revenue || totalAmount || 0);
    const advance = Number(advanceAmount || 0);
    const pending = Math.max(0, totalFare - advance);

    let paymentStatus = 'Unpaid';
    if (pending === 0 && totalFare > 0) {
      paymentStatus = 'Paid';
    } else if (advance > 0) {
      paymentStatus = 'Partial';
    }

    // Determine initial status based on date
    const today = new Date().toISOString().split('T')[0];
    let initialStatus = 'Scheduled';
    if (startDate <= today && req.body.status !== 'Scheduled') {
      initialStatus = req.body.status || 'Ongoing';
    }

    // Lookup vehicle model if available
    let vehicleModel = req.body.vehicleModel;
    if (!vehicleModel) {
      const vDoc = await Vehicle.findOne({ registrationNumber: vehicle });
      if (vDoc) vehicleModel = vDoc.model || vDoc.make || 'Commercial Vehicle';
    }

    const booking = await Booking.create({
      bookingNumber,
      tripType: tripType || 'Round Trip',
      vehicle,
      vehicleModel,
      isDepartmentVehicle: Boolean(isDepartmentVehicle),
      departmentName,
      weekendDutyType: weekendDutyType || 'Regular Commercial Trip',
      driverName: driverName || 'Assigned Driver',
      customerName: customerName || 'Passenger',
      customerPhone,
      pickupLocation,
      dropLocation,
      route: route || `${pickupLocation} → ${dropLocation}`,
      startDate,
      startTime: startTime || '09:00 AM',
      endDate: endDate || startDate,
      endTime,
      startOdometer: Number(startOdometer) || 0,
      revenue: totalFare,
      totalAmount: totalFare,
      advanceAmount: advance,
      advancePaymentMode: advancePaymentMode || 'UPI',
      advanceDate: advance > 0 ? (req.body.advanceDate || today) : undefined,
      pendingAmount: pending,
      paymentStatus,
      fuelCost: Number(fuelCost) || 0,
      fastagCost: Number(fastagCost) || 0,
      driverBata: Number(driverBata) || 0,
      otherExpenses: Number(otherExpenses) || 0,
      status: initialStatus,
      notes
    });

    // Dispatch real-time notification
    emitBookingCreated({
      userId: req.user?._id,
      agencyId: req.user?.currentAgency,
      booking
    });

    res.status(201).json({
      success: true,
      data: booking,
      warning: conflictingBooking
        ? `Note: ${vehicle} already has another booking (${conflictingBooking.bookingNumber}) on ${startDate}.`
        : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings assigned to authenticated driver
// @route   GET /api/bookings/my
// @access  Private (driver)
export const getMyBookings = async (req, res, next) => {
  try {
    const driver = req.driver;
    if (!driver) {
      return res.status(401).json({ success: false, error: 'Driver authentication required' });
    }

    const driverName = driver.name?.trim();
    const vehicleReg = driver.assignedVehicle?.trim();

    const queryOr = [];
    if (driverName) {
      queryOr.push({ driverName: new RegExp(`^${driverName}$`, 'i') });
    }
    if (vehicleReg && vehicleReg !== '—' && vehicleReg !== 'None' && vehicleReg !== 'Unassigned') {
      queryOr.push({ vehicle: new RegExp(`^${vehicleReg}$`, 'i') });
    }

    const query = queryOr.length > 0 ? { $or: queryOr } : { driverName };

    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    const bookings = await Booking.find(query).sort({ startDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking details
// @route   PUT /api/bookings/:id
export const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const prevDriver = booking.driverName;

    Object.assign(booking, req.body);
    await booking.save();

    // Check if driver was re-assigned or unassigned
    if (req.body.driverName !== undefined && req.body.driverName !== prevDriver) {
      if (prevDriver && prevDriver !== 'None' && prevDriver !== '—' && prevDriver !== 'Unassigned') {
        emitBookingUnassigned({
          userId: req.user?._id,
          agencyId: req.user?.currentAgency,
          booking,
          previousDriverName: prevDriver
        });
      }
      if (booking.driverName && booking.driverName !== 'None' && booking.driverName !== '—' && booking.driverName !== 'Unassigned') {
        emitBookingAssigned({
          userId: req.user?._id,
          agencyId: req.user?.currentAgency,
          booking,
          driverName: booking.driverName
        });
      }
    }

    emitBookingUpdated({
      userId: req.user?._id,
      agencyId: req.user?.currentAgency,
      booking
    });

    broadcastAll('booking:updated', { booking });
    broadcastAll('driver:any_change', { action: 'booking:updated', bookingId: booking._id });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking lifecycle status (Scheduled -> Ongoing -> Completed / Cancelled)
// @route   PATCH /api/bookings/:id/status
// @access  Public / Private (dashboard or driver)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, startOdometer, endOdometer, notes } = req.body;

    const validStatuses = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const prevStatus = booking.status;
    booking.status = status;
    if (notes) {
      booking.notes = booking.notes ? `${booking.notes}\n${notes}` : notes;
    }

    const now = new Date();
    const istTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(now);

    // If transitioning to Ongoing (Trip started)
    if (status === 'Ongoing') {
      booking.startTime = booking.startTime || istTime;
      if (startOdometer !== undefined) {
        booking.startOdometer = Number(startOdometer) || booking.startOdometer;
      }
      // Update vehicle status to Running
      if (booking.vehicle) {
        await Vehicle.findOneAndUpdate(
          { registrationNumber: booking.vehicle },
          { status: 'Running', ...(booking.startOdometer ? { odometer: booking.startOdometer } : {}) }
        );
      }
      // Update driver status to On duty
      if (booking.driverName) {
        await Driver.findOneAndUpdate(
          { name: new RegExp(`^${booking.driverName.trim()}$`, 'i') },
          { status: 'On duty' }
        );
      }
    }

    // If transitioning to Completed
    if (status === 'Completed') {
      booking.endTime = istTime;
      booking.endDate = booking.endDate || now.toISOString().split('T')[0];
      if (endOdometer !== undefined) {
        booking.endOdometer = Number(endOdometer);
        const startKm = booking.startOdometer || 0;
        booking.totalKmRun = Math.max(0, booking.endOdometer - startKm);
      }
      // Update vehicle to Active and update odometer
      if (booking.vehicle) {
        await Vehicle.findOneAndUpdate(
          { registrationNumber: booking.vehicle },
          {
            status: 'Active',
            ...(booking.endOdometer ? { odometer: booking.endOdometer } : {})
          }
        );
      }
    }

    // If cancelled, set vehicle to Active if it was Running
    if (status === 'Cancelled' && booking.vehicle) {
      await Vehicle.findOneAndUpdate(
        { registrationNumber: booking.vehicle, status: 'Running' },
        { status: 'Active' }
      );
    }

    await booking.save();

    // Trigger domain notifications
    if (status === 'Completed') {
      emitBookingCompleted({
        userId: req.user?._id,
        agencyId: req.user?.currentAgency,
        booking
      });
    } else if (status === 'Cancelled') {
      emitBookingCancelled({
        userId: req.user?._id,
        agencyId: req.user?.currentAgency,
        booking
      });
    } else {
      emitBookingUpdated({
        userId: req.user?._id,
        agencyId: req.user?.currentAgency,
        booking,
        changes: `Status changed from ${prevStatus} to ${status}`
      });
    }

    // Real-time Socket.IO broadcasts for dashboard and driver apps
    broadcastAll('booking:updated', { booking, prevStatus, status });
    broadcastAll('driver:any_change', { action: 'booking:status', bookingId: booking._id, status });
    if (booking.driverName) {
      notifyDriverByName(booking.driverName, 'booking:updated', { booking, status });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}.`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign or unassign driver/vehicle to a booking
// @route   PATCH /api/bookings/:id/assign
// @access  Public / Private (dashboard)
export const assignBookingDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { driverName, vehicle } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const prevDriver = booking.driverName;
    const isUnassigning = !driverName || driverName === 'None' || driverName === '—' || driverName === 'Unassigned';

    if (isUnassigning) {
      booking.driverName = 'Unassigned';
    } else {
      booking.driverName = driverName.trim();
    }

    if (vehicle) {
      booking.vehicle = vehicle.trim();
    }

    await booking.save();

    // Socket and domain event notifications
    if (prevDriver && prevDriver !== 'Unassigned' && prevDriver !== 'None' && prevDriver !== '—') {
      emitBookingUnassigned({
        userId: req.user?._id,
        agencyId: req.user?.currentAgency,
        booking,
        previousDriverName: prevDriver
      });
    }

    if (!isUnassigning && booking.driverName) {
      emitBookingAssigned({
        userId: req.user?._id,
        agencyId: req.user?.currentAgency,
        booking,
        driverName: booking.driverName
      });
    }

    broadcastAll('booking:updated', { booking, action: isUnassigning ? 'unassigned' : 'assigned' });
    broadcastAll('driver:any_change', { action: 'booking:assignment', bookingId: booking._id });

    res.status(200).json({
      success: true,
      message: isUnassigning
        ? 'Driver unassigned from booking successfully.'
        : `Booking assigned to ${booking.driverName} successfully.`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete booking & record balance payment settlement
// @route   PATCH /api/bookings/:id/complete
export const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const {
      endOdometer,
      fuelCost,
      fastagCost,
      driverBata,
      otherExpenses,
      balanceReceived,       // boolean: true if remaining or partial payment received
      balancePaid,           // number: amount paid at completion
      balancePaymentMode,   // 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'
      paymentNotes,
      notes
    } = req.body;

    if (endOdometer !== undefined) {
      booking.endOdometer = Number(endOdometer);
      booking.totalKmRun = Math.max(0, booking.endOdometer - (booking.startOdometer || 0));
    }

    if (fuelCost !== undefined) booking.fuelCost = Number(fuelCost);
    if (fastagCost !== undefined) booking.fastagCost = Number(fastagCost);
    if (driverBata !== undefined) booking.driverBata = Number(driverBata);
    if (otherExpenses !== undefined) booking.otherExpenses = Number(otherExpenses);

    // Record balance payment received
    if (balanceReceived && balancePaid !== undefined) {
      booking.balancePaid = (Number(booking.balancePaid) || 0) + Number(balancePaid);
      booking.balancePaymentMode = balancePaymentMode || 'Cash';
      booking.balancePaymentDate = new Date().toISOString().split('T')[0];
    }

    if (paymentNotes) {
      booking.paymentNotes = paymentNotes;
    }

    if (notes) {
      booking.notes = notes;
    }

    booking.status = 'Completed';
    booking.endDate = booking.endDate || new Date().toISOString().split('T')[0];

    await booking.save();

    emitBookingCompleted({
      userId: req.user?._id,
      agencyId: req.user?.currentAgency,
      booking
    });

    broadcastAll('booking:completed', { booking });
    broadcastAll('booking:updated', { booking });
    broadcastAll('driver:any_change', { action: 'booking:completed', bookingId: booking._id });

    res.status(200).json({
      success: true,
      message: 'Booking completed successfully and payment record updated.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record or update payment for a booking
// @route   PATCH /api/bookings/:id/payment
export const recordPayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const { amount, paymentMode, paymentDate, notes } = req.body;
    const paidAmount = Number(amount) || 0;

    booking.balancePaid = (Number(booking.balancePaid) || 0) + paidAmount;
    if (paymentMode) booking.balancePaymentMode = paymentMode;
    booking.balancePaymentDate = paymentDate || new Date().toISOString().split('T')[0];
    if (notes) booking.paymentNotes = notes;

    await booking.save();

    emitPaymentReceived({
      userId: req.user?._id,
      agencyId: req.user?.currentAgency,
      booking,
      amount: paidAmount
    });

    res.status(200).json({
      success: true,
      message: `Payment of ₹${paidAmount.toLocaleString('en-IN')} recorded successfully.`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check vehicle availability for a specific date
// @route   GET /api/bookings/availability
export const checkAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    const checkDate = date || new Date().toISOString().split('T')[0];

    // Fetch all vehicles
    const allVehicles = await Vehicle.find().sort({ registrationNumber: 1 });

    // Fetch all bookings for this date that are scheduled or ongoing
    const activeBookings = await Booking.find({
      $or: [
        { startDate: checkDate },
        {
          startDate: { $lte: checkDate },
          endDate: { $gte: checkDate }
        }
      ],
      status: { $in: ['Scheduled', 'Ongoing'] }
    });

    const bookedVehicleMap = new Map();
    activeBookings.forEach(b => {
      bookedVehicleMap.set(b.vehicle, b);
    });

    const available = [];
    const booked = [];

    allVehicles.forEach(v => {
      const reg = v.registrationNumber;
      if (bookedVehicleMap.has(reg)) {
        const b = bookedVehicleMap.get(reg);
        booked.push({
          vehicle: reg,
          model: v.model || v.type,
          type: v.type,
          bookingId: b._id,
          bookingNumber: b.bookingNumber,
          customerName: b.customerName,
          driverName: b.driverName,
          route: b.route,
          status: b.status,
          fare: b.revenue
        });
      } else {
        available.push({
          vehicle: reg,
          model: v.model || v.type,
          type: v.type,
          currentStatus: v.status,
          assignedDriver: v.assignedDriver || 'None'
        });
      }
    });

    res.status(200).json({
      success: true,
      date: checkDate,
      totalVehicles: allVehicles.length,
      availableCount: available.length,
      bookedCount: booked.length,
      availableVehicles: available,
      bookedVehicles: booked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    emitBookingCancelled({
      userId: req.user?._id,
      agencyId: req.user?.currentAgency,
      booking
    });

    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};
