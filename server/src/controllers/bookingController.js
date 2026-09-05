import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';

// @desc    Get all bookings with optional filters (month, date, status, paymentStatus, search)
// @route   GET /api/bookings
export const getAllBookings = async (req, res, next) => {
  try {
    const { month, date, status, paymentStatus, vehicle, search } = req.query;
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

// @desc    Update booking details
// @route   PUT /api/bookings/:id
export const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    Object.assign(booking, req.body);
    await booking.save();

    res.status(200).json({ success: true, data: booking });
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
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};
