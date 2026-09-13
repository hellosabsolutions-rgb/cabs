import mongoose from 'mongoose';

export const DRIVER_EXPENSE_CATEGORIES = [
  'Daily Bata / Food',
  'Night Halt Allowance',
  'Advance Payout',
  'Overtime',
  'Toll / Cash Reimbursement',
  'Uniform / Misc',
  'Toll',
  'Food',
  'Parking',
  'Repair',
  'Loading',
  'Maintenance',
  'Other'
];

const driverExpenseSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    },
    driverId: {
      type: String,
      required: true,
      index: true
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
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
      enum: DRIVER_EXPENSE_CATEGORIES
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Approved', 'Pending', 'Paid'],
      default: 'Pending',
      index: true
    },
    remarks: {
      type: String,
      trim: true
    },
    receipt: {
      type: String,
      default: null
    },
    createdBy: {
      type: String,
      enum: ['driver', 'admin'],
      default: 'admin',
      index: true
    },
    createdByName: {
      type: String,
      trim: true,
      default: ''
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

driverExpenseSchema.index({ driverId: 1, date: -1 });

export const DriverExpense = mongoose.model('DriverExpense', driverExpenseSchema);
