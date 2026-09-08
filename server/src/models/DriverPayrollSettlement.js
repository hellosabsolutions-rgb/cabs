import mongoose from 'mongoose';

const driverPayrollSettlementSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: [true, 'Driver ID is required'],
      index: true
    },
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true
    },
    month: {
      type: String,
      required: [true, 'Settlement month (YYYY-MM) is required'],
      index: true
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0
    },
    advancesDeducted: {
      type: Number,
      default: 0,
      min: 0
    },
    challansDeducted: {
      type: Number,
      default: 0,
      min: 0
    },
    netPaid: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'DUE', 'ADVANCE RUNNING'],
      default: 'PAID',
      index: true
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
      default: 'Cash'
    },
    paymentDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    remarks: {
      type: String,
      trim: true
    },
    deductedAdvanceIds: [
      {
        type: String
      }
    ],
    deductedPenaltyIds: [
      {
        type: String
      }
    ],
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    }
  }
);

// Unique index so a driver only has 1 settlement per month
driverPayrollSettlementSchema.index({ driverId: 1, month: 1 }, { unique: true });

export const DriverPayrollSettlement = mongoose.model(
  'DriverPayrollSettlement',
  driverPayrollSettlementSchema
);
