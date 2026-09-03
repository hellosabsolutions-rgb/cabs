import mongoose from 'mongoose';

const monthlyBillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    billingMonth: {
      type: String,
      required: true,
      index: true
    },
    baseContractAmount: {
      type: Number,
      required: true
    },
    totalKmRun: {
      type: Number,
      default: 0
    },
    extraKmCost: {
      type: Number,
      default: 0
    },
    extraHoursCost: {
      type: Number,
      default: 0
    },
    tollParkingCost: {
      type: Number,
      default: 0
    },
    totalBill: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    balanceDue: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['Sent', 'Paid', 'Pending', 'Overdue', 'Draft'],
      default: 'Sent',
      index: true
    },
    dueDate: {
      type: String,
      required: true
    },
    invoicePdf: {
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

export const MonthlyBill = mongoose.model('MonthlyBill', monthlyBillSchema);
