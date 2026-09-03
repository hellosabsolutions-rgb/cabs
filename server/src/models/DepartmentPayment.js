import mongoose from 'mongoose';

const departmentPaymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    paymentDate: {
      type: String,
      required: true,
      index: true
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMode: {
      type: String,
      enum: ['NEFT / RTGS', 'Treasury Challan', 'Cheque', 'UPI', 'Direct Transfer'],
      default: 'NEFT / RTGS'
    },
    referenceNo: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Received', 'Reconciled', 'Processing'],
      default: 'Received',
      index: true
    },
    remarks: {
      type: String,
      trim: true
    },
    paymentProof: {
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

export const DepartmentPayment = mongoose.model('DepartmentPayment', departmentPaymentSchema);
