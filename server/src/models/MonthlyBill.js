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
    billType: {
      type: String,
      enum: ['Monthly Tender Rent', 'Weekend / Off-Duty Cash Memo'],
      default: 'Monthly Tender Rent',
      index: true
    },
    dailyDutyLogId: {
      type: String,
      default: null,
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
    packageFreeKm: {
      type: Number,
      default: 80
    },
    extraKmRate: {
      type: Number,
      default: 14
    },
    journeyFrom: {
      type: String,
      default: null,
      trim: true
    },
    journeyTo: {
      type: String,
      default: null,
      trim: true
    },
    dutyStartDate: {
      type: String,
      default: null
    },
    dutyEndDate: {
      type: String,
      default: null
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
    extraDriverAllowance: {
      type: Number,
      default: 0
    },
    fuelAvgKmpl: {
      type: Number,
      default: 0
    },
    fuelLitresUsed: {
      type: Number,
      default: 0
    },
    fuelRatePerLitre: {
      type: Number,
      default: 0
    },
    fuelCost: {
      type: Number,
      default: 0
    },
    nightCount: {
      type: Number,
      default: 0
    },
    nightRate: {
      type: Number,
      default: 0
    },
    nightCost: {
      type: Number,
      default: 0
    },
    tollParkingCost: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      default: 0
    },
    gstRate: {
      type: Number,
      default: 0
    },
    gstType: {
      type: String,
      enum: ['CGST_SGST', 'IGST'],
      default: 'CGST_SGST'
    },
    gstTaxableOn: {
      type: String,
      enum: ['RENT_ONLY', 'TOTAL'],
      default: 'TOTAL'
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    cgstAmount: {
      type: Number,
      default: 0
    },
    sgstAmount: {
      type: Number,
      default: 0
    },
    igstAmount: {
      type: Number,
      default: 0
    },
    partyGstin: {
      type: String,
      default: null,
      trim: true
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
