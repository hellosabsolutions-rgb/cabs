import mongoose from 'mongoose';

const driverExpenseSchema = new mongoose.Schema(
  {
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
      enum: [
        'Daily Bata / Food',
        'Night Halt Allowance',
        'Advance Payout',
        'Overtime',
        'Toll / Cash Reimbursement',
        'Uniform / Misc'
      ]
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
