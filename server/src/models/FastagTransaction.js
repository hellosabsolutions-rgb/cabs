import mongoose from 'mongoose';

const fastagTransactionSchema = new mongoose.Schema(
  {
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    tagId: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['Toll Deduction', 'Recharge'],
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    time: {
      type: String,
      default: '10:00 AM'
    },
    tollPlaza: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    lane: {
      type: String,
      trim: true
    },
    transactionRef: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    linkedDutyOrTrip: {
      type: String,
      trim: true
    },
    proofSlip: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['Successful', 'Pending', 'Disputed'],
      default: 'Successful',
      index: true
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

fastagTransactionSchema.index({ vehicle: 1, date: -1 });

export const FastagTransaction = mongoose.model('FastagTransaction', fastagTransactionSchema);
