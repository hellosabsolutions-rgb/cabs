import mongoose from 'mongoose';

export const TRIP_EXPENSE_CATEGORIES = [
  'Toll',
  'Food',
  'Parking',
  'Repair',
  'Loading',
  'Maintenance',
  'Other'
];

const tripExpenseSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    bookingNumber: {
      type: String,
      trim: true,
      default: ''
    },
    driverId: {
      type: String,
      required: true,
      index: true
    },
    driverName: {
      type: String,
      trim: true,
      default: ''
    },
    vehicle: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: TRIP_EXPENSE_CATEGORIES,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    receipt: {
      type: String,
      default: null
    },
    createdBy: {
      type: String,
      enum: ['driver', 'admin'],
      default: 'driver',
      index: true
    },
    createdByName: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Approved', 'Pending', 'Paid'],
      default: 'Pending',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.bookingId = ret.bookingId?.toString?.() || ret.bookingId;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

tripExpenseSchema.index({ bookingId: 1, createdAt: -1 });
tripExpenseSchema.index({ driverId: 1, date: -1 });

export const TripExpense = mongoose.model('TripExpense', tripExpenseSchema);
