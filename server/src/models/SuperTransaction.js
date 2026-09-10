import mongoose from 'mongoose';

const superTransactionSchema = new mongoose.Schema(
  {
    txnId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    biz: {
      type: String,
      required: true
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    },
    amount: {
      type: String,
      required: true
    },
    numericAmount: {
      type: Number,
      default: 0
    },
    method: {
      type: String,
      enum: ['UPI', 'Card', 'Netbanking', 'Offline'],
      default: 'UPI'
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'refunded'],
      default: 'success',
      index: true
    },
    type: {
      type: String,
      enum: ['transaction', 'failed', 'refund'],
      default: 'transaction',
      index: true
    },
    reason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

superTransactionSchema.index({ type: 1, createdAt: -1 });

export const SuperTransaction = mongoose.model('SuperTransaction', superTransactionSchema);
