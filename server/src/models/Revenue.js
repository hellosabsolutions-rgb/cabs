import mongoose from 'mongoose';

const revenueSchema = new mongoose.Schema(
  {
    revenueId: {
      type: String,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['Trip', 'Department', 'Other'],
      required: true,
      index: true
    },
    sourceType: {
      type: String,
      enum: ['Booking', 'DepartmentBill', 'Manual'],
      default: 'Manual',
      index: true
    },
    sourceId: {
      type: String,
      trim: true,
      index: true
    },
    vehicle: {
      type: String,
      trim: true,
      index: true
    },
    driver: {
      type: String,
      trim: true,
      index: true
    },
    customer: {
      type: String,
      trim: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    dueDate: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    receivedAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['Received', 'Partial', 'Pending', 'Overdue'],
      default: 'Pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Pending', 'Other'],
      default: 'Pending'
    },
    referenceNo: {
      type: String,
      trim: true
    },
    directCosts: {
      fuelCost: { type: Number, default: 0 },
      driverCost: { type: Number, default: 0 },
      fastagCost: { type: Number, default: 0 },
      totalDirectCost: { type: Number, default: 0 }
    },
    profit: {
      type: Number,
      default: 0
    },
    margin: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Compound index for idempotency across bookings and department bills
revenueSchema.index({ sourceType: 1, sourceId: 1 });
revenueSchema.index({ date: -1, vehicle: 1 });

export const Revenue = mongoose.model('Revenue', revenueSchema);
